import { conversationHasUserParticipantAsync } from "../conversation/conversation.store";
import { upsertMessageReadReceiptAsync, resolveMessageConversationIdAsync } from "../conversation/read-receipt.store";
import { userIsMemberOfSpaceAsync } from "../spaces/space.store";
import { fanoutConversationPayload } from "./redis-pubsub";

export async function handleMessageReadEventAsync(params: {
  conversationId: string;
  userId: string;
  messageId: string;
  spaceId: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const resolved = await resolveMessageConversationIdAsync(params.messageId, params.conversationId);
  if (!resolved || resolved !== params.conversationId) {
    return { ok: false, error: "message_not_in_conversation" };
  }

  if (params.spaceId) {
    const member = await userIsMemberOfSpaceAsync(params.spaceId, params.userId);
    if (!member) {
      return { ok: false, error: "forbidden" };
    }
  } else {
    const participant = await conversationHasUserParticipantAsync(params.conversationId, params.userId);
    if (!participant) {
      return { ok: false, error: "forbidden" };
    }
  }

  const { read_at } = await upsertMessageReadReceiptAsync({
    messageId: params.messageId,
    userId: params.userId,
  });

  const envelope = JSON.stringify({
    type: "message_read",
    message_id: params.messageId,
    user_id: params.userId,
    read_at,
  });
  fanoutConversationPayload(params.conversationId, envelope);
  return { ok: true };
}
