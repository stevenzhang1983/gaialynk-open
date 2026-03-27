import type { Message } from "./conversation.store";
import { publish as publishInProcess } from "./message-stream";
import { fanoutConversationPayload } from "../realtime/redis-pubsub";

export type RealtimeEnvelope =
  | { type: "message"; event_id: string; data: Message }
  | { type: "connected"; conversation_id: string; replayed_count: number }
  | { type: "message_read"; message_id: string; user_id: string; read_at: string }
  | { type: "typing_start"; conversation_id: string; user_id: string }
  | { type: "typing_stop"; conversation_id: string; user_id: string }
  | { type: "presence_update"; space_id: string; user_id: string; status: "online" | "away" };

export function publishConversationRealtime(conversationId: string, message: Message): void {
  publishInProcess(conversationId, message);
  const envelope: RealtimeEnvelope = { type: "message", event_id: message.id, data: message };
  fanoutConversationPayload(conversationId, JSON.stringify(envelope));
}
