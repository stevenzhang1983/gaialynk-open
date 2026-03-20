import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
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
  agentId?: string;
  actorType?: "user" | "agent" | "system";
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
  sortOrder?: "asc" | "desc";
}

interface ListAuditEventsResult {
  data: AuditEvent[];
  nextCursor: string | null;
}

const auditEvents: AuditEvent[] = [];

export const emitAuditEvent = (input: EmitAuditEventInput): AuditEvent => {
  if (isPostgresEnabled()) {
    throw new Error("Use emitAuditEventAsync in PostgreSQL mode");
  }

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
  if (isPostgresEnabled()) {
    throw new Error("Use listAuditEventsAsync in PostgreSQL mode");
  }

  const limit = query?.limit ?? 50;
  const startIndex = Number(query?.cursor ?? "0");

  const filtered = auditEvents.filter((event) => {
    if (query?.eventType && event.event_type !== query.eventType) {
      return false;
    }
    if (query?.conversationId && event.conversation_id !== query.conversationId) {
      return false;
    }
    if (query?.agentId && event.agent_id !== query.agentId) {
      return false;
    }
    if (query?.actorType && event.actor_type !== query.actorType) {
      return false;
    }
    if (query?.from && Date.parse(event.created_at) < Date.parse(query.from)) {
      return false;
    }
    if (query?.to && Date.parse(event.created_at) > Date.parse(query.to)) {
      return false;
    }
    return true;
  });

  const order = query?.sortOrder === "desc" ? "desc" : "asc";
  const sorted =
    order === "desc"
      ? [...filtered].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
      : filtered;
  const page = sorted.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < sorted.length ? String(startIndex + limit) : null;

  return {
    data: page,
    nextCursor,
  };
};

export const emitAuditEventAsync = async (input: EmitAuditEventInput): Promise<AuditEvent> => {
  if (!isPostgresEnabled()) {
    return emitAuditEvent(input);
  }

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

  await query(
    `INSERT INTO audit_events
     (id, event_type, conversation_id, agent_id, actor_type, actor_id, payload, trust_decision, correlation_id, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)`,
    [
      auditEvent.id,
      auditEvent.event_type,
      auditEvent.conversation_id ?? null,
      auditEvent.agent_id ?? null,
      auditEvent.actor_type,
      auditEvent.actor_id,
      JSON.stringify(auditEvent.payload),
      JSON.stringify(auditEvent.trust_decision ?? null),
      auditEvent.correlation_id,
      auditEvent.created_at,
    ],
  );

  return auditEvent;
};

export const listAuditEventsAsync = async (queryParams?: ListAuditEventsQuery): Promise<ListAuditEventsResult> => {
  if (!isPostgresEnabled()) {
    return listAuditEvents(queryParams);
  }

  const limit = queryParams?.limit ?? 50;
  const offset = Number(queryParams?.cursor ?? "0");

  const clauses: string[] = [];
  const values: unknown[] = [];

  if (queryParams?.eventType) {
    values.push(queryParams.eventType);
    clauses.push(`event_type = $${values.length}`);
  }
  if (queryParams?.conversationId) {
    values.push(queryParams.conversationId);
    clauses.push(`conversation_id = $${values.length}`);
  }
  if (queryParams?.agentId) {
    values.push(queryParams.agentId);
    clauses.push(`agent_id = $${values.length}`);
  }
  if (queryParams?.actorType) {
    values.push(queryParams.actorType);
    clauses.push(`actor_type = $${values.length}`);
  }
  if (queryParams?.from) {
    values.push(queryParams.from);
    clauses.push(`created_at >= $${values.length}`);
  }
  if (queryParams?.to) {
    values.push(queryParams.to);
    clauses.push(`created_at <= $${values.length}`);
  }

  values.push(limit);
  const limitParam = `$${values.length}`;
  values.push(offset);
  const offsetParam = `$${values.length}`;

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const orderDir = queryParams?.sortOrder === "desc" ? "DESC" : "ASC";
  const rows = await query<{
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
  }>(
    `SELECT id, event_type, conversation_id, agent_id, actor_type, actor_id, payload, trust_decision, correlation_id, created_at::text
     FROM audit_events
     ${where}
     ORDER BY created_at ${orderDir}
     LIMIT ${limitParam}
     OFFSET ${offsetParam}`,
    values,
  );

  const countRows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM audit_events
     ${where}`,
    values.slice(0, values.length - 2),
  );
  const total = Number(countRows[0]?.count ?? "0");
  const nextCursor = offset + rows.length < total ? String(offset + rows.length) : null;

  return {
    data: rows,
    nextCursor,
  };
};

export const getAuditEventById = (eventId: string): AuditEvent | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use getAuditEventByIdAsync in PostgreSQL mode");
  }
  return auditEvents.find((e) => e.id === eventId) ?? null;
};

export const getAuditEventByIdAsync = async (eventId: string): Promise<AuditEvent | null> => {
  if (!isPostgresEnabled()) {
    return getAuditEventById(eventId);
  }

  const rows = await query<{
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
  }>(
    `SELECT id, event_type, conversation_id, agent_id, actor_type, actor_id, payload, trust_decision, correlation_id, created_at::text
     FROM audit_events
     WHERE id = $1`,
    [eventId],
  );

  return rows[0] ?? null;
};

export const resetAuditStore = (): void => {
  auditEvents.length = 0;
};
