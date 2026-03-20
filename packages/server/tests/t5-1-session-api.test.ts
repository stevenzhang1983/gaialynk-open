/**
 * T-5.1 会话 API 验收测试
 * CTO-Execution-Directive-v1 §5 主线团队 API 交付
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("T-5.1 Session API", () => {
  it("DELETE /api/v1/conversations/:id returns 404 for unknown id", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/conversations/00000000-0000-4000-8000-000000000000", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error?.code).toBe("conversation_not_found");
  });

  it("DELETE /api/v1/conversations/:id deletes existing conversation", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "To Delete" }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const conversationId = createBody.data.id as string;

    const deleteRes = await app.request(`/api/v1/conversations/${conversationId}`, { method: "DELETE" });
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.data.deleted).toBe(true);
    expect(deleteBody.data.id).toBe(conversationId);

    const getRes = await app.request(`/api/v1/conversations/${conversationId}`);
    expect(getRes.status).toBe(404);
  });

  it("GET /api/v1/conversations supports cursor, limit, sort", async () => {
    const app = createApp();
    await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "First" }),
    });
    await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Second" }),
    });

    const listAll = await app.request("/api/v1/conversations");
    expect(listAll.status).toBe(200);
    const listAllBody = await listAll.json();
    expect(Array.isArray(listAllBody.data)).toBe(true);
    const total = listAllBody.data.length;

    const page1 = await app.request("/api/v1/conversations?limit=1&sort=created_at:desc");
    expect(page1.status).toBe(200);
    const page1Body = await page1.json();
    expect(page1Body.data).toHaveLength(1);
    expect(page1Body.meta?.next_cursor).toBeDefined();

    const page2 = await app.request(
      `/api/v1/conversations?limit=1&sort=created_at:desc&cursor=${page1Body.meta.next_cursor}`,
    );
    expect(page2.status).toBe(200);
    const page2Body = await page2.json();
    expect(page2Body.data).toHaveLength(1);
    expect(page2Body.data[0].id).not.toBe(page1Body.data[0].id);
  });

  it("GET /api/v1/conversations/:id/messages returns 404 for unknown conversation", async () => {
    const app = createApp();
    const res = await app.request(
      "/api/v1/conversations/00000000-0000-4000-8000-000000000000/messages",
    );
    expect(res.status).toBe(404);
  });

  it("GET /api/v1/conversations/:id/messages supports cursor, limit, sort", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Messages Conv" }),
    });
    const conversationId = (await createRes.json()).data.id as string;

    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "u1", text: "Hello" }),
    });
    expect(msgRes.status).toBe(201);

    const listRes = await app.request(
      `/api/v1/conversations/${conversationId}/messages?limit=10&sort=created_at:desc`,
    );
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.data)).toBe(true);
    expect(listBody.data.length).toBeGreaterThanOrEqual(1);
    expect(listBody.data[0]).toHaveProperty("id");
    expect(listBody.data[0]).toHaveProperty("content");
    expect(listBody.data[0].content.type).toBe("text");
  });

  it("GET /api/v1/conversations/:id/messages/stream returns SSE for existing conversation", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Stream Conv" }),
    });
    const conversationId = (await createRes.json()).data.id as string;

    const streamRes = await app.request(`/api/v1/conversations/${conversationId}/messages/stream`);
    expect(streamRes.status).toBe(200);
    expect(streamRes.headers.get("content-type")).toContain("text/event-stream");
  });

  it("GET /api/v1/conversations/:id/messages/stream returns 404 for unknown conversation", async () => {
    const app = createApp();
    const res = await app.request(
      "/api/v1/conversations/00000000-0000-4000-8000-000000000000/messages/stream",
    );
    expect(res.status).toBe(404);
  });
});
