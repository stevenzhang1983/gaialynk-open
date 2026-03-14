import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface Invocation {
  id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  user_text: string;
  status: "pending_confirmation" | "processing_confirmation" | "completed";
  created_at: string;
  updated_at: string;
}

interface CreatePendingInvocationInput {
  conversationId: string;
  agentId: string;
  requesterId: string;
  userText: string;
}

interface ListInvocationsQuery {
  status?: Invocation["status"];
  conversationId?: string;
}

const invocations = new Map<string, Invocation>();

export const createPendingInvocation = (input: CreatePendingInvocationInput): Invocation => {
  if (isPostgresEnabled()) {
    throw new Error("Use createPendingInvocationAsync in PostgreSQL mode");
  }

  const timestamp = new Date().toISOString();
  const invocation: Invocation = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    agent_id: input.agentId,
    requester_id: input.requesterId,
    user_text: input.userText,
    status: "pending_confirmation",
    created_at: timestamp,
    updated_at: timestamp,
  };

  invocations.set(invocation.id, invocation);

  return invocation;
};

export const createPendingInvocationAsync = async (
  input: CreatePendingInvocationInput,
): Promise<Invocation> => {
  if (!isPostgresEnabled()) {
    return createPendingInvocation(input);
  }

  const timestamp = new Date().toISOString();
  const invocation: Invocation = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    agent_id: input.agentId,
    requester_id: input.requesterId,
    user_text: input.userText,
    status: "pending_confirmation",
    created_at: timestamp,
    updated_at: timestamp,
  };

  await query(
    `INSERT INTO invocations (id, conversation_id, agent_id, requester_id, user_text, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      invocation.id,
      invocation.conversation_id,
      invocation.agent_id,
      invocation.requester_id,
      invocation.user_text,
      invocation.status,
      invocation.created_at,
      invocation.updated_at,
    ],
  );

  return invocation;
};

export const getInvocationById = (invocationId: string): Invocation | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use getInvocationByIdAsync in PostgreSQL mode");
  }

  return invocations.get(invocationId) ?? null;
};

export const getInvocationByIdAsync = async (invocationId: string): Promise<Invocation | null> => {
  if (!isPostgresEnabled()) {
    return getInvocationById(invocationId);
  }

  const rows = await query<Invocation>(
    `SELECT id, conversation_id, agent_id, requester_id, user_text, status, created_at::text, updated_at::text
     FROM invocations
     WHERE id = $1`,
    [invocationId],
  );

  return rows[0] ?? null;
};

export const markInvocationCompleted = (invocationId: string): Invocation | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use markInvocationCompletedAsync in PostgreSQL mode");
  }

  const invocation = invocations.get(invocationId);
  if (!invocation) {
    return null;
  }
  if (invocation.status !== "pending_confirmation" && invocation.status !== "processing_confirmation") {
    return null;
  }

  const updated: Invocation = {
    ...invocation,
    status: "completed",
    updated_at: new Date().toISOString(),
  };

  invocations.set(invocationId, updated);
  return updated;
};

export const markInvocationCompletedAsync = async (invocationId: string): Promise<Invocation | null> => {
  if (!isPostgresEnabled()) {
    return markInvocationCompleted(invocationId);
  }

  const updatedAt = new Date().toISOString();
  const rows = await query<Invocation>(
    `UPDATE invocations
     SET status = 'completed', updated_at = $2
     WHERE id = $1 AND status IN ('pending_confirmation', 'processing_confirmation')
     RETURNING id, conversation_id, agent_id, requester_id, user_text, status, created_at::text, updated_at::text`,
    [invocationId, updatedAt],
  );

  return rows[0] ?? null;
};

export const claimInvocationForProcessing = (invocationId: string): Invocation | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use claimInvocationForProcessingAsync in PostgreSQL mode");
  }

  const invocation = invocations.get(invocationId);
  if (!invocation || invocation.status !== "pending_confirmation") {
    return null;
  }

  const updated: Invocation = {
    ...invocation,
    status: "processing_confirmation",
    updated_at: new Date().toISOString(),
  };
  invocations.set(invocationId, updated);
  return updated;
};

export const claimInvocationForProcessingAsync = async (invocationId: string): Promise<Invocation | null> => {
  if (!isPostgresEnabled()) {
    return claimInvocationForProcessing(invocationId);
  }

  const updatedAt = new Date().toISOString();
  const rows = await query<Invocation>(
    `UPDATE invocations
     SET status = 'processing_confirmation', updated_at = $2
     WHERE id = $1 AND status = 'pending_confirmation'
     RETURNING id, conversation_id, agent_id, requester_id, user_text, status, created_at::text, updated_at::text`,
    [invocationId, updatedAt],
  );
  return rows[0] ?? null;
};

export const rollbackInvocationProcessing = (invocationId: string): Invocation | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use rollbackInvocationProcessingAsync in PostgreSQL mode");
  }

  const invocation = invocations.get(invocationId);
  if (!invocation || invocation.status !== "processing_confirmation") {
    return null;
  }

  const updated: Invocation = {
    ...invocation,
    status: "pending_confirmation",
    updated_at: new Date().toISOString(),
  };
  invocations.set(invocationId, updated);
  return updated;
};

export const rollbackInvocationProcessingAsync = async (invocationId: string): Promise<Invocation | null> => {
  if (!isPostgresEnabled()) {
    return rollbackInvocationProcessing(invocationId);
  }

  const updatedAt = new Date().toISOString();
  const rows = await query<Invocation>(
    `UPDATE invocations
     SET status = 'pending_confirmation', updated_at = $2
     WHERE id = $1 AND status = 'processing_confirmation'
     RETURNING id, conversation_id, agent_id, requester_id, user_text, status, created_at::text, updated_at::text`,
    [invocationId, updatedAt],
  );
  return rows[0] ?? null;
};

export const resetInvocationStore = (): void => {
  invocations.clear();
};

export const listInvocations = (queryParams?: ListInvocationsQuery): Invocation[] => {
  if (isPostgresEnabled()) {
    throw new Error("Use listInvocationsAsync in PostgreSQL mode");
  }

  let list = [...invocations.values()];
  if (queryParams?.status) {
    list = list.filter((item) => item.status === queryParams.status);
  }
  if (queryParams?.conversationId) {
    list = list.filter((item) => item.conversation_id === queryParams.conversationId);
  }
  return list.sort((a, b) => a.created_at.localeCompare(b.created_at));
};

export const listInvocationsAsync = async (queryParams?: ListInvocationsQuery): Promise<Invocation[]> => {
  if (!isPostgresEnabled()) {
    return listInvocations(queryParams);
  }

  const clauses: string[] = [];
  const values: unknown[] = [];

  if (queryParams?.status) {
    values.push(queryParams.status);
    clauses.push(`status = $${values.length}`);
  }
  if (queryParams?.conversationId) {
    values.push(queryParams.conversationId);
    clauses.push(`conversation_id = $${values.length}`);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await query<Invocation>(
    `SELECT id, conversation_id, agent_id, requester_id, user_text, status, created_at::text, updated_at::text
     FROM invocations
     ${where}
     ORDER BY created_at ASC`,
    values,
  );

  return rows;
};
