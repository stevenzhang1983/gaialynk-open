import type { Invocation } from "../gateway/invocation.store";
import { getInvocationByIdAsync, listInvocationsAsync } from "../gateway/invocation.store";
import { getDeniedDecisionAsync } from "../gateway/review-decision.store";
import { getAgentByIdAsync } from "../directory/agent.store";
import { listAuditEventsAsync } from "../audit/audit.store";
import type { AuditEvent } from "../audit/audit.store";

export interface ApprovalListItem {
  id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  user_text: string;
  status: Invocation["status"];
  created_at: string;
}

export interface ApprovalDetail {
  id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  user_text: string;
  status: Invocation["status"];
  created_at: string;
  updated_at: string;
  agent: {
    id: string;
    name: string;
    description: string;
    agent_type: string;
    capabilities: unknown;
  };
}

export interface ApprovalChainEvent {
  event_type: string;
  actor_type: string;
  actor_id: string;
  trust_decision?: unknown;
  created_at: string;
  payload?: Record<string, unknown>;
}

/**
 * List pending approvals (invocations with status pending_confirmation, excluding denied).
 */
export async function listApprovalsAsync(opts?: {
  conversation_id?: string;
}): Promise<ApprovalListItem[]> {
  const invocations = await listInvocationsAsync({
    status: "pending_confirmation",
    conversationId: opts?.conversation_id,
  });
  const items: ApprovalListItem[] = [];
  for (const inv of invocations) {
    const denied = await getDeniedDecisionAsync(inv.id);
    if (denied) continue;
    items.push({
      id: inv.id,
      conversation_id: inv.conversation_id,
      agent_id: inv.agent_id,
      requester_id: inv.requester_id,
      user_text: inv.user_text,
      status: inv.status,
      created_at: inv.created_at,
    });
  }
  return items.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/**
 * Get approval detail by invocation id; returns 404 if not found or already denied/completed.
 */
export async function getApprovalDetailAsync(
  approvalId: string,
): Promise<ApprovalDetail | null> {
  const invocation = await getInvocationByIdAsync(approvalId);
  if (!invocation) return null;
  if (invocation.status !== "pending_confirmation") return null;
  const denied = await getDeniedDecisionAsync(invocation.id);
  if (denied) return null;

  const agent = await getAgentByIdAsync(invocation.agent_id);
  if (!agent) return null;

  return {
    id: invocation.id,
    conversation_id: invocation.conversation_id,
    agent_id: invocation.agent_id,
    requester_id: invocation.requester_id,
    user_text: invocation.user_text,
    status: invocation.status,
    created_at: invocation.created_at,
    updated_at: invocation.updated_at,
    agent: {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      agent_type: agent.agent_type,
      capabilities: agent.capabilities,
    },
  };
}

function isInvocationEvent(event: AuditEvent, invocationId: string): boolean {
  const pid = event.payload?.invocation_id;
  return pid === invocationId;
}

/**
 * Get audit chain for an approval (invocation): all events whose payload references this invocation_id.
 */
export async function getApprovalChainAsync(
  approvalId: string,
): Promise<ApprovalChainEvent[]> {
  const invocation = await getInvocationByIdAsync(approvalId);
  if (!invocation) return [];

  const { data: events } = await listAuditEventsAsync({
    conversationId: invocation.conversation_id,
    limit: 200,
  });
  const related = events
    .filter((e) => isInvocationEvent(e, approvalId))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return related.map((e) => ({
    event_type: e.event_type,
    actor_type: e.actor_type,
    actor_id: e.actor_id,
    trust_decision: e.trust_decision,
    created_at: e.created_at,
    payload: e.payload,
  }));
}
