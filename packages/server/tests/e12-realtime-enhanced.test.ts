/**
 * E-12 V1.3.1: 已读回执、Typing、Redis Pub/Sub 扇出、并发闸门 Redis、配额通知去重。
 */
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WebSocket from "ws";
import { isPostgresEnabled } from "../src/infra/db/client";
import { createApp } from "../src/app";
import {
  resetInvocationCapacityForTests,
  resetInvocationCapacityRedisForTests,
  withPerAgentConcurrency,
} from "../src/modules/gateway/invocation-capacity";
import { recordQuotaWarningWithHourlyDedupAsync } from "../src/modules/notifications/notification-triggers";
import {
  listNotificationsPagedAsync,
  resetNotificationStore,
} from "../src/modules/notifications/notification.store";
import {
  getRedisCommandsClient,
  resetRedisPubSubForTests,
  startConversationRedisSubscriber,
} from "../src/modules/realtime/redis-pubsub";
import { resetTypingHandlersForTests } from "../src/modules/realtime/typing.handler";
import { resetWebSocketRegistry } from "../src/modules/realtime/ws.registry";

vi.hoisted(() => {
  process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
});

vi.mock("ioredis", async () => {
  const { default: MockRedis } = await import("ioredis-mock");
  return { default: MockRedis };
});

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  expect(res.status).toBe(201);
  return (await res.json()).data as {
    access_token: string;
    user: { id: string; email: string };
  };
}

describe("E-12 realtime enhanced", () => {
  beforeEach(async () => {
    process.env.REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    await resetRedisPubSubForTests();
    await resetInvocationCapacityRedisForTests();
    resetInvocationCapacityForTests();
    resetTypingHandlersForTests();
    resetWebSocketRegistry();
    startConversationRedisSubscriber();
  });

  afterEach(async () => {
    await resetRedisPubSubForTests();
    await resetInvocationCapacityRedisForTests();
    resetInvocationCapacityForTests();
    resetTypingHandlersForTests();
    resetWebSocketRegistry();
  });

  it("Redis: two subscribers on conv:* both receive publish", async () => {
    const { default: Redis } = await import("ioredis");
    const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
    const sub1 = new Redis(redisUrl);
    const sub2 = new Redis(redisUrl);
    const received: string[] = [];
    await sub1.subscribe("conv:double-sub-test");
    await sub2.subscribe("conv:double-sub-test");
    sub1.on("message", (_ch, msg) => received.push(`1:${msg}`));
    sub2.on("message", (_ch, msg) => received.push(`2:${msg}`));
    const pub = new Redis(redisUrl);
    await pub.publish("conv:double-sub-test", "ping");
    await new Promise((r) => setImmediate(r));
    expect(received.sort()).toEqual(["1:ping", "2:ping"]);
    await sub1.quit();
    await sub2.quit();
    await pub.quit();
  });

  it("invocation capacity with Redis: third queued call runs after first two finish", async () => {
    const agentId = `e12-cap-${Date.now()}`;
    const order: string[] = [];
    const slow = async (tag: string) => {
      order.push(`${tag}-enter`);
      await new Promise((r) => setTimeout(r, 30));
      order.push(`${tag}-exit`);
      return tag;
    };
    const p1 = withPerAgentConcurrency(agentId, 2, "queue", undefined, () => slow("1"));
    const p2 = withPerAgentConcurrency(agentId, 2, "queue", undefined, () => slow("2"));
    const p3 = withPerAgentConcurrency(agentId, 2, "queue", undefined, async () => {
      order.push("3-enter");
      return "3";
    });
    await Promise.all([p1, p2, p3]);
    const firstExit = Math.min(order.indexOf("1-exit"), order.indexOf("2-exit"));
    expect(order.indexOf("3-enter")).toBeGreaterThan(firstExit);
  });

  it("quota threshold notification dedup: same key within TTL only records once", async () => {
    const userId = "00000000-0000-0000-0000-00000000e120";
    const params = {
      userId,
      feature: "subscription_task_runs",
      threshold: "80" as const,
      eventType: "quota.threshold_80" as const,
      deepLink: "/account/usage?feature=test",
      payload: { feature: "subscription_task_runs", threshold: "80", used: 8, limit: 10 },
    };
    await recordQuotaWarningWithHourlyDedupAsync(params);
    await recordQuotaWarningWithHourlyDedupAsync(params);
    const r = getRedisCommandsClient();
    expect(r).toBeTruthy();
    const key = `gaialynk:quota:notify:${userId}:${params.feature}:${params.threshold}`;
    expect(await r!.get(key)).toBe("1");
    const ttl = await r!.ttl(key);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(3600);
  });

  it("WebSocket message_read and typing (with DATABASE_URL)", async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const app = createApp();
    const honoApp = app as unknown as Hono;
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: honoApp });
    const { registerRealtimeWebSocketRoutes } = await import("../src/modules/realtime/ws.gateway");
    registerRealtimeWebSocketRoutes(honoApp, upgradeWebSocket);

    const a = await register(app, `e12-a-${Date.now()}@example.com`);
    const b = await register(app, `e12-b-${Date.now()}@example.com`);

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "E12 Team", type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = (await teamRes.json()).data.id as string;

    const invRes = await app.request(`/api/v1/spaces/${spaceId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ preset_role: "member", ttl_hours: 24 }),
    });
    expect(invRes.status).toBe(201);
    const invToken = (await invRes.json()).data.token as string;

    const joinRes = await app.request("/api/v1/spaces/join", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${b.access_token}` },
      body: JSON.stringify({ token: invToken }),
    });
    expect(joinRes.status).toBe(200);

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ title: "E12 conv", space_id: spaceId }),
    });
    expect(convRes.status).toBe(201);
    const convId = (await convRes.json()).data.id as string;

    const msgRes = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${a.access_token}`,
      },
      body: JSON.stringify({ sender_id: a.user.id, text: "hello e12" }),
    });
    expect(msgRes.status).toBe(201);
    const msgId = ((await msgRes.json()) as { data: { id: string } }).data.id;

    const { port, close } = await new Promise<{ port: number; close: () => void }>((resolve, reject) => {
      try {
        const server = serve({ fetch: app.fetch, port: 0, hostname: "127.0.0.1" }, (info) => {
          injectWebSocket(server);
          const ad = info as AddressInfo;
          if (typeof ad?.port !== "number") {
            reject(new Error("expected tcp address"));
            return;
          }
          resolve({
            port: ad.port,
            close: () => {
              server.close();
            },
          });
        });
      } catch (e) {
        reject(e);
      }
    });

    const qA = new URLSearchParams({
      token: a.access_token,
      conversation_id: convId,
    });
    const qB = new URLSearchParams({
      token: b.access_token,
      conversation_id: convId,
    });
    const wsA = new WebSocket(`ws://127.0.0.1:${port}/api/v1/realtime/ws?${qA.toString()}`);
    const wsB = new WebSocket(`ws://127.0.0.1:${port}/api/v1/realtime/ws?${qB.toString()}`);

    const framesA: string[] = [];
    const framesB: string[] = [];
    wsA.on("message", (d) => framesA.push(d.toString()));
    wsB.on("message", (d) => framesB.push(d.toString()));

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("wsA open timeout")), 8000);
        wsA.once("open", () => {
          clearTimeout(t);
          resolve();
        });
        wsA.once("error", (e) => {
          clearTimeout(t);
          reject(e);
        });
      }),
      new Promise<void>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("wsB open timeout")), 8000);
        wsB.once("open", () => {
          clearTimeout(t);
          resolve();
        });
        wsB.once("error", (e) => {
          clearTimeout(t);
          reject(e);
        });
      }),
    ]);

    const waitFor = async (pred: () => boolean, timeoutMs = 4000): Promise<void> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        if (pred()) {
          return;
        }
        await new Promise((r) => setTimeout(r, 20));
      }
      throw new Error("waitFor timeout");
    };

    await waitFor(() => framesA.some((f) => f.includes('"type":"connected"')));
    await waitFor(() => framesB.some((f) => f.includes('"type":"connected"')));

    wsB.send(JSON.stringify({ type: "typing_start" }));
    await waitFor(() =>
      framesA.some((f) => {
        try {
          const j = JSON.parse(f) as { type?: string; user_id?: string };
          return j.type === "typing_start" && j.user_id === b.user.id;
        } catch {
          return false;
        }
      }),
    );

    const typingStartOk = framesA.some((f) => {
      try {
        const j = JSON.parse(f) as { type?: string; user_id?: string };
        return j.type === "typing_start" && j.user_id === b.user.id;
      } catch {
        return false;
      }
    });
    expect(typingStartOk).toBe(true);

    vi.useFakeTimers();
    try {
      for (let i = 0; i < 40; i++) {
        await vi.advanceTimersByTimeAsync(500);
        const got = framesA.some((f) => {
          try {
            const j = JSON.parse(f) as { type?: string; user_id?: string };
            return j.type === "typing_stop" && j.user_id === b.user.id;
          } catch {
            return false;
          }
        });
        if (got) {
          break;
        }
      }
      expect(
        framesA.some((f) => {
          try {
            const j = JSON.parse(f) as { type?: string; user_id?: string };
            return j.type === "typing_stop" && j.user_id === b.user.id;
          } catch {
            return false;
          }
        }),
      ).toBe(true);
    } finally {
      vi.useRealTimers();
    }

    wsB.send(JSON.stringify({ type: "message_read", message_id: msgId }));
    await waitFor(
      () =>
        framesA.some((f) => {
          try {
            const j = JSON.parse(f) as { type?: string; message_id?: string; user_id?: string };
            return j.type === "message_read" && j.message_id === msgId && j.user_id === b.user.id;
          } catch {
            return false;
          }
        }),
      5000,
    );

    wsA.close();
    wsB.close();
    await Promise.all([once(wsA, "close"), once(wsB, "close")]);
    close();
  });

  it("quota dedup without Redis: two writes for two helper calls (in-memory DB only)", async () => {
    if (isPostgresEnabled()) {
      return;
    }
    resetNotificationStore();
    const app = createApp();
    const u = await register(app, `e12-quota-${Date.now()}@example.com`);
    const params = {
      userId: u.user.id,
      feature: "agent_deployments",
      threshold: "100" as const,
      eventType: "quota.threshold_100" as const,
      deepLink: "/x",
      payload: { feature: "agent_deployments", threshold: "100", used: 1, limit: 1 },
    };
    const prev = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    await resetRedisPubSubForTests();
    await recordQuotaWarningWithHourlyDedupAsync(params);
    await recordQuotaWarningWithHourlyDedupAsync(params);
    process.env.REDIS_URL = prev;
    const page = await listNotificationsPagedAsync({
      userId: u.user.id,
      limit: 20,
      unreadOnly: false,
      cursor: undefined,
    });
    const quotaRows = page.items.filter((i) => i.event_type === "quota.threshold_100");
    expect(quotaRows.length).toBe(2);
  });
});
