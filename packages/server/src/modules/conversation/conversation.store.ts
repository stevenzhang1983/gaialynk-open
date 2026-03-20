import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type ConversationState = "active" | "archived" | "closed";

export type ConversationTopology = "T1" | "T2" | "T3" | "T4" | "T5";
export type AuthorizationMode = "user_explicit" | "policy_based" | "delegated";
export type VisibilityMode = "full" | "summarized" | "restricted";
export type ConversationRiskLevel = "low" | "medium" | "high" | "critical";

export interface Conversation {
  id: string;
  title: string;
  state: ConversationState;
  created_at: string;
  updated_at: string;
  conversation_topology?: ConversationTopology;
  authorization_mode?: AuthorizationMode;
  visibility_mode?: VisibilityMode;
  risk_level?: ConversationRiskLevel;
}

export interface Participant {
  id: string;
  conversation_id: string;
  participant_type: "user" | "agent";
  participant_id: string;
  role: "member" | "admin" | "readonly";
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "user" | "agent" | "system";
  sender_id: string;
  content: {
    type: "text";
    text: string;
    thread_id?: string;
    mentions?: string[];
  };
  created_at: string;
}

interface AddParticipantInput {
  conversationId: string;
  participantType: "user" | "agent";
  participantId: string;
  role: "member" | "admin" | "readonly";
}

interface AppendMessageInput {
  conversationId: string;
  senderType: "user" | "agent" | "system";
  senderId: string;
  text: string;
  threadId?: string;
  mentions?: string[];
}

const conversations = new Map<string, Conversation>();
const participantsByConversation = new Map<string, Participant[]>();
const messagesByConversation = new Map<string, Message[]>();

const nowIso = (): string => new Date().toISOString();

export interface CreateConversationInput {
  title: string;
  conversation_topology?: ConversationTopology;
  authorization_mode?: AuthorizationMode;
  visibility_mode?: VisibilityMode;
  risk_level?: ConversationRiskLevel;
}

export const createConversation = (input: string | CreateConversationInput): Conversation => {
  if (isPostgresEnabled()) {
    throw new Error("Use createConversationAsync in PostgreSQL mode");
  }
  const opts = typeof input === "string" ? { title: input } : input;
  const timestamp = nowIso();
  const conversation: Conversation = {
    id: randomUUID(),
    title: opts.title,
    state: "active",
    created_at: timestamp,
    updated_at: timestamp,
    conversation_topology: opts.conversation_topology ?? "T1",
    authorization_mode: opts.authorization_mode ?? "user_explicit",
    visibility_mode: opts.visibility_mode ?? "full",
    risk_level: opts.risk_level ?? "low",
  };

  conversations.set(conversation.id, conversation);
  participantsByConversation.set(conversation.id, []);
  messagesByConversation.set(conversation.id, []);

  return conversation;
};

export const createConversationAsync = async (
  input: string | CreateConversationInput,
): Promise<Conversation> => {
  const opts = typeof input === "string" ? { title: input } : input;
  const topology = opts.conversation_topology ?? "T1";
  const authMode = opts.authorization_mode ?? "user_explicit";
  const visibility = opts.visibility_mode ?? "full";
  const riskLevel = opts.risk_level ?? "low";

  if (!isPostgresEnabled()) {
    return createConversation(opts);
  }

  const conversation: Conversation = {
    id: randomUUID(),
    title: opts.title,
    state: "active",
    created_at: nowIso(),
    updated_at: nowIso(),
    conversation_topology: topology,
    authorization_mode: authMode,
    visibility_mode: visibility,
    risk_level: riskLevel,
  };

  await query(
    `INSERT INTO conversations (id, title, state, created_at, updated_at, conversation_topology, authorization_mode, visibility_mode, risk_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      conversation.id,
      conversation.title,
      conversation.state,
      conversation.created_at,
      conversation.updated_at,
      topology,
      authMode,
      visibility,
      riskLevel,
    ],
  );

  return conversation;
};

export type ListConversationsSort = "created_at:desc" | "created_at:asc";

export interface ListConversationsOptions {
  limit?: number;
  cursor?: string;
  sort?: ListConversationsSort;
}

export interface ListConversationsResult {
  data: Conversation[];
  next_cursor?: string;
}

export const listConversations = async (
  opts?: ListConversationsOptions,
): Promise<Conversation[] | ListConversationsResult> => {
  if (!isPostgresEnabled()) {
    const all = [...conversations.values()];
    if (!opts?.limit && !opts?.cursor && !opts?.sort) {
      return all;
    }
    return listConversationsInMemory(all, opts);
  }

  type Row = Conversation & {
    conversation_topology?: string;
    authorization_mode?: string;
    visibility_mode?: string;
    risk_level?: string;
  };

  const usePagination = opts?.limit != null || opts?.cursor != null;
  const limit = usePagination ? Math.min(Math.max(opts?.limit ?? 50, 1), 100) : 0;
  const sort = opts?.sort ?? "created_at:desc";
  const orderDir = sort === "created_at:asc" ? "ASC" : "DESC";
  const cursor = opts?.cursor?.trim();

  let rows: Row[];
  if (usePagination) {
    const cmpOp = orderDir === "DESC" ? "<" : ">";
    if (cursor) {
      rows = await query<Row>(
        `SELECT id, title, state, created_at::text, updated_at::text,
                COALESCE(conversation_topology, 'T1') AS conversation_topology,
                COALESCE(authorization_mode, 'user_explicit') AS authorization_mode,
                COALESCE(visibility_mode, 'full') AS visibility_mode,
                COALESCE(risk_level, 'low') AS risk_level
         FROM conversations
         WHERE (created_at, id::text) ${cmpOp} (
           SELECT created_at, id::text FROM conversations WHERE id = $1
         )
         ORDER BY created_at ${orderDir}
         LIMIT $2`,
        [cursor, limit + 1],
      );
    } else {
      rows = await query<Row>(
        `SELECT id, title, state, created_at::text, updated_at::text,
                COALESCE(conversation_topology, 'T1') AS conversation_topology,
                COALESCE(authorization_mode, 'user_explicit') AS authorization_mode,
                COALESCE(visibility_mode, 'full') AS visibility_mode,
                COALESCE(risk_level, 'low') AS risk_level
         FROM conversations
         ORDER BY created_at ${orderDir}
         LIMIT $1`,
        [limit + 1],
      );
    }
  } else {
    rows = await query<Row>(
      `SELECT id, title, state, created_at::text, updated_at::text,
              COALESCE(conversation_topology, 'T1') AS conversation_topology,
              COALESCE(authorization_mode, 'user_explicit') AS authorization_mode,
              COALESCE(visibility_mode, 'full') AS visibility_mode,
              COALESCE(risk_level, 'low') AS risk_level
       FROM conversations
       ORDER BY created_at ${orderDir}`,
      [],
    );
  }

  const data = rows.map((r) => ({
    ...r,
    conversation_topology: (r.conversation_topology ?? "T1") as ConversationTopology,
    authorization_mode: (r.authorization_mode ?? "user_explicit") as AuthorizationMode,
    visibility_mode: (r.visibility_mode ?? "full") as VisibilityMode,
    risk_level: (r.risk_level ?? "low") as ConversationRiskLevel,
  }));

  if (!usePagination) {
    return data as Conversation[];
  }
  const hasMore = rows.length > limit;
  const pageData = hasMore ? data.slice(0, limit) : data;
  const result: ListConversationsResult = { data: pageData as Conversation[] };
  if (hasMore && pageData.length > 0) {
    result.next_cursor = pageData[pageData.length - 1]!.id;
  }
  return result;
};

function listConversationsInMemory(
  all: Conversation[],
  opts?: ListConversationsOptions,
): ListConversationsResult {
  const sort = opts?.sort ?? "created_at:desc";
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  let list = [...all];
  if (sort === "created_at:asc") {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } else {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const cursor = opts?.cursor;
  if (cursor) {
    const idx = list.findIndex((c) => c.id === cursor);
    if (idx >= 0) {
      list = list.slice(idx + 1);
    }
  }
  const hasMore = list.length > limit;
  const data = hasMore ? list.slice(0, limit) : list;
  const result: ListConversationsResult = { data };
  if (hasMore && data.length > 0) {
    result.next_cursor = data[data.length - 1]!.id;
  }
  return result;
}

export const getConversationDetail = (
  conversationId: string,
): { conversation: Conversation; participants: Participant[]; messages: Message[] } | null => {
  const conversation = conversations.get(conversationId);

  if (!conversation) {
    return null;
  }

  return {
    conversation,
    participants: participantsByConversation.get(conversationId) ?? [],
    messages: messagesByConversation.get(conversationId) ?? [],
  };
};

export const getConversationDetailAsync = async (
  conversationId: string,
): Promise<{ conversation: Conversation; participants: Participant[]; messages: Message[] } | null> => {
  if (!isPostgresEnabled()) {
    return getConversationDetail(conversationId);
  }

  const conversationsRows = await query<
    Conversation & {
      conversation_topology?: string;
      authorization_mode?: string;
      visibility_mode?: string;
      risk_level?: string;
    }
  >(
    `SELECT id, title, state, created_at::text, updated_at::text,
            COALESCE(conversation_topology, 'T1') AS conversation_topology,
            COALESCE(authorization_mode, 'user_explicit') AS authorization_mode,
            COALESCE(visibility_mode, 'full') AS visibility_mode,
            COALESCE(risk_level, 'low') AS risk_level
     FROM conversations
     WHERE id = $1`,
    [conversationId],
  );

  const row = conversationsRows[0];
  if (!row) {
    return null;
  }
  const conversation: Conversation = {
    ...row,
    conversation_topology: (row.conversation_topology ?? "T1") as ConversationTopology,
    authorization_mode: (row.authorization_mode ?? "user_explicit") as AuthorizationMode,
    visibility_mode: (row.visibility_mode ?? "full") as VisibilityMode,
    risk_level: (row.risk_level ?? "low") as ConversationRiskLevel,
  };

  const participants = await query<Participant>(
    `SELECT id, conversation_id, participant_type, participant_id, role, joined_at::text
     FROM participants
     WHERE conversation_id = $1
     ORDER BY joined_at ASC`,
    [conversationId],
  );

  const messages = await query<Message>(
    `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId],
  );

  return { conversation, participants, messages };
};

export const addParticipant = (input: AddParticipantInput): Participant | null => {
  const conversation = conversations.get(input.conversationId);

  if (!conversation) {
    return null;
  }

  const participant: Participant = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    participant_type: input.participantType,
    participant_id: input.participantId,
    role: input.role,
    joined_at: nowIso(),
  };

  const existingParticipants = participantsByConversation.get(input.conversationId) ?? [];
  participantsByConversation.set(input.conversationId, [...existingParticipants, participant]);

  conversation.updated_at = nowIso();

  return participant;
};

export const addParticipantAsync = async (input: AddParticipantInput): Promise<Participant | null> => {
  if (!isPostgresEnabled()) {
    return addParticipant(input);
  }

  const conversationRows = await query<Conversation>(
    `SELECT id, title, state, created_at::text, updated_at::text
     FROM conversations
     WHERE id = $1`,
    [input.conversationId],
  );

  if (!conversationRows[0]) {
    return null;
  }

  const participant: Participant = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    participant_type: input.participantType,
    participant_id: input.participantId,
    role: input.role,
    joined_at: nowIso(),
  };

  await query(
    `INSERT INTO participants (id, conversation_id, participant_type, participant_id, role, joined_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      participant.id,
      participant.conversation_id,
      participant.participant_type,
      participant.participant_id,
      participant.role,
      participant.joined_at,
    ],
  );

  await query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [input.conversationId, nowIso()]);

  return participant;
};

export const appendMessage = (input: AppendMessageInput): Message | null => {
  const conversation = conversations.get(input.conversationId);

  if (!conversation) {
    return null;
  }

  const message: Message = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    sender_type: input.senderType,
    sender_id: input.senderId,
    content: {
      type: "text",
      text: input.text,
      thread_id: input.threadId,
      mentions: input.mentions,
    },
    created_at: nowIso(),
  };

  const existingMessages = messagesByConversation.get(input.conversationId) ?? [];
  messagesByConversation.set(input.conversationId, [...existingMessages, message]);

  conversation.updated_at = nowIso();

  return message;
};

export const appendMessageAsync = async (input: AppendMessageInput): Promise<Message | null> => {
  if (!isPostgresEnabled()) {
    return appendMessage(input);
  }

  const conversationRows = await query<Conversation>(
    `SELECT id, title, state, created_at::text, updated_at::text
     FROM conversations
     WHERE id = $1`,
    [input.conversationId],
  );

  if (!conversationRows[0]) {
    return null;
  }

  const message: Message = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    sender_type: input.senderType,
    sender_id: input.senderId,
    content: {
      type: "text",
      text: input.text,
      thread_id: input.threadId,
      mentions: input.mentions,
    },
    created_at: nowIso(),
  };

  await query(
    `INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, created_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [
      message.id,
      message.conversation_id,
      message.sender_type,
      message.sender_id,
      JSON.stringify(message.content),
      message.created_at,
    ],
  );

  await query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [input.conversationId, nowIso()]);

  return message;
};

export const deleteConversation = (conversationId: string): boolean => {
  if (!conversations.has(conversationId)) {
    return false;
  }
  conversations.delete(conversationId);
  participantsByConversation.delete(conversationId);
  messagesByConversation.delete(conversationId);
  return true;
};

export const deleteConversationAsync = async (conversationId: string): Promise<boolean> => {
  if (!isPostgresEnabled()) {
    return deleteConversation(conversationId);
  }
  const result = await query<{ id: string }>(
    `DELETE FROM conversations WHERE id = $1 RETURNING id`,
    [conversationId],
  );
  return result.length > 0;
};

export type ListMessagesSort = "created_at:desc" | "created_at:asc";

export interface ListMessagesOptions {
  limit?: number;
  cursor?: string;
  sort?: ListMessagesSort;
}

export interface ListMessagesResult {
  data: Message[];
  next_cursor?: string;
}

export const listMessagesAsync = async (
  conversationId: string,
  opts?: ListMessagesOptions,
): Promise<ListMessagesResult | null> => {
  if (!isPostgresEnabled()) {
    const list = messagesByConversation.get(conversationId) ?? [];
    if (!conversations.has(conversationId)) {
      return null;
    }
    const sort = opts?.sort ?? "created_at:desc";
    const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
    let ordered = [...list];
    ordered.sort((a, b) =>
      sort === "created_at:asc"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
    );
    if (opts?.cursor) {
      const idx = ordered.findIndex((m) => m.id === opts!.cursor);
      if (idx >= 0) ordered = ordered.slice(idx + 1);
    }
    const hasMore = ordered.length > limit;
    const data = hasMore ? ordered.slice(0, limit) : ordered;
    const result: ListMessagesResult = { data };
    if (hasMore && data.length > 0) result.next_cursor = data[data.length - 1]!.id;
    return result;
  }

  const convExists = await query(
    `SELECT id FROM conversations WHERE id = $1`,
    [conversationId],
  );
  if (convExists.length === 0) {
    return null;
  }

  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
  const sort = opts?.sort ?? "created_at:desc";
  const orderDir = sort === "created_at:asc" ? "ASC" : "DESC";
  const cursor = opts?.cursor?.trim();

  type MsgRow = Message & { content: unknown };
  const cmpOp = orderDir === "DESC" ? "<" : ">";
  let rows: MsgRow[];
  if (cursor) {
    rows = await query<MsgRow>(
      `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text
       FROM messages
       WHERE conversation_id = $1 AND (created_at, id::text) ${cmpOp} (
         SELECT created_at, id::text FROM messages WHERE id = $2 AND conversation_id = $1
       )
       ORDER BY created_at ${orderDir}
       LIMIT $3`,
      [conversationId, cursor, limit + 1],
    );
  } else {
    rows = await query<MsgRow>(
      `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ${orderDir}
       LIMIT $2`,
      [conversationId, limit + 1],
    );
  }

  const hasMore = rows.length > limit;
  const data = (hasMore ? rows.slice(0, limit) : rows) as Message[];
  const result: ListMessagesResult = { data };
  if (hasMore && data.length > 0) {
    result.next_cursor = data[data.length - 1]!.id;
  }
  return result;
};

export const resetConversationStore = (): void => {
  conversations.clear();
  participantsByConversation.clear();
  messagesByConversation.clear();
};
