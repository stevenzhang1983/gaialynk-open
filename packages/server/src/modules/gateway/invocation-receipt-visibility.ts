import { isPostgresEnabled, query } from "../../infra/db/client";
import { listAuditEventsAsync, type AuditEvent } from "../audit/audit.store";
import { getAgentByIdAsync } from "../directory/agent.store";
import { getConversationSummaryAsync } from "../conversation/conversation.store";
import { getMemberRoleAsync, type SpaceMemberRole } from "../spaces/space.store";
import {
  getInvocationByIdAsync,
  type Invocation,
} from "./invocation.store";

export type ReceiptVisibilityRole = "user" | "space_admin" | "developer" | "platform_admin";

export interface InvocationReceiptView {
  id: string;
  conversation_id: string;
  space_id: string | null;
  agent_id: string;
  agent_name: string;
  requester_id: string;
  status: Invocation["status"];
  user_text: string;
  user_text_redacted: boolean;
  created_at: string;
  updated_at: string;
  orchestration_run_id?: string | null;
  orchestration_step_index?: number | null;
  visibility_role: ReceiptVisibilityRole;
  trust_decision?: unknown;
  agent_output_text?: string | null;
  agent_output_truncated?: boolean;
  error_detail?: string | null;
  developer_invocation_stats?: { count_last_30d: number };
}

interface InvocationReceiptBase extends Invocation {
  agent_name: string;
  agent_owner_id: string | null;
  space_id: string | null;
}

const USER_TEXT_SUMMARY_LEN = 320;
const DEV_OUTPUT_SUMMARY_LEN = 400;

function viewerIsPlatformAdmin(viewerUserId: string): boolean {
  const ids = process.env.FOUNDER_DASHBOARD_USER_IDS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return ids?.includes(viewerUserId) ?? false;
}

function summarizeText(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

function eventMatchesInvocation(event: AuditEvent, invocationId: string): boolean {
  const p = event.payload;
  if (p.invocation_id === invocationId) return true;
  const ctx = p.invocation_context as { run_id?: string } | undefined;
  return Boolean(ctx && typeof ctx.run_id === "string" && ctx.run_id === invocationId);
}

async function loadInvocationReceiptBaseAsync(invocationId: string): Promise<InvocationReceiptBase | null> {
  if (!isPostgresEnabled()) {
    const inv = await getInvocationByIdAsync(invocationId);
    if (!inv) return null;
    const agent = await getAgentByIdAsync(inv.agent_id);
    const sum = await getConversationSummaryAsync(inv.conversation_id);
    return {
      ...inv,
      agent_name: agent?.name ?? "",
      agent_owner_id: agent?.owner_id ?? null,
      space_id: sum?.space_id ?? null,
    };
  }

  type Row = Invocation & {
    agent_name: string;
    agent_owner_id: string | null;
    space_id: string | null;
  };
  const cols = `i.id, i.conversation_id, i.agent_id, i.requester_id, i.user_text, i.status,
    i.created_at::text, i.updated_at::text, i.orchestration_run_id, i.orchestration_step_index,
    a.name AS agent_name, a.owner_id::text AS agent_owner_id, c.space_id::text AS space_id`;
  const rows = await query<Row>(
    `SELECT ${cols}
     FROM invocations i
     JOIN agents a ON a.id = i.agent_id
     JOIN conversations c ON c.id = i.conversation_id
     WHERE i.id = $1`,
    [invocationId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    conversation_id: r.conversation_id,
    agent_id: r.agent_id,
    requester_id: r.requester_id,
    user_text: r.user_text,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    orchestration_run_id: r.orchestration_run_id ?? undefined,
    orchestration_step_index: r.orchestration_step_index ?? undefined,
    agent_name: r.agent_name,
    agent_owner_id: r.agent_owner_id,
    space_id: r.space_id,
  };
}

async function resolveVisibilityRoleAsync(
  viewerUserId: string,
  base: InvocationReceiptBase,
): Promise<ReceiptVisibilityRole | null> {
  if (viewerIsPlatformAdmin(viewerUserId)) {
    return "platform_admin";
  }

  const spaceId = base.space_id;
  if (spaceId) {
    const memberRole = await getMemberRoleAsync(spaceId, viewerUserId);
    if (memberRole === "owner" || memberRole === "admin") {
      return "space_admin";
    }
  }

  if (base.agent_owner_id && base.agent_owner_id === viewerUserId) {
    return "developer";
  }

  if (base.requester_id === viewerUserId) {
    return "user";
  }

  return null;
}

async function fetchAgentOutputTextAsync(conversationId: string, messageId: string): Promise<string | null> {
  if (!isPostgresEnabled()) return null;
  const rows = await query<{ content: unknown }>(
    `SELECT content FROM messages WHERE id = $1 AND conversation_id = $2`,
    [messageId, conversationId],
  );
  const content = rows[0]?.content as { text?: string } | undefined;
  return typeof content?.text === "string" ? content.text : null;
}

async function enrichFromAuditAsync(
  base: InvocationReceiptBase,
): Promise<{
  trust_decision?: unknown;
  agent_output_text?: string | null;
  error_detail?: string | null;
}> {
  const { data: events } = await listAuditEventsAsync({
    conversationId: base.conversation_id,
    agentId: base.agent_id,
    limit: 200,
    sortOrder: "desc",
  });

  const related = events.filter((e) => eventMatchesInvocation(e, base.id));
  let trust_decision: unknown;
  let agent_output_text: string | null | undefined;
  let error_detail: string | null | undefined;

  for (const e of related) {
    if (e.event_type === "invocation.pending_confirmation" && e.payload.invocation_id === base.id) {
      trust_decision = e.trust_decision ?? trust_decision;
    }
  }

  for (const e of related) {
    if (e.event_type === "invocation.completed") {
      const mid = e.payload.message_id;
      if (typeof mid === "string") {
        const text = await fetchAgentOutputTextAsync(base.conversation_id, mid);
        if (text != null) {
          agent_output_text = text;
          break;
        }
      }
    }
  }

  for (const e of related) {
    if (e.event_type === "invocation.failed" || e.event_type === "invocation.denied") {
      const reason = e.payload.reason;
      if (typeof reason === "string" && reason.length > 0) {
        error_detail = reason;
        break;
      }
    }
  }

  return {
    trust_decision,
    agent_output_text: agent_output_text ?? null,
    error_detail: error_detail ?? null,
  };
}

async function countInvocationsForAgentLast30dAsync(agentId: string): Promise<number> {
  if (!isPostgresEnabled()) return 0;
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM invocations
     WHERE agent_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
    [agentId],
  );
  return Number(rows[0]?.n ?? "0");
}

/**
 * E-17: role-based invocation / receipt field visibility (CTO V1.3.1-8).
 * Returns null when the viewer has no access (respond with 404).
 */
export async function getInvocationWithVisibilityAsync(
  invocationId: string,
  viewerUserId: string,
): Promise<InvocationReceiptView | null> {
  const base = await loadInvocationReceiptBaseAsync(invocationId);
  if (!base) return null;

  const role = await resolveVisibilityRoleAsync(viewerUserId, base);
  if (!role) return null;

  const enriched = await enrichFromAuditAsync(base);

  let user_text = base.user_text;
  let user_text_redacted = false;
  let agent_output_text = enriched.agent_output_text ?? null;
  let agent_output_truncated = false;
  let developer_invocation_stats: { count_last_30d: number } | undefined;
  const showTrust = role === "space_admin" || role === "platform_admin";

  if (role === "user") {
    user_text = summarizeText(base.user_text, USER_TEXT_SUMMARY_LEN);
    if (agent_output_text) {
      agent_output_text = summarizeText(agent_output_text, USER_TEXT_SUMMARY_LEN);
      agent_output_truncated = true;
    }
  } else if (role === "developer") {
    user_text = "[redacted]";
    user_text_redacted = true;
    if (agent_output_text) {
      agent_output_text = summarizeText(agent_output_text, DEV_OUTPUT_SUMMARY_LEN);
      agent_output_truncated = true;
    }
    const count_last_30d = await countInvocationsForAgentLast30dAsync(base.agent_id);
    developer_invocation_stats = { count_last_30d };
  }

  return {
    id: base.id,
    conversation_id: base.conversation_id,
    space_id: base.space_id,
    agent_id: base.agent_id,
    agent_name: base.agent_name,
    requester_id: base.requester_id,
    status: base.status,
    user_text,
    user_text_redacted,
    created_at: base.created_at,
    updated_at: base.updated_at,
    orchestration_run_id: base.orchestration_run_id ?? null,
    orchestration_step_index: base.orchestration_step_index ?? null,
    visibility_role: role,
    trust_decision: showTrust ? enriched.trust_decision : undefined,
    agent_output_text,
    agent_output_truncated,
    error_detail: enriched.error_detail,
    developer_invocation_stats,
  };
}
