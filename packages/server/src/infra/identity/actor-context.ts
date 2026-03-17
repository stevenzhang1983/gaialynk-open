/**
 * Unified identity context (Launch Closure Checklist 1.1).
 * Trusted source: gateway/middleware (e.g. X-Actor-Id header or future JWT).
 * Body/query actor_id is deprecated and must be audited when used.
 */
export interface ActorContext {
  id: string;
  role?: string;
  scopes?: string[];
  /** Set when actor was resolved from header (trusted); false when from body/query (deprecated). */
  fromTrustedSource: boolean;
}

export const ACTOR_CONTEXT_KEY = "actor";

export function parseActorFromHeaders(headers: Headers): ActorContext | null {
  const id = headers.get("X-Actor-Id")?.trim();
  if (!id) return null;
  const expectedTrustToken = process.env.ACTOR_TRUST_TOKEN?.trim();
  if (expectedTrustToken) {
    const providedTrustToken = headers.get("X-Actor-Trust-Token")?.trim();
    if (!providedTrustToken || providedTrustToken !== expectedTrustToken) {
      return null;
    }
  }
  const role = headers.get("X-Actor-Role")?.trim() || undefined;
  const scopesHeader = headers.get("X-Actor-Scopes");
  const scopes =
    scopesHeader?.split(",").map((s) => s.trim()).filter(Boolean) ?? undefined;
  return { id, role, scopes, fromTrustedSource: true };
}
