import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";
import { createApp } from "./app";
import { startDataRetentionJobLoop } from "./modules/data-retention/data-retention.job";
import { startOrchestrationSchedulerLoop } from "./modules/orchestration/orchestration-scheduler";
import { startConversationRedisSubscriber } from "./modules/realtime/redis-pubsub";
import { registerDesktopConnectorWebSocketRoutes } from "./modules/connectors/desktop/desktop-ws.gateway";
import { registerRealtimeWebSocketRoutes } from "./modules/realtime/ws.gateway";

startConversationRedisSubscriber();

if (
  process.env.NODE_ENV !== "test" &&
  process.env.VITEST !== "true" &&
  process.env.DISABLE_ORCHESTRATION_SCHEDULER !== "1"
) {
  startOrchestrationSchedulerLoop();
}

if (process.env.NODE_ENV !== "test" && process.env.VITEST !== "true") {
  startDataRetentionJobLoop();
}

// 2.1 Launch Closure: fail-fast on missing critical config when requested.
if (process.env.FAIL_FAST_CONFIG === "1") {
  const required: string[] = [];
  if (process.env.REQUIRE_DATABASE_URL === "1") {
    required.push("DATABASE_URL");
  }
  for (const key of required) {
    if (!process.env[key]?.trim()) {
      console.error(`[FAIL_FAST_CONFIG] Missing required env: ${key}`);
      process.exit(1);
    }
  }
}

const port = Number(process.env.PORT ?? "3000");

const app = createApp();
const honoApp = app as unknown as Hono;
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: honoApp });
registerRealtimeWebSocketRoutes(honoApp, upgradeWebSocket);
registerDesktopConnectorWebSocketRoutes(honoApp, upgradeWebSocket);

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    // Keep startup output simple for local demo runs.
    console.log(`GAIALYNK server listening on http://localhost:${info.port}`);
  },
);

injectWebSocket(server);
