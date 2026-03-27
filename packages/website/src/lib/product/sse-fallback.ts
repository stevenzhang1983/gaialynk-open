import type { ApiMessage } from "@/lib/product/chat-types";

export type ConversationSseCallbacks = {
  onMessage: (msg: ApiMessage) => void;
  onOpen?: () => void;
  onDisconnected?: () => void;
};

/**
 * W-16：SSE 降级路径（与 W-7 退避重连一致），供 chat-window 在 WS 不可用或断开后使用。
 */
export function subscribeConversationMessagesSse(
  conversationId: string,
  callbacks: ConversationSseCallbacks,
): { close: () => void } {
  let es: EventSource | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const connect = () => {
    if (cancelled) return;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    es?.close();
    const url = `/api/mainline/conversations/${conversationId}/messages/stream`;
    es = new EventSource(url);
    es.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ApiMessage;
        callbacks.onMessage(msg);
      } catch {
        /* ignore */
      }
    });
    es.onopen = () => {
      if (cancelled) return;
      attempt = 0;
      callbacks.onOpen?.();
    };
    es.onerror = () => {
      if (cancelled) return;
      es?.close();
      attempt += 1;
      callbacks.onDisconnected?.();
      const delay = Math.min(30_000, 800 * 2 ** Math.min(attempt, 5));
      reconnectTimer = setTimeout(() => {
        if (!cancelled) connect();
      }, delay);
    };
  };

  connect();

  return {
    close: () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      es = null;
    },
  };
}
