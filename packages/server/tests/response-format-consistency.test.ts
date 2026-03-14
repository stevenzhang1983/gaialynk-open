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
        source_url: "https://example.com/consistency",
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
});
