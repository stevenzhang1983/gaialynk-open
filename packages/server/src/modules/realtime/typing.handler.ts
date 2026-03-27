import { fanoutConversationPayload } from "./redis-pubsub";

const TYPING_IDLE_MS = 10_000;

type TypingKey = string;

function key(conversationId: string, userId: string): TypingKey {
  return `${conversationId}\0${userId}`;
}

const idleTimers = new Map<TypingKey, ReturnType<typeof setTimeout>>();

function broadcastTyping(
  conversationId: string,
  type: "typing_start" | "typing_stop",
  userId: string,
): void {
  const envelope = JSON.stringify({
    type,
    conversation_id: conversationId,
    user_id: userId,
  });
  fanoutConversationPayload(conversationId, envelope);
}

function clearIdleTimer(conversationId: string, userId: string): void {
  const k = key(conversationId, userId);
  const t = idleTimers.get(k);
  if (t) {
    clearTimeout(t);
    idleTimers.delete(k);
  }
}

function scheduleIdleStop(conversationId: string, userId: string): void {
  clearIdleTimer(conversationId, userId);
  const k = key(conversationId, userId);
  idleTimers.set(
    k,
    setTimeout(() => {
      idleTimers.delete(k);
      broadcastTyping(conversationId, "typing_stop", userId);
    }, TYPING_IDLE_MS),
  );
}

export function handleTypingStart(conversationId: string, userId: string): void {
  broadcastTyping(conversationId, "typing_start", userId);
  scheduleIdleStop(conversationId, userId);
}

export function handleTypingStop(conversationId: string, userId: string): void {
  clearIdleTimer(conversationId, userId);
  broadcastTyping(conversationId, "typing_stop", userId);
}

export function disposeTypingForUser(conversationId: string, userId: string): void {
  clearIdleTimer(conversationId, userId);
}

export function resetTypingHandlersForTests(): void {
  for (const t of idleTimers.values()) {
    clearTimeout(t);
  }
  idleTimers.clear();
}
