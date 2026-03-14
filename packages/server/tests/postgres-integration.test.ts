import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app";
import { closePool } from "../src/infra/db/client";

const integrationDescribe = process.env.DATABASE_URL ? describe : describe.skip;

integrationDescribe("postgres integration", () => {
  const app = createApp();

  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for postgres integration test");
    }
  });

  afterAll(async () => {
    await closePool();
  });

  it("runs trusted invocation flow on PostgreSQL backend", async () => {
    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "PG Integration Conversation" }),
    });
    expect(conversationRes.status).toBe(201);
    const conversationBody = await conversationRes.json();
    const conversationId = conversationBody.data.id as string;

    const lowAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG Low Agent",
        description: "low risk agent",
        agent_type: "execution",
        source_url: "mock://pg-low",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    expect(lowAgentRes.status).toBe(201);
    const lowAgentBody = await lowAgentRes.json();
    const lowAgentId = lowAgentBody.data.id as string;

    const joinRes = await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: lowAgentId }),
    });
    expect(joinRes.status).toBe(201);

    const lowMessageRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "pg-user", text: "run low task" }),
    });
    expect(lowMessageRes.status).toBe(201);
    const lowMessageBody = await lowMessageRes.json();
    expect(lowMessageBody.meta.trust_decision.decision).toBe("allow");
    expect(lowMessageBody.meta.receipt_id).toBeTypeOf("string");

    const highConversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "PG High Conversation" }),
    });
    const highConversationBody = await highConversationRes.json();
    const highConversationId = highConversationBody.data.id as string;

    const highAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG High Agent",
        description: "high risk agent",
        agent_type: "execution",
        source_url: "mock://pg-high",
        capabilities: [{ name: "delete_data", risk_level: "high" }],
      }),
    });
    const highAgentBody = await highAgentRes.json();

    await app.request(`/api/v1/conversations/${highConversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: highAgentBody.data.id }),
    });

    const highMessageRes = await app.request(`/api/v1/conversations/${highConversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "pg-user", text: "run high task" }),
    });
    expect(highMessageRes.status).toBe(202);
    const highMessageBody = await highMessageRes.json();
    expect(highMessageBody.meta.trust_decision.decision).toBe("need_confirmation");

    const invocationId = highMessageBody.meta.invocation_id as string;
    const confirmRes = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "pg-user" }),
    });
    expect(confirmRes.status).toBe(200);
    const confirmBody = await confirmRes.json();

    const receiptRes = await app.request(`/api/v1/receipts/${confirmBody.meta.receipt_id}`);
    expect(receiptRes.status).toBe(200);
    const receiptBody = await receiptRes.json();
    expect(receiptBody.meta.is_valid).toBe(true);

    const metricsRes = await app.request("/api/v1/metrics");
    expect(metricsRes.status).toBe(200);
    const metricsBody = await metricsRes.json();
    expect(["go", "hold"]).toContain(metricsBody.data.go_no_go.decision);
    expect(Array.isArray(metricsBody.data.go_no_go.reasons)).toBe(true);
    expect(metricsBody.data.high_risk_interception_ratio).toBeGreaterThanOrEqual(0);
    expect(metricsBody.data.high_risk_interception_ratio).toBeLessThanOrEqual(1);
    expect(metricsBody.data.key_receipt_coverage_ratio).toBeGreaterThanOrEqual(0);
    expect(metricsBody.data.key_receipt_coverage_ratio).toBeLessThanOrEqual(1);
    expect(metricsBody.data.audit_event_coverage_ratio).toBeGreaterThanOrEqual(0);
    expect(metricsBody.data.audit_event_coverage_ratio).toBeLessThanOrEqual(1);
  });
});
