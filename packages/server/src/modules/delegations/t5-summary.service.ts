import { randomUUID } from "node:crypto";
import { emitAuditEventAsync } from "../audit/audit.store";
import { recordNotificationEventAsync } from "../notifications/notification.store";

export type T5InterruptReason = "budget_exceeded" | "policy_violation";

/**
 * T5: Record phase summary (default callback). Emits audit and notifies granter.
 */
export async function recordT5PhaseSummaryAsync(params: {
  conversation_id: string;
  delegation_ticket_id: string;
  granter_id: string;
  phase: string;
  summary: string;
}): Promise<void> {
  const correlationId = randomUUID();
  await emitAuditEventAsync({
    eventType: "delegation.phase_summary",
    conversationId: params.conversation_id,
    actorType: "system",
    actorId: "t5-summary",
    payload: {
      delegation_ticket_id: params.delegation_ticket_id,
      granter_id: params.granter_id,
      phase: params.phase,
      summary: params.summary,
    },
    correlationId,
  });

  await recordNotificationEventAsync({
    user_id: params.granter_id,
    event_type: "delegation.phase_summary",
    payload: {
      conversation_id: params.conversation_id,
      delegation_ticket_id: params.delegation_ticket_id,
      phase: params.phase,
      summary: params.summary,
    },
  });
}

/**
 * T5: On budget exceeded or policy violation — interrupt and notify granter.
 */
export async function interruptT5DelegationAsync(params: {
  conversation_id: string;
  delegation_ticket_id: string;
  granter_id: string;
  reason: T5InterruptReason;
  detail?: string;
}): Promise<void> {
  const correlationId = randomUUID();
  await emitAuditEventAsync({
    eventType: "delegation.interrupted",
    conversationId: params.conversation_id,
    actorType: "system",
    actorId: "t5-interrupt",
    payload: {
      delegation_ticket_id: params.delegation_ticket_id,
      granter_id: params.granter_id,
      reason: params.reason,
      detail: params.detail ?? "",
    },
    correlationId,
  });

  await recordNotificationEventAsync({
    user_id: params.granter_id,
    event_type: "delegation.interrupted",
    payload: {
      conversation_id: params.conversation_id,
      delegation_ticket_id: params.delegation_ticket_id,
      reason: params.reason,
      detail: params.detail ?? "",
    },
  });
}
