/**
 * E-3 V1.3: Space presence API, message delivery status, WebSocket + replay.
 */
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";
import { describe, expect, it } from "vitest";
import WebSocket from "ws";
import { createApp } from "../src/app";
import { markUserOnlineInSpaceAsync } from "../src/modules/realtime/presence.store";
import { registerRealtimeWebSocketRoutes } from "../src/modules/realtime/ws.gateway";

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

describe("E-3 realtime / presence / message status", () => {
  it("GET /api/v1/spaces/:id/presence returns members with offline/online", async () => {
    const app = createApp();
    const a = await register(app, "e3-presence-a@example.com");
    const b = await register(app, "e3-presence-b@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "E3 Team", type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = (await teamRes.json()).data.id as string;

    const invRes = await app.request(`/api/v1/spaces/${spaceId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ preset_role: "member", ttl_hours: 24 }),
    });
    expect(invRes.status).toBe(201);
    const token = (await invRes.json()).data.token as string;

    const joinRes = await app.request("/api/v1/spaces/join", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${b.access_token}` },
      body: JSON.stringify({ token }),
    });
    expect(joinRes.status).toBe(200);

    let presRes = await app.request(`/api/v1/spaces/${spaceId}/presence`, {
      headers: { Authorization: `Bearer ${a.access_token}` },
    });
    expect(presRes.status).toBe(200);
    let body = (await presRes.json()) as { data: { members: { user_id: string; presence_status: string }[] } };
    expect(body.data.members.length).toBe(2);
    expect(body.data.members.every((m) => m.presence_status === "offline")).toBe(true);

    await markUserOnlineInSpaceAsync(spaceId, a.user.id);

    presRes = await app.request(`/api/v1/spaces/${spaceId}/presence`, {
      headers: { Authorization: `Bearer ${a.access_token}` },
    });
    expect(presRes.status).toBe(200);
    body = (await presRes.json()) as { data: { members: { user_id: string; presence_status: string }[] } };
    const rowA = body.data.members.find((m) => m.user_id === a.user.id);
    const rowB = body.data.members.find((m) => m.user_id === b.user.id);
    expect(rowA?.presence_status).toBe("online");
    expect(rowB?.presence_status).toBe("offline");
  });

  it("POST message returns status delivered", async () => {
    const app = createApp();
    const a = await register(app, "e3-msg-status@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "E3 Msg", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ title: "E3 conv", space_id: spaceId }),
    });
    const convId = (await convRes.json()).data.id as string;

    const msgRes = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${a.access_token}`,
      },
      body: JSON.stringify({ sender_id: a.user.id, text: "hello e3" }),
    });
    expect(msgRes.status).toBe(201);
    const msgBody = (await msgRes.json()) as { data: { status?: string } };
    expect(msgBody.data.status).toBe("delivered");
  });

  it("WebSocket receives replay and subsequent messages", async () => {
    const app = createApp();
    const honoApp = app as unknown as Hono;
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: honoApp });
    registerRealtimeWebSocketRoutes(honoApp, upgradeWebSocket);

    const a = await register(app, "e3-ws-user@example.com");
    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "E3 WS Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;
    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ title: "E3 ws conv", space_id: spaceId }),
    });
    const convId = (await convRes.json()).data.id as string;

    const firstMsgRes = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${a.access_token}`,
      },
      body: JSON.stringify({ sender_id: a.user.id, text: "before ws" }),
    });
    expect(firstMsgRes.status).toBe(201);
    const firstId = ((await firstMsgRes.json()) as { data: { id: string } }).data.id;

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

    const q = new URLSearchParams({
      token: a.access_token,
      conversation_id: convId,
      last_event_id: firstId,
    });
    const wsUrl = `ws://127.0.0.1:${port}/api/v1/realtime/ws?${q.toString()}`;
    const ws = new WebSocket(wsUrl);

    const frames: string[] = [];
    ws.on("message", (data) => {
      frames.push(data.toString());
    });

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("ws open timeout")), 5000);
      ws.once("open", () => {
        clearTimeout(t);
        resolve();
      });
      ws.once("error", (e) => {
        clearTimeout(t);
        reject(e);
      });
    });

    const hasConnected = (): boolean =>
      frames.some((f) => {
        try {
          return (JSON.parse(f) as { type?: string }).type === "connected";
        } catch {
          return false;
        }
      });
    for (let i = 0; i < 200; i++) {
      if (hasConnected()) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(hasConnected()).toBe(true);

    const secondRes = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${a.access_token}`,
      },
      body: JSON.stringify({ sender_id: a.user.id, text: "after ws" }),
    });
    expect(secondRes.status).toBe(201);

    const hasLive = (): boolean => frames.some((f) => f.includes("after ws"));
    for (let i = 0; i < 200; i++) {
      if (hasLive()) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(hasLive()).toBe(true);

    const parsed = frames.map((m) => JSON.parse(m) as { type: string; replayed_count?: number });
    const connected = parsed.find((p) => p.type === "connected");
    expect(connected?.replayed_count).toBe(0);

    ws.close();
    await once(ws, "close");
    close();
  });
});
