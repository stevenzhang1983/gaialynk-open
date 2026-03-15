import { randomUUID } from "node:crypto";
import { getConversationDetailAsync } from "./conversation.store";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";
export type InvitationInviteeType = "user" | "agent";
export type InvitationRole = "member" | "admin" | "readonly";

export interface ConversationInvitation {
  id: string;
  conversation_id: string;
  inviter_id: string;
  invitee_type: InvitationInviteeType;
  invitee_id: string;
  role: InvitationRole;
  status: InvitationStatus;
  message?: string;
  created_at: string;
  updated_at: string;
  accepted_at?: string;
}

interface CreateInvitationInput {
  conversationId: string;
  inviterId: string;
  inviteeType: InvitationInviteeType;
  inviteeId: string;
  role: InvitationRole;
  message?: string;
}

const invitationsByConversation = new Map<string, ConversationInvitation[]>();

const nowIso = (): string => new Date().toISOString();

export const createInvitationAsync = async (
  input: CreateInvitationInput,
): Promise<ConversationInvitation | null> => {
  const conversationDetail = await getConversationDetailAsync(input.conversationId);
  if (!conversationDetail) {
    return null;
  }

  const timestamp = nowIso();
  const invitation: ConversationInvitation = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    inviter_id: input.inviterId,
    invitee_type: input.inviteeType,
    invitee_id: input.inviteeId,
    role: input.role,
    status: "pending",
    message: input.message,
    created_at: timestamp,
    updated_at: timestamp,
  };

  const existing = invitationsByConversation.get(input.conversationId) ?? [];
  invitationsByConversation.set(input.conversationId, [...existing, invitation]);
  return invitation;
};

export const listInvitationsByConversationAsync = async (
  conversationId: string,
): Promise<ConversationInvitation[] | null> => {
  const conversationDetail = await getConversationDetailAsync(conversationId);
  if (!conversationDetail) {
    return null;
  }

  return invitationsByConversation.get(conversationId) ?? [];
};

export const getInvitationAsync = async (
  conversationId: string,
  invitationId: string,
): Promise<ConversationInvitation | null> => {
  const invitations = await listInvitationsByConversationAsync(conversationId);
  if (!invitations) {
    return null;
  }

  return invitations.find((invitation) => invitation.id === invitationId) ?? null;
};

export const markInvitationAcceptedAsync = async (
  conversationId: string,
  invitationId: string,
): Promise<ConversationInvitation | null> => {
  const invitations = invitationsByConversation.get(conversationId);
  if (!invitations) {
    return null;
  }
  const target = invitations.find((invitation) => invitation.id === invitationId);
  if (!target) {
    return null;
  }

  if (target.status === "accepted") {
    return target;
  }

  const timestamp = nowIso();
  target.status = "accepted";
  target.accepted_at = timestamp;
  target.updated_at = timestamp;
  return target;
};

export const resetInvitationStore = (): void => {
  invitationsByConversation.clear();
};
