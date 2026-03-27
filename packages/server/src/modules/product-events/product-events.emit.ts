import { insertProductEventAsync, userHasProductEventAsync } from "./product-events.store";
import type { ProductEventName } from "./product-events.types";

export async function emitProductEventAsync(params: {
  name: ProductEventName;
  userId?: string | null;
  spaceId?: string | null;
  conversationId?: string | null;
  payload?: Record<string, unknown>;
  correlationId?: string | null;
}): Promise<void> {
  await insertProductEventAsync({
    eventName: params.name,
    userId: params.userId ?? null,
    spaceId: params.spaceId ?? null,
    conversationId: params.conversationId ?? null,
    payload: params.payload ?? {},
    correlationId: params.correlationId ?? null,
  });
}

export async function emitProductEventOncePerUserAsync(params: {
  name: ProductEventName;
  userId: string;
  spaceId?: string | null;
  conversationId?: string | null;
  payload?: Record<string, unknown>;
  correlationId?: string | null;
}): Promise<void> {
  const exists = await userHasProductEventAsync(params.userId, params.name);
  if (exists) {
    return;
  }
  await emitProductEventAsync({
    name: params.name,
    userId: params.userId,
    spaceId: params.spaceId,
    conversationId: params.conversationId,
    payload: params.payload,
    correlationId: params.correlationId,
  });
}

export async function recordConversationCreatedForFounderAsync(params: {
  creatorUserId: string;
  conversationId: string;
  spaceId: string | null;
}): Promise<void> {
  await emitProductEventAsync({
    name: "conversation.created",
    userId: params.creatorUserId,
    spaceId: params.spaceId,
    conversationId: params.conversationId,
    payload: {},
  });
  await emitProductEventOncePerUserAsync({
    name: "user.first_conversation",
    userId: params.creatorUserId,
    spaceId: params.spaceId,
    conversationId: params.conversationId,
    payload: { conversation_id: params.conversationId },
  });
}

export async function recordUserMessageSentProductEventAsync(params: {
  userId: string;
  conversationId: string;
}): Promise<void> {
  await emitProductEventAsync({
    name: "conversation.message_sent",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: {},
  });
}

export async function recordSessionInvocationCompletedProductAsync(params: {
  userId: string;
  conversationId: string;
  agentId: string;
  correlationId?: string | null;
}): Promise<void> {
  await emitProductEventAsync({
    name: "agent.invoked",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: { agent_id: params.agentId, source: "session" },
    correlationId: params.correlationId ?? null,
  });
  await emitProductEventOncePerUserAsync({
    name: "user.first_valuable_reply",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: { agent_id: params.agentId, source: "session" },
    correlationId: params.correlationId ?? null,
  });
}
