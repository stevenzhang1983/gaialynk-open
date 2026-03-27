import type { WSContext } from "hono/ws";
import type { WebSocket } from "ws";
import {
  fanoutDesktopUserPayload,
  registerDesktopUserFanoutLocalDelivery,
  releaseDesktopUserRedisChannel,
  retainDesktopUserRedisChannel,
} from "./redis-pubsub";

const socketsByUserId = new Map<string, Set<WSContext<WebSocket>>>();

const OPEN = 1;

function deliverDesktopUserLocal(userId: string, payload: string): void {
  const set = socketsByUserId.get(userId);
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

registerDesktopUserFanoutLocalDelivery(deliverDesktopUserLocal);

export function registerDesktopUserWebSocket(userId: string, ws: WSContext<WebSocket>): () => void {
  retainDesktopUserRedisChannel(userId);
  let set = socketsByUserId.get(userId);
  if (!set) {
    set = new Set();
    socketsByUserId.set(userId, set);
  }
  set.add(ws);
  return () => {
    set?.delete(ws);
    if (set?.size === 0) {
      socketsByUserId.delete(userId);
    }
    releaseDesktopUserRedisChannel(userId);
  };
}

export function resetDesktopWebSocketRegistry(): void {
  for (const set of socketsByUserId.values()) {
    for (const ws of set) {
      try {
        ws.close(1001, "server reset");
      } catch {
        /* ignore */
      }
    }
  }
  socketsByUserId.clear();
}
