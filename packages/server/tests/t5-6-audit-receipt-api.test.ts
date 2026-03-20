/**
 * T-5.6 审计与收据 API 验收测试
 * 验收条件：收据包含签名、可独立验证；审计时间线按时间排序、支持过滤。
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

async function setupConversationWithReceipt() {
  const app = createApp();

  const createConv = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Audit Receipt Test" }),
  });
  const convBody = await createConv.json();
  const conversationId = convBody.data.id as string;

  const regAgent = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Low Risk Agent",
      description: "For receipt test",
      agent_type: "execution",
      source_url: "mock://low-agent",
      capabilities: [{ name: "safe_action", risk_level: "low" }],
    }),
  });
  const agentBody = await regAgent.json();
  const agentId = agentBody.data.id as string;

  await app.request(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });

  const sendMsg = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender_id: "user-1", text: "run safe action" }),
  });
  expect(sendMsg.status).toBe(201);
  const sendBody = await sendMsg.json();
  const receiptId = sendBody.meta?.receipt_id as string;
  expect(receiptId).toBeTypeOf("string");

  return { app, conversationId, agentId, receiptId };
}

describe("T-5.6 Audit & Receipt API", () => {
  describe("GET /api/v1/receipts/:id", () => {
    it("returns receipt detail with signature for independent verification", async () => {
      const { app, receiptId } = await setupConversationWithReceipt();

      const res = await app.request(`/api/v1/receipts/${receiptId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe(receiptId);
      expect(body.data.audit_event_id).toBeTypeOf("string");
      expect(body.data.receipt_type).toBe("invocation_completed");
      expect(body.data.payload_hash).toBeTypeOf("string");
      expect(body.data.signature).toBeTypeOf("string");
      expect(body.data.signer).toBeTypeOf("string");
      expect(body.data.issued_at).toBeTypeOf("string");
      expect(body.meta?.is_valid).toBe(true);
    });

    it("returns 404 for non-existent receipt", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/receipts/00000000-0000-0000-0000-000000000000");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error?.code).toBe("receipt_not_found");
    });
  });

  describe("GET /api/v1/receipts/:id/verify", () => {
    it("returns verification result for valid receipt", async () => {
      const { app, receiptId } = await setupConversationWithReceipt();

      const res = await app.request(`/api/v1/receipts/${receiptId}/verify`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.receipt_id).toBe(receiptId);
      expect(body.data.is_valid).toBe(true);
    });

    it("returns 404 for non-existent receipt on verify", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/receipts/00000000-0000-0000-0000-000000000000/verify");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error?.code).toBe("receipt_not_found");
    });
  });

  describe("GET /api/v1/audit/timeline", () => {
    it("returns audit timeline sorted by time with filters", async () => {
      const { app, conversationId, agentId } = await setupConversationWithReceipt();

      const res = await app.request(
        `/api/v1/audit/timeline?conversation_id=${conversationId}&limit=20&sort=created_at:desc`,
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.meta?.next_cursor !== undefined || body.data.length === 0).toBe(true);

      const event = body.data[0];
      expect(event.id).toBeTypeOf("string");
      expect(event.event_type).toBeTypeOf("string");
      expect(event.conversation_id).toBe(conversationId);
      expect(event.actor_type).toBeDefined();
      expect(event.actor_id).toBeDefined();
      expect(event.payload).toBeDefined();
      expect(event.correlation_id).toBeTypeOf("string");
      expect(event.created_at).toBeTypeOf("string");

      if (body.data.length >= 2) {
        const first = new Date(body.data[0].created_at).getTime();
        const second = new Date(body.data[1].created_at).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });

    it("filters timeline by agent_id", async () => {
      const { app, conversationId, agentId } = await setupConversationWithReceipt();

      const res = await app.request(
        `/api/v1/audit/timeline?conversation_id=${conversationId}&agent_id=${agentId}&limit=50`,
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.data)).toBe(true);
      for (const event of body.data) {
        expect(event.agent_id).toBe(agentId);
      }
    });

    it("returns 400 for invalid timeline query", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/audit/timeline?limit=99999");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v1/audit/events/:id", () => {
    it("returns audit event detail by id", async () => {
      const { app, conversationId } = await setupConversationWithReceipt();

      const listRes = await app.request(`/api/v1/audit-events?conversation_id=${conversationId}&limit=1`);
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      expect(listBody.data.length).toBeGreaterThanOrEqual(1);
      const eventId = listBody.data[0].id as string;

      const res = await app.request(`/api/v1/audit/events/${eventId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.id).toBe(eventId);
      expect(body.data.event_type).toBeTypeOf("string");
      expect(body.data.conversation_id).toBe(conversationId);
      expect(body.data.actor_type).toBeDefined();
      expect(body.data.actor_id).toBeDefined();
      expect(body.data.payload).toBeDefined();
      expect(body.data.correlation_id).toBeTypeOf("string");
      expect(body.data.created_at).toBeTypeOf("string");
    });

    it("returns 404 for non-existent audit event", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/audit/events/00000000-0000-0000-0000-000000000000");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error?.code).toBe("audit_event_not_found");
    });
  });
});
