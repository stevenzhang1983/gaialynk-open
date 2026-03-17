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

export const listConversations = async (): Promise<Conversation[]> => {
  if (!isPostgresEnabled()) {
    return [...conversations.values()];
  }

  const rows = await query<
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
     ORDER BY created_at DESC`,
  );
  return rows.map((r) => ({
    ...r,
    conversation_topology: (r.conversation_topology ?? "T1") as ConversationTopology,
    authorization_mode: (r.authorization_mode ?? "user_explicit") as AuthorizationMode,
    visibility_mode: (r.visibility_mode ?? "full") as VisibilityMode,
    risk_level: (r.risk_level ?? "low") as ConversationRiskLevel,
  }));
};

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

export const resetConversationStore = (): void => {
  conversations.clear();
  participantsByConversation.clear();
  messagesByConversation.clear();
};
