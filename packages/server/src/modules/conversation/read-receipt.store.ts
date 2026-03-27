import { isPostgresEnabled, query } from "../../infra/db/client";
import { findMessageConversationIdInMemory } from "./conversation.store";

const memReceipts = new Map<string, string>();

function memKey(messageId: string, userId: string): string {
  return `${messageId}\0${userId}`;
}

export async function getMessageConversationIdAsync(messageId: string): Promise<string | null> {
  if (!isPostgresEnabled()) {
    return findMessageConversationIdInMemory(messageId);
  }
  const rows = await query<{ conversation_id: string }>(
    `SELECT conversation_id::text FROM messages WHERE id = $1::uuid`,
    [messageId],
  );
  return rows[0]?.conversation_id ?? null;
}

export async function resolveMessageConversationIdAsync(
  messageId: string,
  conversationIdHint?: string,
): Promise<string | null> {
  if (conversationIdHint) {
    if (!isPostgresEnabled()) {
      const cid = findMessageConversationIdInMemory(messageId);
      return cid === conversationIdHint ? conversationIdHint : null;
    }
    const rows = await query<{ one: number }>(
      `SELECT 1 AS one FROM messages WHERE id = $1::uuid AND conversation_id = $2::uuid`,
      [messageId, conversationIdHint],
    );
    return rows.length > 0 ? conversationIdHint : null;
  }
  return getMessageConversationIdAsync(messageId);
}

export async function upsertMessageReadReceiptAsync(params: {
  messageId: string;
  userId: string;
}): Promise<{ read_at: string }> {
  const readAt = new Date().toISOString();
  if (!isPostgresEnabled()) {
    memReceipts.set(memKey(params.messageId, params.userId), readAt);
    return { read_at: readAt };
  }
  await query(
    `INSERT INTO message_read_receipts (message_id, user_id, read_at)
     VALUES ($1::uuid, $2::uuid, $3::timestamptz)
     ON CONFLICT (message_id, user_id) DO UPDATE SET read_at = EXCLUDED.read_at`,
    [params.messageId, params.userId, readAt],
  );
  return { read_at: readAt };
}

export function resetReadReceiptStoreForTests(): void {
  memReceipts.clear();
}
