import { NextResponse, type NextRequest } from "next/server";
import { getUserIdFromAccessToken } from "@/lib/auth/jwt";

export const SESSION_USER_COOKIE = "gaialynk_session_user_id";
export const ACCESS_TOKEN_COOKIE = "gaialynk_access_token";
export const REFRESH_TOKEN_COOKIE = "gaialynk_refresh_token";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 min, align with mainline
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

function getCookie(request: NextRequest, name: string): string | null {
  if ("cookies" in request && request.cookies && typeof request.cookies.get === "function") {
    return request.cookies.get(name)?.value ?? null;
  }
  const cookieHeader = request.headers.get("cookie") ?? "";
  const parts = cookieHeader.split(";").map((p) => p.trim());
  const entry = parts.find((p) => p.startsWith(`${name}=`));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(name.length + 1).trim()) || null;
}

/**
 * Prefer T-5.3 token: verify access_token cookie and return sub (user id).
 * Fall back to legacy gaialynk_session_user_id for backward compatibility.
 */
export function getSessionUserIdFromRequest(request: NextRequest): string | null {
  const accessToken = getCookie(request, ACCESS_TOKEN_COOKIE);
  if (accessToken) {
    const userId = getUserIdFromAccessToken(accessToken);
    if (userId) return userId;
  }
  const legacy = getCookie(request, SESSION_USER_COOKIE);
  const trimmed = legacy?.trim();
  return trimmed || null;
}

export function getAccessTokenFromRequest(request: NextRequest): string | null {
  return getCookie(request, ACCESS_TOKEN_COOKIE) || null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return getCookie(request, REFRESH_TOKEN_COOKIE) || null;
}

export function buildMainlineActorHeaders(
  request: NextRequest,
  options?: { includeJsonContentType?: boolean },
): HeadersInit {
  const headers: Record<string, string> = {};
  if (options?.includeJsonContentType) {
    headers["content-type"] = "application/json";
  }
  const userId = getSessionUserIdFromRequest(request);
  const accessToken = getAccessTokenFromRequest(request);
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (userId) {
    headers["X-Actor-Id"] = userId;
    headers["X-Actor-Role"] = "user";
  }
  const trustToken = process.env.MAINLINE_ACTOR_TRUST_TOKEN?.trim() ?? process.env.ACTOR_TRUST_TOKEN?.trim();
  if (trustToken) {
    headers["X-Actor-Trust-Token"] = trustToken;
  }
  return headers;
}

export function buildAuthCookieResponse(
  accessToken: string,
  refreshToken: string,
  status: number,
  body: object,
): NextResponse {
  const res = NextResponse.json(body, { status });
  res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    ...COOKIE_OPTS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...COOKIE_OPTS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
  return res;
}

export function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.set(ACCESS_TOKEN_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set(REFRESH_TOKEN_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  res.cookies.set(SESSION_USER_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
