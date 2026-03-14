import { randomUUID } from "node:crypto";
import type { TrustDecision } from "../trust/trust.engine";

export interface AuditEvent {
  id: string;
  event_type: string;
  conversation_id?: string;
  agent_id?: string;
  actor_type: "user" | "agent" | "system";
  actor_id: string;
  payload: Record<string, unknown>;
  trust_decision?: TrustDecision;
  correlation_id: string;
  created_at: string;
}

interface EmitAuditEventInput {
  eventType: string;
  conversationId?: string;
  agentId?: string;
  actorType: "user" | "agent" | "system";
  actorId: string;
  payload: Record<string, unknown>;
  trustDecision?: TrustDecision;
  correlationId: string;
}

interface ListAuditEventsQuery {
  eventType?: string;
  conversationId?: string;
  cursor?: string;
  limit?: number;
}

interface ListAuditEventsResult {
  data: AuditEvent[];
  nextCursor: string | null;
}

const auditEvents: AuditEvent[] = [];

export const emitAuditEvent = (input: EmitAuditEventInput): AuditEvent => {
  const auditEvent: AuditEvent = {
    id: randomUUID(),
    event_type: input.eventType,
    conversation_id: input.conversationId,
    agent_id: input.agentId,
    actor_type: input.actorType,
    actor_id: input.actorId,
    payload: input.payload,
    trust_decision: input.trustDecision,
    correlation_id: input.correlationId,
    created_at: new Date().toISOString(),
  };

  auditEvents.push(auditEvent);

  return auditEvent;
};

export const listAuditEvents = (query?: ListAuditEventsQuery): ListAuditEventsResult => {
  const limit = query?.limit ?? 50;
  const startIndex = Number(query?.cursor ?? "0");

  const filtered = auditEvents.filter((event) => {
    if (query?.eventType && event.event_type !== query.eventType) {
      return false;
    }
    if (query?.conversationId && event.conversation_id !== query.conversationId) {
      return false;
    }
    return true;
  });

  const page = filtered.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < filtered.length ? String(startIndex + limit) : null;

  return {
    data: page,
    nextCursor,
  };
};

export const resetAuditStore = (): void => {
  auditEvents.length = 0;
};
