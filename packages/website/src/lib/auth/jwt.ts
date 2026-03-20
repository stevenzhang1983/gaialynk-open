import { createHmac } from "node:crypto";

/**
 * Verify mainline-issued access token (HS256) and return payload sub (user id).
 * Uses same JWT_SECRET as mainline; website must have it set for token-based session.
 */
function getSecret(): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 16) return null;
  return secret;
}

function base64UrlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

export type AccessPayload = { sub: string; email?: string; role?: string; iat?: number; exp?: number };

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const secret = getSecret();
    if (!secret) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const expectedSig = createHmac("sha256", secret).update(`${headerB64}.${payloadB64}`).digest("base64url");
    if (expectedSig !== sigB64) return null;
    const payload = JSON.parse(base64UrlDecode(payloadB64)) as AccessPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp != null && payload.exp < now) return null;
    if (payload.iat != null && payload.iat > now) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getUserIdFromAccessToken(token: string): string | null {
  const payload = verifyAccessToken(token);
  return payload?.sub?.trim() ?? null;
}
