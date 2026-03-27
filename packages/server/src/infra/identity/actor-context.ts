/**
 * Unified identity context (Launch Closure Checklist 1.1 + E-1 JWT + E-11 actor_type).
 * Trusted source: X-Actor-Id (+ optional X-Actor-Trust-Token) from gateway, or valid Bearer JWT `sub` (user id).
 * Body/query actor_id is deprecated and must be audited when used.
 */

/** E-11: explicit actor classification for RBAC and audit. */
export type ActorType = "human" | "agent" | "system" | "service";

const ACTOR_TYPES: ReadonlySet<string> = new Set(["human", "agent", "system", "service"]);

function parseActorTypeHeader(raw: string | null): ActorType | undefined {
  const v = raw?.trim().toLowerCase();
  if (!v) return undefined;
  if (!ACTOR_TYPES.has(v)) return undefined;
  return v as ActorType;
}

export interface ActorContext {
  id: string;
  role?: string;
  scopes?: string[];
  /** E-11: from X-Actor-Type or inferred for JWT (human). */
  actor_type?: ActorType;
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
  const actor_type = parseActorTypeHeader(headers.get("X-Actor-Type")) ?? "human";
  return { id, role, scopes, actor_type, fromTrustedSource: true };
}
