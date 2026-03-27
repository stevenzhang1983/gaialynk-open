import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const s = process.env.CONNECTOR_OAUTH_STATE_SECRET?.trim() || process.env.JWT_SECRET?.trim();
  if (s && s.length >= 16) return s;
  if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
    return "test-oauth-state-secret-16";
  }
  throw new Error("CONNECTOR_OAUTH_STATE_SECRET or JWT_SECRET (16+ chars) required for OAuth state");
}

export interface OAuthStatePayload {
  userId: string;
  provider: string;
  nonce: string;
  exp: number;
  /** Google Calendar: read | write OAuth scope mode */
  calendar_scope?: "read" | "write";
  /** Website locale for post-OAuth redirect (e.g. en, zh-Hans) */
  ui_locale?: string;
}

export function signOAuthState(payload: OAuthStatePayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(token: string): OAuthStatePayload | null {
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OAuthStatePayload;
    if (typeof payload.userId !== "string" || typeof payload.provider !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
