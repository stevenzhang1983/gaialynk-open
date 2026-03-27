import type { WSContext } from "hono/ws";
import type { WebSocket } from "ws";
import {
  fanoutConversationPayload,
  registerConversationFanoutLocalDelivery,
  releaseConversationRedisChannel,
  resetConversationChannelSubscriptionState,
  retainConversationRedisChannel,
} from "./redis-pubsub";

const socketsByConversation = new Map<string, Set<WSContext<WebSocket>>>();

const OPEN = 1;

export function deliverToLocalWebSockets(conversationId: string, payload: string): void {
  const set = socketsByConversation.get(conversationId);
  if (!set) {
    return;
  }
  for (const ws of set) {
    if (ws.readyState !== OPEN) {
      continue;
    }
    try {
      ws.send(payload);
    } catch {
      /* ignore broken pipes */
    }
  }
}

/** Fan-out to Redis (if configured) or local sockets. */
export function broadcastToConversation(conversationId: string, payload: string): void {
  fanoutConversationPayload(conversationId, payload);
}

export function resetWebSocketRegistry(): void {
  for (const set of socketsByConversation.values()) {
    for (const ws of set) {
      try {
        ws.close(1001, "server reset");
      } catch {
        /* ignore */
      }
    }
  }
  socketsByConversation.clear();
  resetConversationChannelSubscriptionState();
}

export function registerConversationWebSocket(
  conversationId: string,
  ws: WSContext<WebSocket>,
): () => void {
  retainConversationRedisChannel(conversationId);
  let set = socketsByConversation.get(conversationId);
  if (!set) {
    set = new Set();
    socketsByConversation.set(conversationId, set);
  }
  set.add(ws);
  return () => {
    set?.delete(ws);
    if (set?.size === 0) {
      socketsByConversation.delete(conversationId);
    }
    releaseConversationRedisChannel(conversationId);
  };
}

registerConversationFanoutLocalDelivery(deliverToLocalWebSockets);
