import type { NextRequest } from "next/server";

export const SESSION_USER_COOKIE = "gaialynk_session_user_id";

export function getSessionUserIdFromRequest(request: NextRequest): string | null {
  let rawUserId: string | undefined;
  if ("cookies" in request && request.cookies && typeof request.cookies.get === "function") {
    rawUserId = request.cookies.get(SESSION_USER_COOKIE)?.value;
  } else {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const parts = cookieHeader.split(";").map((item) => item.trim());
    const entry = parts.find((item) => item.startsWith(`${SESSION_USER_COOKIE}=`));
    rawUserId = entry ? decodeURIComponent(entry.slice(`${SESSION_USER_COOKIE}=`.length)) : undefined;
  }
  const userId = rawUserId?.trim();
  return userId ? userId : null;
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

