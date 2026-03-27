import type { Context, MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../modules/auth/jwt";
import {
  checkRateLimit,
  getRateLimitDirectorySearchPerMinute,
  getRateLimitMessagePerMinute,
  getRateLimitRegisterPerHour,
} from "../infra/rate-limiter";

const RATE_LIMIT_MESSAGE = "操作过频，请稍后再试";

function getClientIp(c: Context): string {
  const fwd = c.req.header("X-Forwarded-For")?.trim();
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const cf = c.req.header("CF-Connecting-IP")?.trim();
  if (cf) return cf;
  return c.req.header("X-Real-IP")?.trim() || "unknown";
}

function optionalJwtSub(c: Context): string | undefined {
  const auth = c.req.header("Authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const payload = bearer ? verifyAccessToken(bearer) : null;
  return payload?.sub;
}

function rateLimitResponse(c: Context, retryAfterMs: number): Response {
  const sec = Math.max(1, Math.ceil(retryAfterMs / 1000));
  c.header("Retry-After", String(sec));
  return c.json(
    {
      error: {
        code: "rate_limit_exceeded",
        message: RATE_LIMIT_MESSAGE,
      },
    },
    429,
  );
}

/**
 * E-18: register (per IP / hour) + directory search with `search` query (per user or IP / minute).
 * Message POST limits use `enforceMessagePostRateLimit` in `app.ts` (needs parsed `sender_id`).
 */
/** After `sendMessageSchema.parse`, enforce per-sender message rate (E-18). */
export async function enforceMessagePostRateLimit(c: Context, senderId: string): Promise<Response | null> {
  const max = getRateLimitMessagePerMinute();
  const { allowed, retryAfterMs } = await checkRateLimit(`msg:user:${senderId}`, max, 60);
  if (!allowed) {
    const sec = Math.max(1, Math.ceil(retryAfterMs / 1000));
    c.header("Retry-After", String(sec));
    return c.json(
      {
        error: {
          code: "rate_limit_exceeded",
          message: RATE_LIMIT_MESSAGE,
        },
      },
      429,
    );
  }
  return null;
}

export function rateLimitMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;

    if (method === "POST" && path === "/api/v1/auth/register") {
      const ip = getClientIp(c);
      const max = getRateLimitRegisterPerHour();
      const { allowed, retryAfterMs } = await checkRateLimit(`reg:ip:${ip}`, max, 3600);
      if (!allowed) {
        return rateLimitResponse(c, retryAfterMs);
      }
    }

    if (method === "GET" && path === "/api/v1/agents") {
      const search = c.req.query("search")?.trim() ?? "";
      if (search.length > 0) {
        const uid = optionalJwtSub(c);
        const key = uid ? `agents:search:user:${uid}` : `agents:search:ip:${getClientIp(c)}`;
        const max = getRateLimitDirectorySearchPerMinute();
        const { allowed, retryAfterMs } = await checkRateLimit(key, max, 60);
        if (!allowed) {
          return rateLimitResponse(c, retryAfterMs);
        }
      }
    }

    await next();
  };
}

export { RATE_LIMIT_MESSAGE };
