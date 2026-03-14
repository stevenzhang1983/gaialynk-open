import { randomUUID } from "node:crypto";

export interface Invocation {
  id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  user_text: string;
  status: "pending_confirmation" | "completed";
  created_at: string;
  updated_at: string;
}

interface CreatePendingInvocationInput {
  conversationId: string;
  agentId: string;
  requesterId: string;
  userText: string;
}

const invocations = new Map<string, Invocation>();

export const createPendingInvocation = (input: CreatePendingInvocationInput): Invocation => {
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

export const getInvocationById = (invocationId: string): Invocation | null => {
  return invocations.get(invocationId) ?? null;
};

export const markInvocationCompleted = (invocationId: string): Invocation | null => {
  const invocation = invocations.get(invocationId);
  if (!invocation) {
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

export const resetInvocationStore = (): void => {
  invocations.clear();
};
