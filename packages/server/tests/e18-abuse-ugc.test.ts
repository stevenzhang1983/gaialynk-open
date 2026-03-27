/**
 * E-18 V1.3.1: Rate limits (register / messages / directory search) + UGC report + admin hide.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { closePool, query } from "../src/infra/db/client";
import { resetRateLimiterInMemory } from "../src/infra/rate-limiter";
import { getReportsAsync } from "../src/modules/moderation/message-moderation.store";

const pgDescribe = process.env.DATABASE_URL ? describe : describe.skip;

async function register(
  app: ReturnType<typeof createApp>,
  email: string,
  headers?: Record<string, string>,
) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", ...(headers ?? {}) },
    body: JSON.stringify({
      email,
      password: "password123",
    }),
  });
  return res;
}

describe("E-18 rate limit + UGC (no DB)", () => {
  beforeEach(() => {
    resetRateLimiterInMemory();
  });

  it.skipIf(!process.env.DATABASE_URL)("11th register attempt from same IP returns 429 + Retry-After + 操作过频", async () => {
    const app = createApp();
    const fwd = "203.0.113.99";
    const base = `e18reg-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      const res = await register(app, `${base}-${i}@example.com`, { "X-Forwarded-For": fwd });
      expect(res.status).toBe(201);
    }
    const blocked = await register(app, `${base}-11@example.com`, { "X-Forwarded-For": fwd });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    const body = await blocked.json();
    expect(body.error?.code).toBe("rate_limit_exceeded");
    expect(String(body.error?.message)).toContain("操作过频");
  });
});

pgDescribe("E-18 UGC + message rate (PostgreSQL)", () => {
  afterAll(async () => {
    await closePool();
  });

  beforeEach(() => {
    resetRateLimiterInMemory();
    process.env.RATE_LIMIT_MESSAGE_PER_MIN = "30";
  });

  it("31st message in one minute returns 429", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e18msg-${suffix}@example.com`, password: "password123" }),
    });
    expect(reg.status).toBe(201);
    const token = ((await reg.json()) as { data: { access_token: string; user: { id: string } } }).data;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E18 msg rl" }),
    });
    expect(convRes.status).toBe(201);
    const conversationId = ((await convRes.json()) as { data: { id: string } }).data.id;

    for (let i = 0; i < 30; i++) {
      const m = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sender_id: token.user.id, text: `m${i}` }),
      });
      expect(m.status).toBe(201);
    }
    const blocked = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: token.user.id, text: "too many" }),
    });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("RATE_LIMIT_MESSAGE_PER_MIN env overrides default", async () => {
    process.env.RATE_LIMIT_MESSAGE_PER_MIN = "60";
    resetRateLimiterInMemory();
    const { getRateLimitMessagePerMinute } = await import("../src/infra/rate-limiter");
    expect(getRateLimitMessagePerMinute()).toBe(60);
    process.env.RATE_LIMIT_MESSAGE_PER_MIN = "30";
  });

  it("report user message + space admin hide shows placeholder in list", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const u1 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e18a-${suffix}@example.com`, password: "password123" }),
    });
    const u2 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `e18b-${suffix}@example.com`, password: "password123" }),
    });
    expect(u1.status).toBe(201);
    expect(u2.status).toBe(201);
    const t1 = ((await u1.json()) as { data: { access_token: string; user: { id: string } } }).data;
    const t2 = ((await u2.json()) as { data: { access_token: string; user: { id: string } } }).data;

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${t1.access_token}`,
      },
      body: JSON.stringify({ name: `E18 UGC ${suffix}`, type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = ((await teamRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${t1.access_token}`,
      },
      body: JSON.stringify({ user_id: t2.user.id, role: "member" }),
    });

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${t1.access_token}`,
      },
      body: JSON.stringify({ title: "E18 ugc", space_id: spaceId }),
    });
    expect(convRes.status).toBe(201);
    const conversationId = ((await convRes.json()) as { data: { id: string } }).data.id;

    const partRes = await app.request(`/api/v1/conversations/${conversationId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${t1.access_token}`,
      },
      body: JSON.stringify({ user_id: t2.user.id, role: "member" }),
    });
    expect(partRes.status).toBe(201);

    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${t1.access_token}`,
      },
      body: JSON.stringify({ sender_id: t1.user.id, text: "reportable content" }),
    });
    expect(msgRes.status).toBe(201);
    const messageId = ((await msgRes.json()) as { data: { id: string } }).data.id;

    const reportRes = await app.request(`/api/v1/messages/${messageId}/report`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${t2.access_token}`,
      },
      body: JSON.stringify({ reason: "spam", detail: "test" }),
    });
    expect(reportRes.status).toBe(201);

    const reports = await getReportsAsync({ messageId });
    expect(reports.some((r) => r.message_id === messageId && r.reporter_id === t2.user.id)).toBe(true);

    const hideRes = await app.request(`/api/v1/messages/${messageId}/hide`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${t1.access_token}`,
      },
    });
    expect(hideRes.status).toBe(200);

    const listRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      headers: { Authorization: `Bearer ${t2.access_token}` },
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as { data: Array<{ id: string; content: { text: string } }> };
    const row = listBody.data.find((m) => m.id === messageId);
    expect(row?.content.text).toBe("[该消息已被管理员隐藏]");

    const rows = await query<{ content_hidden: boolean }>(
      `SELECT content_hidden FROM messages WHERE id = $1`,
      [messageId],
    );
    expect(rows[0]?.content_hidden).toBe(true);
  });
});
