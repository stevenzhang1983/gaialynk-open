import { listAuditEventsAsync } from "../audit/audit.store";
import type { TrustDecision } from "./trust.engine";
import { buildUserFacingMessageFromReasonCodes } from "@gaialynk/shared";

/**
 * Resolves trilingual summary for a pending invocation (from audit trust_decision or payload reason_codes).
 */
export async function resolveUserFacingSummaryForInvocationAsync(
  invocationId: string,
  conversationId: string,
): Promise<{ zh: string; en: string; ja: string }> {
  const { data: events } = await listAuditEventsAsync({
    conversationId,
    eventType: "invocation.pending_confirmation",
    limit: 200,
    sortOrder: "desc",
  });
  for (const e of events) {
    if (e.payload?.invocation_id === invocationId) {
      const td = e.trust_decision as TrustDecision | undefined;
      if (td?.user_facing_message) {
        return td.user_facing_message;
      }
      const codes = e.payload.reason_codes;
      if (Array.isArray(codes) && codes.every((x) => typeof x === "string")) {
        return buildUserFacingMessageFromReasonCodes(codes as string[]);
      }
    }
  }
  return buildUserFacingMessageFromReasonCodes(["trust_review_pending"]);
}
