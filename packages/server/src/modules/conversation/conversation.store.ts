import { randomUUID } from "node:crypto";

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
}

const conversations = new Map<string, Conversation>();
const participantsByConversation = new Map<string, Participant[]>();
const messagesByConversation = new Map<string, Message[]>();

const nowIso = (): string => new Date().toISOString();

export const createConversation = (title: string): Conversation => {
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

export const listConversations = (): Conversation[] => {
  return [...conversations.values()];
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
    },
    created_at: nowIso(),
  };

  const existingMessages = messagesByConversation.get(input.conversationId) ?? [];
  messagesByConversation.set(input.conversationId, [...existingMessages, message]);

  conversation.updated_at = nowIso();

  return message;
};

export const resetConversationStore = (): void => {
  conversations.clear();
  participantsByConversation.clear();
  messagesByConversation.clear();
};
