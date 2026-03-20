import type { Context } from "hono";
import { z } from "zod";
import {
  createUserAsync,
  createRefreshTokenAsync,
  findUserIdByRefreshTokenAsync,
  getUserByEmailAsync,
  getUserByIdAsync,
  updateUserRoleAsync,
  verifyPassword,
  type UserRole,
} from "./user.store";
import {
  signAccessToken,
  verifyAccessToken,
  getAccessTokenTtlSeconds,
  getRefreshTokenTtlSeconds,
} from "./jwt";

export const AUTH_USER_CONTEXT_KEY = "auth_user";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
  role: z.enum(["provider", "consumer"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

const roleSchema = z.object({
  role: z.enum(["provider", "consumer"]),
});

function getBearerToken(c: Context): string | null {
  const auth = c.req.header("Authorization")?.trim();
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

export function requireAuth(c: Context): { userId: string; email: string; role: UserRole } | null {
  const payload = c.get(AUTH_USER_CONTEXT_KEY) as { userId: string; email: string; role: UserRole } | undefined;
  return payload ?? null;
}

export function createAuthMeMiddleware(): (c: Context, next: () => Promise<void>) => Promise<Response | void> {
  return async (c: Context, next: () => Promise<void>) => {
    const token = getBearerToken(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Authorization Bearer required" } }, 401);
    }
    const payload = verifyAccessToken(token);
    if (!payload) {
      return c.json({ error: { code: "invalid_token", message: "Invalid or expired token" } }, 401);
    }
    c.set(AUTH_USER_CONTEXT_KEY, { userId: payload.sub, email: payload.email, role: payload.role });
    await next();
  };
}

export function registerAuthRoutes(app: import("hono").Hono): void {
  app.post("/api/v1/auth/register", async (c) => {
    const parsed = registerSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid email or password", details: parsed.error.flatten() } },
        400,
      );
    }
    const { email, password, role } = parsed.data;
    const existing = await getUserByEmailAsync(email);
    if (existing) {
      return c.json({ error: { code: "email_taken", message: "Email already registered" } }, 409);
    }
    const user = await createUserAsync({ email, password, role });
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const { token: refreshToken, expiresAt } = await createRefreshTokenAsync(
      user.id,
      getRefreshTokenTtlSeconds(),
    );
    return c.json(
      {
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: getAccessTokenTtlSeconds(),
          user: { id: user.id, email: user.email, role: user.role },
        },
      },
      201,
    );
  });

  app.post("/api/v1/auth/login", async (c) => {
    const parsed = loginSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid email or password" } },
        400,
      );
    }
    const { email, password } = parsed.data;
    const userWithPassword = await getUserByEmailAsync(email);
    if (!userWithPassword) {
      return c.json({ error: { code: "invalid_credentials", message: "Invalid email or password" } }, 401);
    }
    const ok = verifyPassword(password, userWithPassword.password_salt, userWithPassword.password_hash);
    if (!ok) {
      return c.json({ error: { code: "invalid_credentials", message: "Invalid email or password" } }, 401);
    }
    const user = await getUserByIdAsync(userWithPassword.id);
    if (!user) return c.json({ error: { code: "user_not_found", message: "User not found" } }, 500);
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const { token: refreshToken } = await createRefreshTokenAsync(user.id, getRefreshTokenTtlSeconds());
    return c.json({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: getAccessTokenTtlSeconds(),
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  });

  app.post("/api/v1/auth/refresh", async (c) => {
    const parsed = refreshSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "invalid_input", message: "refresh_token required" } }, 400);
    }
    const userId = await findUserIdByRefreshTokenAsync(parsed.data.refresh_token);
    if (!userId) {
      return c.json({ error: { code: "invalid_refresh_token", message: "Invalid or expired refresh token" } }, 401);
    }
    const user = await getUserByIdAsync(userId);
    if (!user) return c.json({ error: { code: "user_not_found", message: "User not found" } }, 401);
    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const { token: refreshToken } = await createRefreshTokenAsync(user.id, getRefreshTokenTtlSeconds());
    return c.json({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: getAccessTokenTtlSeconds(),
        user: { id: user.id, email: user.email, role: user.role },
      },
    });
  });

  const authMeMiddleware = createAuthMeMiddleware();

  app.get("/api/v1/auth/me", authMeMiddleware, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const user = await getUserByIdAsync(auth.userId);
    if (!user) return c.json({ error: { code: "user_not_found", message: "User not found" } }, 404);
    return c.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  });

  app.put("/api/v1/auth/me/role", authMeMiddleware, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const parsed = roleSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "invalid_input", message: "role must be provider or consumer" } }, 400);
    }
    const updated = await updateUserRoleAsync(auth.userId, parsed.data.role);
    if (!updated) return c.json({ error: { code: "user_not_found", message: "User not found" } }, 404);
    return c.json({
      data: { id: updated.id, email: updated.email, role: updated.role },
    });
  });

  app.get("/api/v1/auth/oauth/:provider", async (c) => {
    const provider = c.req.param("provider").toLowerCase();
    if (provider === "github") {
      const clientId = process.env.GITHUB_CLIENT_ID?.trim();
      const redirectBase = process.env.OAUTH_REDIRECT_BASE?.trim() || "http://localhost:3000";
      if (!clientId) {
        return c.json({ error: { code: "oauth_not_configured", message: "GitHub OAuth not configured" } }, 503);
      }
      const state = crypto.randomUUID();
      const redirectUri = `${redirectBase}/api/v1/auth/oauth/github/callback`;
      const url = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${encodeURIComponent(state)}`;
      return c.redirect(url);
    }
    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      const redirectBase = process.env.OAUTH_REDIRECT_BASE?.trim() || "http://localhost:3000";
      if (!clientId) {
        return c.json({ error: { code: "oauth_not_configured", message: "Google OAuth not configured" } }, 503);
      }
      const state = crypto.randomUUID();
      const redirectUri = `${redirectBase}/api/v1/auth/oauth/google/callback`;
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${encodeURIComponent(state)}`;
      return c.redirect(url);
    }
    return c.json({ error: { code: "unsupported_provider", message: "Unsupported OAuth provider" } }, 400);
  });

  app.get("/api/v1/auth/oauth/:provider/callback", async (c) => {
    const provider = c.req.param("provider").toLowerCase();
    const code = c.req.query("code");
    if (!code) {
      return c.json({ error: { code: "missing_code", message: "OAuth callback missing code" } }, 400);
    }
    const redirectBase = process.env.OAUTH_REDIRECT_BASE?.trim() || "http://localhost:3000";
    if (provider === "github") {
      const clientId = process.env.GITHUB_CLIENT_ID?.trim();
      const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
      if (!clientId || !clientSecret) {
        return c.json({ error: { code: "oauth_not_configured", message: "GitHub OAuth not configured" } }, 503);
      }
      const redirectUri = `${redirectBase}/api/v1/auth/oauth/github/callback`;
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        return c.json({ error: { code: "oauth_exchange_failed", message: tokenData.error ?? "Failed to get access token" } }, 400);
      }
      const userRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const ghUser = (await userRes.json()) as { id: number; email?: string; login?: string };
      const email = ghUser.email ?? `${ghUser.id}@github.local`;
      let userWithPassword = await getUserByEmailAsync(email);
      if (!userWithPassword) {
        const newUser = await createUserAsync({
          email,
          password: crypto.randomUUID() + crypto.randomUUID(),
          role: "consumer",
        });
        const user = await getUserByIdAsync(newUser.id);
        if (!user) return c.json({ error: { code: "user_creation_failed", message: "Failed to create user" } }, 500);
        const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
        const { token: refreshToken } = await createRefreshTokenAsync(user.id, getRefreshTokenTtlSeconds());
        return c.json({
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: getAccessTokenTtlSeconds(),
            user: { id: user.id, email: user.email, role: user.role },
          },
        });
      }
      const user = await getUserByIdAsync(userWithPassword.id);
      if (!user) return c.json({ error: { code: "user_not_found", message: "User not found" } }, 500);
      const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
      const { token: refreshToken } = await createRefreshTokenAsync(user.id, getRefreshTokenTtlSeconds());
      return c.json({
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: getAccessTokenTtlSeconds(),
          user: { id: user.id, email: user.email, role: user.role },
        },
      });
    }
    if (provider === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
      if (!clientId || !clientSecret) {
        return c.json({ error: { code: "oauth_not_configured", message: "Google OAuth not configured" } }, 503);
      }
      const redirectUri = `${redirectBase}/api/v1/auth/oauth/google/callback`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        return c.json({ error: { code: "oauth_exchange_failed", message: tokenData.error ?? "Failed to get access token" } }, 400);
      }
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googUser = (await userRes.json()) as { id: string; email?: string };
      const email = googUser.email ?? `${googUser.id}@google.local`;
      let userWithPassword = await getUserByEmailAsync(email);
      if (!userWithPassword) {
        const newUser = await createUserAsync({
          email,
          password: crypto.randomUUID() + crypto.randomUUID(),
          role: "consumer",
        });
        const user = await getUserByIdAsync(newUser.id);
        if (!user) return c.json({ error: { code: "user_creation_failed", message: "Failed to create user" } }, 500);
        const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
        const { token: refreshToken } = await createRefreshTokenAsync(user.id, getRefreshTokenTtlSeconds());
        return c.json({
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_in: getAccessTokenTtlSeconds(),
            user: { id: user.id, email: user.email, role: user.role },
          },
        });
      }
      const user = await getUserByIdAsync(userWithPassword.id);
      if (!user) return c.json({ error: { code: "user_not_found", message: "User not found" } }, 500);
      const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
      const { token: refreshToken } = await createRefreshTokenAsync(user.id, getRefreshTokenTtlSeconds());
      return c.json({
        data: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: getAccessTokenTtlSeconds(),
          user: { id: user.id, email: user.email, role: user.role },
        },
      });
    }
    return c.json({ error: { code: "unsupported_provider", message: "Unsupported OAuth provider" } }, 400);
  });
}
