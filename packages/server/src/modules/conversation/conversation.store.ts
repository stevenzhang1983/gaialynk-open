import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type ConversationState = "active" | "archived" | "closed";

export interface Conversation {
  id: string;
  title: string;
  state: ConversationState;
  created_at: string;
  updated_at: string;
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

export const createConversation = (title: string): Conversation => {
  if (isPostgresEnabled()) {
    throw new Error("Use createConversationAsync in PostgreSQL mode");
  }

  const timestamp = nowIso();
  const conversation: Conversation = {
    id: randomUUID(),
    title,
    state: "active",
    created_at: timestamp,
    updated_at: timestamp,
  };

  conversations.set(conversation.id, conversation);
  participantsByConversation.set(conversation.id, []);
  messagesByConversation.set(conversation.id, []);

  return conversation;
};

export const createConversationAsync = async (title: string): Promise<Conversation> => {
  if (!isPostgresEnabled()) {
    return createConversation(title);
  }

  const conversation: Conversation = {
    id: randomUUID(),
    title,
    state: "active",
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  await query(
    `INSERT INTO conversations (id, title, state, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [conversation.id, conversation.title, conversation.state, conversation.created_at, conversation.updated_at],
  );

  return conversation;
};

export const listConversations = async (): Promise<Conversation[]> => {
  if (!isPostgresEnabled()) {
    return [...conversations.values()];
  }

  return query<Conversation>(
    `SELECT id, title, state, created_at::text, updated_at::text
     FROM conversations
     ORDER BY created_at DESC`,
  );
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

  const conversationsRows = await query<Conversation>(
    `SELECT id, title, state, created_at::text, updated_at::text
     FROM conversations
     WHERE id = $1`,
    [conversationId],
  );

  const conversation = conversationsRows[0];
  if (!conversation) {
    return null;
  }

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
