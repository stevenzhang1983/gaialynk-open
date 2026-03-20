import { createHmac } from "node:crypto";
import type { UserRole } from "./user.store";

const JWT_HEADER = { alg: "HS256", typ: "JWT" };
const ACCESS_TTL_SECONDS = 15 * 60; // 15 min
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

function base64UrlEncode(obj: object): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
      return "test-jwt-secret-min-16-chars";
    }
    throw new Error("JWT_SECRET must be set and at least 16 characters");
  }
  return secret;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export function signAccessToken(payload: Omit<AccessTokenPayload, "iat" | "exp">): string {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const full: AccessTokenPayload = {
    ...payload,
    iat: now,
    exp: now + ACCESS_TTL_SECONDS,
  };
  const headerB64 = base64UrlEncode(JWT_HEADER);
  const payloadB64 = base64UrlEncode(full);
  const signature = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
    if (expectedSig !== sigB64) return null;
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AccessTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now || payload.iat > now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAccessTokenTtlSeconds(): number {
  return ACCESS_TTL_SECONDS;
}

export function getRefreshTokenTtlSeconds(): number {
  return REFRESH_TTL_SECONDS;
}
