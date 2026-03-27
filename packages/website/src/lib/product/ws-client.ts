import type { ApiMessage, ChatMessage } from "@/lib/product/chat-types";

export type RealtimeWsInbound =
  | { type: "message"; event_id: string; data: ApiMessage }
  | { type: "connected"; conversation_id: string; replayed_count: number }
  | { type: "message_read"; message_id: string; user_id: string; read_at: string }
  | { type: "typing_start" | "typing_stop"; conversation_id: string; user_id: string }
  | { type: "presence_update"; space_id: string; user_id: string; status: "online" | "away" }
  | Record<string, unknown>;

const WS_PATH = "/api/v1/realtime/ws";

export function buildConversationRealtimeWsUrl(args: {
  wsOrigin: string;
  accessToken: string;
  conversationId: string;
  lastEventId?: string;
}): string {
  const origin = args.wsOrigin.replace(/\/$/, "");
  const q = new URLSearchParams();
  q.set("token", args.accessToken);
  q.set("conversation_id", args.conversationId);
  if (args.lastEventId) {
    q.set("last_event_id", args.lastEventId);
  }
  return `${origin}${WS_PATH}?${q.toString()}`;
}

export function parseRealtimeWsPayload(raw: string): RealtimeWsInbound | null {
  try {
    return JSON.parse(raw) as RealtimeWsInbound;
  } catch {
    return null;
  }
}

export type ConversationWsCallbacks = {
  onOpen: () => void;
  onFrame: (frame: RealtimeWsInbound) => void;
  onClose: (ev: CloseEvent) => void;
};

/**
 * 低层 WS 封装；重连与降级策略由 chat-window 编排。
 */
export function openConversationWebSocket(
  url: string,
  callbacks: ConversationWsCallbacks,
): { close: () => void; sendJson: (payload: Record<string, unknown>) => void; raw: WebSocket } {
  const ws = new WebSocket(url);
  ws.onopen = () => {
    callbacks.onOpen();
  };
  ws.onmessage = (evt) => {
    if (typeof evt.data !== "string") return;
    const frame = parseRealtimeWsPayload(evt.data);
    if (frame) callbacks.onFrame(frame);
  };
  ws.onclose = (ev) => {
    callbacks.onClose(ev);
  };
  return {
    raw: ws,
    close: () => {
      try {
        ws.close(1000, "client_close");
      } catch {
        /* ignore */
      }
    },
    sendJson: (payload: Record<string, unknown>) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    },
  };
}

export function mergeReadReceipt(
  messages: ChatMessage[],
  messageId: string,
  readerUserId: string,
): ChatMessage[] {
  return messages.map((m) => {
    if (m.id !== messageId) return m;
    const prev = m.readByUserIds ?? [];
    if (prev.includes(readerUserId)) return m;
    return { ...m, readByUserIds: [...prev, readerUserId] };
  });
}
