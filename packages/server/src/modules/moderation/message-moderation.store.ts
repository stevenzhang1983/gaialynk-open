import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import {
  conversationHasUserParticipantAsync,
  countUserParticipantsAsync,
  findMessageInMemory,
  getConversationSummaryAsync,
  setMessageContentHiddenInMemory,
} from "../conversation/conversation.store";
import { getMemberRoleAsync, type SpaceMemberRole } from "../spaces/space.store";

export const MODERATION_HIDDEN_PLACEHOLDER = "[该消息已被管理员隐藏]";

export interface UserContentReport {
  id: string;
  message_id: string;
  reporter_id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
}

const memReports: UserContentReport[] = [];

function isSpaceModeratorRole(role: SpaceMemberRole | null): boolean {
  return role === "owner" || role === "admin";
}

export async function reportMessageAsync(input: {
  messageId: string;
  reporterUserId: string;
  reason: string;
  detail?: string | null;
}): Promise<{ ok: true; report: UserContentReport } | { ok: false; code: string; message: string }> {
  if (!isPostgresEnabled()) {
    const hit = findMessageInMemory(input.messageId);
    if (!hit) {
      return { ok: false, code: "message_not_found", message: "Message not found" };
    }
    if (hit.message.sender_type !== "user") {
      return { ok: false, code: "report_not_applicable", message: "Only user messages can be reported" };
    }
    const nUsers = await countUserParticipantsAsync(hit.conversationId);
    if (nUsers < 2) {
      return { ok: false, code: "not_group_conversation", message: "Reporting requires a multi-participant user conversation" };
    }
    const isReporter = await conversationHasUserParticipantAsync(hit.conversationId, input.reporterUserId);
    if (!isReporter) {
      return { ok: false, code: "forbidden", message: "Reporter must be a conversation participant" };
    }
    if (memReports.some((r) => r.message_id === input.messageId && r.reporter_id === input.reporterUserId)) {
      return { ok: false, code: "already_reported", message: "You already reported this message" };
    }
    const report: UserContentReport = {
      id: randomUUID(),
      message_id: input.messageId,
      reporter_id: input.reporterUserId,
      reason: input.reason,
      detail: input.detail ?? null,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    memReports.push(report);
    return { ok: true, report };
  }

  const rows = await query<{
    id: string;
    conversation_id: string;
    sender_type: string;
    content_hidden: boolean;
  }>(
    `SELECT m.id, m.conversation_id, m.sender_type, COALESCE(m.content_hidden, FALSE) AS content_hidden
     FROM messages m WHERE m.id = $1`,
    [input.messageId],
  );
  const row = rows[0];
  if (!row) {
    return { ok: false, code: "message_not_found", message: "Message not found" };
  }
  if (row.sender_type !== "user") {
    return { ok: false, code: "report_not_applicable", message: "Only user messages can be reported" };
  }
  if (row.content_hidden) {
    return { ok: false, code: "message_not_reportable", message: "Message is no longer reportable" };
  }

  const nUsers = await countUserParticipantsAsync(row.conversation_id);
  if (nUsers < 2) {
    return { ok: false, code: "not_group_conversation", message: "Reporting requires a multi-participant user conversation" };
  }

  const isReporter = await conversationHasUserParticipantAsync(row.conversation_id, input.reporterUserId);
  if (!isReporter) {
    return { ok: false, code: "forbidden", message: "Reporter must be a conversation participant" };
  }

  try {
    const inserted = await query<UserContentReport>(
      `INSERT INTO user_content_reports (message_id, reporter_id, reason, detail, status)
       VALUES ($1, $2::uuid, $3, $4, 'pending')
       RETURNING id::text, message_id::text, reporter_id::text, reason, detail, status, created_at::text`,
      [input.messageId, input.reporterUserId, input.reason, input.detail ?? null],
    );
    const report = inserted[0];
    if (!report) {
      return { ok: false, code: "already_reported", message: "You already reported this message" };
    }
    return { ok: true, report };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("23505") || msg.includes("user_content_reports_message_reporter")) {
      return { ok: false, code: "already_reported", message: "You already reported this message" };
    }
    throw e;
  }
}

export async function hideMessageAsync(input: {
  messageId: string;
  actorUserId: string;
}): Promise<{ ok: true } | { ok: false; code: string; message: string }> {
  if (!isPostgresEnabled()) {
    const hit = findMessageInMemory(input.messageId);
    if (!hit) {
      return { ok: false, code: "message_not_found", message: "Message not found" };
    }
    const summary = await getConversationSummaryAsync(hit.conversationId);
    if (!summary?.space_id) {
      return { ok: false, code: "no_space", message: "Moderation hide requires a Space-bound conversation" };
    }
    const role = await getMemberRoleAsync(summary.space_id, input.actorUserId);
    if (!isSpaceModeratorRole(role)) {
      return { ok: false, code: "forbidden", message: "Space owner or admin required" };
    }
    if (!setMessageContentHiddenInMemory(input.messageId)) {
      return { ok: false, code: "message_not_found", message: "Message not found" };
    }
    return { ok: true };
  }

  const rows = await query<{ conversation_id: string; space_id: string | null }>(
    `SELECT m.conversation_id, c.space_id::text
     FROM messages m
     JOIN conversations c ON c.id = m.conversation_id
     WHERE m.id = $1`,
    [input.messageId],
  );
  const row = rows[0];
  if (!row) {
    return { ok: false, code: "message_not_found", message: "Message not found" };
  }
  if (!row.space_id) {
    return { ok: false, code: "no_space", message: "Moderation hide requires a Space-bound conversation" };
  }
  const role = await getMemberRoleAsync(row.space_id, input.actorUserId);
  if (!isSpaceModeratorRole(role)) {
    return { ok: false, code: "forbidden", message: "Space owner or admin required" };
  }

  const updated = await query<{ id: string }>(
    `UPDATE messages SET content_hidden = TRUE WHERE id = $1 AND conversation_id = $2 RETURNING id`,
    [input.messageId, row.conversation_id],
  );
  if (updated.length === 0) {
    return { ok: false, code: "message_not_found", message: "Message not found" };
  }
  return { ok: true };
}

export async function getReportsAsync(filters?: { messageId?: string; status?: string }): Promise<UserContentReport[]> {
  if (!isPostgresEnabled()) {
    return memReports.filter((r) => {
      if (filters?.messageId && r.message_id !== filters.messageId) return false;
      if (filters?.status && r.status !== filters.status) return false;
      return true;
    });
  }
  const parts: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (filters?.messageId) {
    parts.push(`message_id = $${i++}`);
    vals.push(filters.messageId);
  }
  if (filters?.status) {
    parts.push(`status = $${i++}`);
    vals.push(filters.status);
  }
  const where = parts.length > 0 ? `WHERE ${parts.join(" AND ")}` : "";
  return query<UserContentReport>(
    `SELECT id::text, message_id::text, reporter_id::text, reason, detail, status, created_at::text
     FROM user_content_reports ${where} ORDER BY created_at DESC`,
    vals,
  );
}

export function resetMessageModerationStore(): void {
  memReports.length = 0;
}
