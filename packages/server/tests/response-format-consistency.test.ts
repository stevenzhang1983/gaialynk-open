import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("response format consistency", () => {
  it("returns { data } on successful conversation list", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/conversations");
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body).toHaveProperty("data");
    expect(body.error).toBeUndefined();
  });

  it("returns { error: { code, message } } on not found", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/receipts/not-exists");
    expect(response.status).toBe(404);
    const body = await response.json();

    expect(body).toHaveProperty("error");
    expect(body.error).toHaveProperty("code");
    expect(body.error).toHaveProperty("message");
    expect(body.data).toBeUndefined();
  });

  it("returns trust_decision and receipt_id metadata for allowed invocation", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Consistency Demo" }),
    });
    const convBody = await convRes.json();

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Consistency Agent",
        description: "desc",
        agent_type: "execution",
        source_url: "mock://consistency-agent",
        capabilities: [{ name: "low-op", risk_level: "low" }],
      }),
    });
    const agentBody = await agentRes.json();

    await app.request(`/api/v1/conversations/${convBody.data.id}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    const messageRes = await app.request(`/api/v1/conversations/${convBody.data.id}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "u1", text: "run low operation" }),
    });

    expect(messageRes.status).toBe(201);
    const messageBody = await messageRes.json();

    expect(messageBody).toHaveProperty("data");
    expect(messageBody).toHaveProperty("meta");
    expect(messageBody.meta).toHaveProperty("trust_decision");
    expect(messageBody.meta).toHaveProperty("receipt_id");
  });

  it("returns { error } for invalid invocation status filter", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/invocations?status=bad_status");
    expect(response.status).toBe(400);
    const body = await response.json();

    expect(body).toHaveProperty("error");
    expect(body.error.code).toBe("invalid_status");
    expect(body.error).toHaveProperty("message");
    expect(body.error).toHaveProperty("details");
  });

  it("returns 400 validation_error for invalid request payload", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "",
        description: "missing fields",
      }),
    });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("validation_error");
    expect(body.error).toHaveProperty("details");
  });

  it("returns 502 when all targeted agents fail on A2A call", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "All A2A Failures" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Broken Agent",
        description: "will fail to connect",
        agent_type: "execution",
        source_url: "http://127.0.0.1:1/broken",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const agentBody = await agentRes.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    const messageRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "u-failure",
        text: "run failing task",
        target_agent_ids: [agentBody.data.id],
      }),
    });

    expect(messageRes.status).toBe(502);
    const messageBody = await messageRes.json();
    expect(messageBody).toHaveProperty("error");
    expect(messageBody.error.code).toBe("a2a_invocation_failed");
    expect(messageBody.error).toHaveProperty("details");
  });

  it("keeps invocation pending when confirm fails on A2A call", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Confirm Failure Keeps Pending" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "High Broken Agent",
        description: "high risk but unreachable",
        agent_type: "execution",
        source_url: "http://127.0.0.1:1/broken-confirm",
        capabilities: [{ name: "dangerous", risk_level: "high" }],
      }),
    });
    const agentBody = await agentRes.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    const messageRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "u-confirm-fail",
        text: "run risky task",
      }),
    });
    expect(messageRes.status).toBe(202);
    const messageBody = await messageRes.json();
    const invocationId = messageBody.meta.invocation_id as string;

    const confirmRes = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "u-confirm-fail" }),
    });
    expect(confirmRes.status).toBe(502);

    const invocationRes = await app.request(`/api/v1/invocations/${invocationId}`);
    expect(invocationRes.status).toBe(200);
    const invocationBody = await invocationRes.json();
    expect(invocationBody.data.status).toBe("pending_confirmation");
  });
});
