import type { Hono } from "hono";
import type { UpgradeWebSocket, WSContext } from "hono/ws";
import type { WebSocket } from "ws";
import { verifyAccessToken } from "../auth/jwt";
import {
  conversationHasUserParticipantAsync,
  getConversationSummaryAsync,
  listMessagesAfterMessageIdAsync,
} from "../conversation/conversation.store";
import { userIsMemberOfSpaceAsync } from "../spaces/space.store";
import { markUserOnlineInSpaceAsync, scheduleMarkUserAwayInSpace } from "./presence.store";
import { fanoutConversationPayload } from "./redis-pubsub";
import { handleMessageReadEventAsync } from "./read-receipt.handler";
import { disposeTypingForUser, handleTypingStart, handleTypingStop } from "./typing.handler";
import { registerConversationWebSocket } from "./ws.registry";

type NodeUpgradeWebSocket = UpgradeWebSocket<WebSocket, { onError: (err: unknown) => void }>;

type WsSession = {
  conversationId: string;
  userId: string;
  spaceId: string | null;
};

function parseWsQuery(ws: WSContext<WebSocket>): URLSearchParams {
  const u = ws.url;
  if (u) {
    return u.searchParams;
  }
  return new URLSearchParams();
}

export function registerRealtimeWebSocketRoutes(app: Hono, upgradeWebSocket: NodeUpgradeWebSocket): void {
  app.get(
    "/api/v1/realtime/ws",
    upgradeWebSocket(
      () => {
        let unregister: (() => void) | null = null;
        let session: WsSession | null = null;

        return {
          onOpen(_evt, ws) {
            void (async () => {
              const q = parseWsQuery(ws);
              const token = q.get("token") ?? q.get("access_token");
              const conversationId = q.get("conversation_id")?.trim();
              const lastEventId = q.get("last_event_id")?.trim() || undefined;

              const deny = (code: number, reason: string) => {
                ws.close(code, reason);
              };

              if (!token || !conversationId) {
                deny(4400, "token and conversation_id query params are required");
                return;
              }

              const payload = verifyAccessToken(token);
              if (!payload) {
                deny(4401, "invalid or expired token");
                return;
              }

              const userId = payload.sub;
              const summary = await getConversationSummaryAsync(conversationId);
              if (!summary) {
                deny(4404, "conversation not found");
                return;
              }

              if (summary.space_id) {
                const ok = await userIsMemberOfSpaceAsync(summary.space_id, userId);
                if (!ok) {
                  deny(4403, "not a member of this space");
                  return;
                }
              } else {
                const ok = await conversationHasUserParticipantAsync(conversationId, userId);
                if (!ok) {
                  deny(4403, "not a participant in this conversation");
                  return;
                }
              }

              const replayed = await listMessagesAfterMessageIdAsync(conversationId, lastEventId);
              if (replayed === null) {
                deny(4404, "conversation not found");
                return;
              }

              session = {
                conversationId,
                userId,
                spaceId: summary.space_id ?? null,
              };

              unregister = registerConversationWebSocket(conversationId, ws);

              if (summary.space_id) {
                await markUserOnlineInSpaceAsync(summary.space_id, userId);
                fanoutConversationPayload(
                  conversationId,
                  JSON.stringify({
                    type: "presence_update",
                    space_id: summary.space_id,
                    user_id: userId,
                    status: "online",
                  }),
                );
              }

              for (const msg of replayed) {
                const env = { type: "message" as const, event_id: msg.id, data: msg };
                ws.send(JSON.stringify(env));
              }

              const hello = {
                type: "connected" as const,
                conversation_id: conversationId,
                replayed_count: replayed.length,
              };
              ws.send(JSON.stringify(hello));
            })();
          },
          onMessage(evt, _ws) {
            if (!session) {
              return;
            }
            const raw = evt.data;
            if (typeof raw !== "string") {
              return;
            }
            let parsed: { type?: string; message_id?: string };
            try {
              parsed = JSON.parse(raw) as { type?: string; message_id?: string };
            } catch {
              return;
            }
            const t = parsed.type;
            if (t === "message_read" && typeof parsed.message_id === "string") {
              void handleMessageReadEventAsync({
                conversationId: session.conversationId,
                userId: session.userId,
                messageId: parsed.message_id,
                spaceId: session.spaceId,
              });
              return;
            }
            if (t === "typing_start") {
              handleTypingStart(session.conversationId, session.userId);
              return;
            }
            if (t === "typing_stop") {
              handleTypingStop(session.conversationId, session.userId);
            }
          },
          onClose() {
            unregister?.();
            unregister = null;
            if (session) {
              disposeTypingForUser(session.conversationId, session.userId);
              if (session.spaceId) {
                scheduleMarkUserAwayInSpace(session.spaceId, session.userId, session.conversationId);
              }
              session = null;
            }
          },
        };
      },
      { onError: (err) => console.error("[realtime/ws]", err) },
    ),
  );
}
