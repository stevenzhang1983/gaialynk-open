import type { Message } from "./conversation.store";

type MessageCallback = (message: Message) => void;

const subscribersByConversation = new Map<string, Set<MessageCallback>>();

/**
 * Subscribe to new messages for a conversation. Returns an unsubscribe function.
 */
export function subscribe(conversationId: string, callback: MessageCallback): () => void {
  let set = subscribersByConversation.get(conversationId);
  if (!set) {
    set = new Set();
    subscribersByConversation.set(conversationId, set);
  }
  set.add(callback);
  return () => {
    set?.delete(callback);
    if (set?.size === 0) {
      subscribersByConversation.delete(conversationId);
    }
  };
}

/**
 * Publish a new message to all subscribers of the conversation.
 */
export function publish(conversationId: string, message: Message): void {
  const set = subscribersByConversation.get(conversationId);
  if (!set) return;
  for (const cb of set) {
    try {
      cb(message);
    } catch (e) {
      console.error("[message-stream] subscriber error:", e);
    }
  }
}
