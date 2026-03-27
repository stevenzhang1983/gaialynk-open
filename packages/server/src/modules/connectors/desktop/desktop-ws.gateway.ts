import type { Hono } from "hono";
import type { UpgradeWebSocket, WSContext } from "hono/ws";
import type { WebSocket } from "ws";
import { verifyDesktopDeviceToken } from "../../auth/jwt";
import { assertDeviceActiveByIdAsync } from "./desktop-connector.store";
import { registerDesktopUserWebSocket } from "../../realtime/desktop-ws.registry";

type NodeUpgradeWebSocket = UpgradeWebSocket<WebSocket, { onError: (err: unknown) => void }>;

function parseWsQuery(ws: WSContext<WebSocket>): URLSearchParams {
  const u = ws.url;
  if (u) {
    return u.searchParams;
  }
  return new URLSearchParams();
}

export function registerDesktopConnectorWebSocketRoutes(app: Hono, upgradeWebSocket: NodeUpgradeWebSocket): void {
  app.get(
    "/api/v1/connectors/desktop/ws",
    upgradeWebSocket(
      () => {
        let unregister: (() => void) | null = null;

        return {
          onOpen(_evt, ws) {
            void (async () => {
              const q = parseWsQuery(ws);
              const token = q.get("device_token") ?? q.get("token") ?? q.get("access_token");
              const deny = (code: number, reason: string) => {
                ws.close(code, reason);
              };

              if (!token?.trim()) {
                deny(4400, "device_token query param is required");
                return;
              }

              const payload = verifyDesktopDeviceToken(token.trim());
              if (!payload) {
                deny(4401, "invalid or expired device token");
                return;
              }

              const device = await assertDeviceActiveByIdAsync(payload.device_id);
              if (!device || device.user_id !== payload.sub) {
                deny(4403, "device not active");
                return;
              }

              unregister = registerDesktopUserWebSocket(payload.sub, ws);
              ws.send(
                JSON.stringify({
                  type: "desktop_connected",
                  user_id: payload.sub,
                  device_id: payload.device_id,
                }),
              );
            })();
          },
          onClose() {
            unregister?.();
            unregister = null;
          },
        };
      },
      { onError: (err) => console.error("[connectors/desktop/ws]", err) },
    ),
  );
}
