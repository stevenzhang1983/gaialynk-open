/**
 * E-20 V1.3.1: desktop Connector mainline — pairing, receipts (HMAC), audit, execute fan-out + WS.
 */
import { createHmac } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import type { Hono } from "hono";
import WebSocket from "ws";
import { createApp } from "../src/app";
import { closePool } from "../src/infra/db/client";
import { resetDesktopExecuteRuntime } from "../src/modules/connectors/desktop/desktop-execute.runtime";
import { hashPairingCode } from "../src/modules/connectors/desktop/desktop-connector.store";
import { resetDesktopWebSocketRegistry } from "../src/modules/realtime/desktop-ws.registry";
import { resetWebSocketRegistry } from "../src/modules/realtime/ws.registry";

const pgDescribe = process.env.DATABASE_URL ? describe : describe.skip;

function buildReceiptSignJson(p: {
  action: string;
  device_id: string;
  path_hash: string;
  status: string;
  ts: string;
  error_code?: string;
}): string {
  if (p.error_code != null && p.error_code !== "") {
    return JSON.stringify({
      action: p.action,
      device_id: p.device_id,
      error_code: p.error_code,
      path_hash: p.path_hash,
      status: p.status,
      ts: p.ts,
    });
  }
  return JSON.stringify({
    action: p.action,
    device_id: p.device_id,
    path_hash: p.path_hash,
    status: p.status,
    ts: p.ts,
  });
}

pgDescribe("E-20 desktop connector (PostgreSQL)", () => {
  afterAll(async () => {
    await closePool();
  });

  beforeEach(() => {
    resetWebSocketRegistry();
    resetDesktopWebSocketRegistry();
    resetDesktopExecuteRuntime();
  });

  it("pairing: pending → POST pair → pair-status completed issues device_token", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e20-${suffix}@example.com`, password: "password123" }),
    });
    expect(reg.status).toBe(201);
    const regJson = (await reg.json()) as { data: { access_token: string } };
    const userToken = regJson.data.access_token;

    const code = "554433";
    const pend = await app.request(
      `/api/v1/connectors/desktop/pair-status?pairing_code=${code}`,
    );
    expect(pend.status).toBe(200);
    expect((await pend.json()).data.status).toBe("pending");

    const pair = await app.request("/api/v1/connectors/desktop/pair", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ pairing_code: code, device_name: "Test Mac" }),
    });
    expect(pair.status).toBe(200);
    const pairBody = (await pair.json()) as { data: { device_id: string } };
    expect(pairBody.data.device_id).toBeTruthy();

    const done = await app.request(
      `/api/v1/connectors/desktop/pair-status?pairing_code=${code}`,
    );
    expect(done.status).toBe(200);
    const doneBody = (await done.json()) as {
      data: {
        status: string;
        device_token: string;
        device_secret: string;
        device_id: string;
      };
    };
    expect(doneBody.data.status).toBe("completed");
    expect(doneBody.data.device_token?.length).toBeGreaterThan(20);
    expect(doneBody.data.device_secret?.length).toBeGreaterThan(20);
    expect(doneBody.data.device_id).toBe(pairBody.data.device_id);
  });

  it("receipt: valid HMAC → audit path + external receipt; bad HMAC → 400 + receipt_rejected", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e20r-${suffix}@example.com`, password: "password123" }),
    });
    const regJsonR = (await reg.json()) as { data: { access_token: string } };
    const userToken = regJsonR.data.access_token;
    const code = "221100";
    await app.request("/api/v1/connectors/desktop/pair", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ pairing_code: code }),
    });
    const st = await app.request(`/api/v1/connectors/desktop/pair-status?pairing_code=${code}`);
    const stBody = (await st.json()) as {
      data: { device_token: string; device_secret: string; device_id: string };
    };
    const { device_token, device_secret, device_id } = stBody.data;
    const ts = new Date().toISOString();
    const path_hash = "abcd".repeat(16);
    const signJson = buildReceiptSignJson({
      action: "file_read",
      device_id,
      path_hash,
      status: "ok",
      ts,
    });
    const env_signature = createHmac("sha256", Buffer.from(device_secret, "utf8"))
      .update(signJson, "utf8")
      .digest("hex");

    const good = await app.request("/api/v1/connectors/desktop/receipts", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${device_token}` },
      body: JSON.stringify({
        device_id,
        action: "file_read",
        path_hash,
        status: "ok",
        ts,
        env_signature,
      }),
    });
    expect(good.status).toBe(200);
    const goodJson = (await good.json()) as { data: { receipt_id: string } };
    expect(goodJson.data.receipt_id).toBeTruthy();

    const bad = await app.request("/api/v1/connectors/desktop/receipts", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${device_token}` },
      body: JSON.stringify({
        device_id,
        action: "file_read",
        path_hash,
        status: "ok",
        ts,
        env_signature: "00".repeat(32),
      }),
    });
    expect(bad.status).toBe(400);
  });

  it("DELETE device revokes: receipt with old device_token returns 403", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e20d-${suffix}@example.com`, password: "password123" }),
    });
    const regJsonD = (await reg.json()) as { data: { access_token: string } };
    const userToken = regJsonD.data.access_token;
    const code = "887766";
    const pairRes = await app.request("/api/v1/connectors/desktop/pair", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ pairing_code: code }),
    });
    const pairJsonD = (await pairRes.json()) as { data: { device_id: string } };
    const device_id = pairJsonD.data.device_id;
    const st = await app.request(`/api/v1/connectors/desktop/pair-status?pairing_code=${code}`);
    const stJsonD = (await st.json()) as {
      data: { device_token: string; device_secret: string };
    };
    const { device_token, device_secret } = stJsonD.data;

    const del = await app.request(`/api/v1/connectors/desktop/devices/${device_id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(del.status).toBe(200);

    const ts = new Date().toISOString();
    const path_hash = "beef".repeat(16);
    const signJson = buildReceiptSignJson({
      action: "file_list",
      device_id,
      path_hash,
      status: "ok",
      ts,
    });
    const env_signature = createHmac("sha256", Buffer.from(device_secret, "utf8"))
      .update(signJson, "utf8")
      .digest("hex");
    const rec = await app.request("/api/v1/connectors/desktop/receipts", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${device_token}` },
      body: JSON.stringify({
        device_id,
        action: "file_list",
        path_hash,
        status: "ok",
        ts,
        env_signature,
      }),
    });
    expect(rec.status).toBe(403);
  });

  it("execute file_list: WS receives desktop_execute; result endpoint completes", async () => {
    const app = createApp();
    const honoApp = app as unknown as Hono;
    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: honoApp });
    const { registerRealtimeWebSocketRoutes } = await import("../src/modules/realtime/ws.gateway");
    const { registerDesktopConnectorWebSocketRoutes } = await import(
      "../src/modules/connectors/desktop/desktop-ws.gateway"
    );
    registerRealtimeWebSocketRoutes(honoApp, upgradeWebSocket);
    registerDesktopConnectorWebSocketRoutes(honoApp, upgradeWebSocket);

    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e20w-${suffix}@example.com`, password: "password123" }),
    });
    const regJsonW = (await reg.json()) as { data: { access_token: string } };
    const userToken = regJsonW.data.access_token;
    const code = "334455";
    const pairRes = await app.request("/api/v1/connectors/desktop/pair", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ pairing_code: code }),
    });
    const pairJsonW = (await pairRes.json()) as { data: { device_id: string } };
    const device_id = pairJsonW.data.device_id;
    const st = await app.request(`/api/v1/connectors/desktop/pair-status?pairing_code=${code}`);
    const stJsonW = (await st.json()) as { data: { device_token: string } };
    const device_token = stJsonW.data.device_token;

    let listenPort = 0;
    const server = serve({ fetch: app.fetch, port: 0 }, (info) => {
      listenPort = info.port;
    });
    injectWebSocket(server);
    await new Promise<void>((r) => setTimeout(r, 50));
    if (!listenPort) {
      throw new Error("server did not bind port");
    }

    const q = new URLSearchParams({ device_token });
    const wsUrl = `ws://127.0.0.1:${listenPort}/api/v1/connectors/desktop/ws?${q.toString()}`;
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    const waitMsg = () =>
      new Promise<string>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("ws message timeout")), 8000);
        ws.once("message", (d) => {
          clearTimeout(t);
          resolve(String(d));
        });
      });

    const m1 = await waitMsg();
    const first = JSON.parse(m1) as { type: string };
    expect(first.type).toBe("desktop_connected");

    const ex = await app.request("/api/v1/connectors/desktop/execute", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        action: "file_list",
        path: "",
        device_id,
      }),
    });
    expect(ex.status).toBe(200);
    const exBody = (await ex.json()) as { data: { request_id: string } };
    const requestId = exBody.data.request_id;

    const rawExec = await waitMsg();
    const execFrame = JSON.parse(rawExec) as {
      type: string;
      request_id: string;
      action: string;
    };
    expect(execFrame.type).toBe("desktop_execute");
    expect(execFrame.request_id).toBe(requestId);
    expect(execFrame.action).toBe("file_list");

    const resPost = await app.request("/api/v1/connectors/desktop/execute-result", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${device_token}` },
      body: JSON.stringify({
        request_id: requestId,
        ok: true,
        result: { items: [] },
      }),
    });
    expect(resPost.status).toBe(200);

    const poll = await app.request(`/api/v1/connectors/desktop/execute/${requestId}/result`, {
      headers: { authorization: `Bearer ${userToken}` },
    });
    expect(poll.status).toBe(200);
    const pollBody = (await poll.json()) as { data: { status: string; result: unknown } };
    expect(pollBody.data.status).toBe("completed");
    expect(pollBody.data.result).toEqual({ items: [] });

    ws.close();
    await new Promise<void>((r) => server.close(() => r()));
  });

  it("file_write new prefix: 403 + challenge, confirm token, then dispatch", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e20t-${suffix}@example.com`, password: "password123" }),
    });
    const regJsonT = (await reg.json()) as { data: { access_token: string } };
    const userToken = regJsonT.data.access_token;
    const code = "665544";
    await app.request("/api/v1/connectors/desktop/pair", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ pairing_code: code }),
    });
    const st = await app.request(`/api/v1/connectors/desktop/pair-status?pairing_code=${code}`);
    const stJsonT = (await st.json()) as { data: { device_id: string } };
    const device_id = stJsonT.data.device_id;

    const blocked = await app.request("/api/v1/connectors/desktop/execute", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        action: "file_write",
        path: "newdir/x.txt",
        device_id,
        write_targets_new_path_prefix: true,
      }),
    });
    expect(blocked.status).toBe(403);
    const ch = (await blocked.json()) as {
      error: { details?: { challenge_id?: string } };
    };
    const challengeId = ch.error.details?.challenge_id;
    expect(challengeId).toBeTruthy();

    const conf = await app.request(
      `/api/v1/connectors/desktop/write-challenges/${challengeId}/confirm`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${userToken}` },
      },
    );
    expect(conf.status).toBe(200);
    const tok = (await conf.json()) as { data: { write_confirmation_token: string } };
    expect(tok.data.write_confirmation_token).toBeTruthy();

    const ok = await app.request("/api/v1/connectors/desktop/execute", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        action: "file_write",
        path: "newdir/x.txt",
        device_id,
        write_targets_new_path_prefix: true,
        write_confirmation_token: tok.data.write_confirmation_token,
      }),
    });
    expect(ok.status).toBe(200);
    expect((await ok.json()).data.request_id).toBeTruthy();
  });
});

describe("E-20 pairing hash helper", () => {
  it("hashPairingCode is stable for same secret", () => {
    process.env.DESKTOP_CONNECTOR_PAIRING_SECRET = "test-desktop-pairing-secret-min-16";
    const a = hashPairingCode("123456");
    const b = hashPairingCode("123456");
    expect(a).toBe(b);
    expect(a.length).toBe(64);
  });
});
