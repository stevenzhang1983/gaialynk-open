/**
 * T-5.4 Agent 接入 API 验收测试
 * CTO-Execution-Directive-v1 §5 主线团队 API 交付
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

describe("T-5.4 Agent Register API", () => {
  it("POST /api/v1/agents/register requires auth", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Test Agent",
        description: "For testing",
        agent_type: "logical",
        source_url: "https://example.com/a2a",
        capabilities: [{ name: "test", risk_level: "low" }],
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error?.code).toBe("unauthorized");
  });

  it("POST /api/v1/agents/register requires provider role", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "consumer@example.com", password: "password123", role: "consumer" }),
    });
    expect(reg.status).toBe(201);
    const { access_token } = (await reg.json()).data;
    const res = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({
        name: "Test Agent",
        description: "For testing",
        agent_type: "logical",
        source_url: "https://example.com/a2a",
        capabilities: [{ name: "test", risk_level: "low" }],
      }),
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error?.code).toBe("forbidden");
    expect(body.error?.message).toContain("Provider");
  });

  it("POST /api/v1/agents/register creates agent with owner_id and pending_review", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "provider@example.com", password: "password123", role: "provider" }),
    });
    expect(reg.status).toBe(201);
    const { access_token, user } = (await reg.json()).data;
    const res = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({
        name: "My A2A Agent",
        description: "Self-hosted agent",
        agent_type: "execution",
        source_url: "mock://my-agent",
        capabilities: [{ name: "run", risk_level: "low" }],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.id).toBeDefined();
    expect(body.data.name).toBe("My A2A Agent");
    expect(body.data.source_origin).toBe("self_hosted");
    expect(body.data.status).toBe("pending_review");
    expect(body.data.owner_id).toBe(user.id);
  });

  it("GET /api/v1/agents/mine returns only provider agents", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "p2@example.com", password: "password123", role: "provider" }),
    });
    expect(reg.status).toBe(201);
    const { access_token } = (await reg.json()).data;
    await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({
        name: "Agent One",
        description: "First",
        agent_type: "logical",
        source_url: "mock://one",
        capabilities: [{ name: "a", risk_level: "low" }],
      }),
    });
    const listRes = await app.request("/api/v1/agents/mine", {
      headers: bearer(access_token),
    });
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.data)).toBe(true);
    expect(listBody.data.length).toBeGreaterThanOrEqual(1);
    expect(listBody.data.some((a: { name: string }) => a.name === "Agent One")).toBe(true);
  });

  it("POST /api/v1/agents/:id/health-check and GET result", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "health@example.com", password: "password123", role: "provider" }),
    });
    expect(reg.status).toBe(201);
    const { access_token } = (await reg.json()).data;
    const createRes = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({
        name: "Health Agent",
        description: "Mock",
        agent_type: "logical",
        source_url: "mock://health",
        capabilities: [{ name: "h", risk_level: "low" }],
      }),
    });
    const agentId = (await createRes.json()).data.id;
    const checkRes = await app.request(`/api/v1/agents/${agentId}/health-check`, {
      method: "POST",
      headers: bearer(access_token),
    });
    expect(checkRes.status).toBe(200);
    const checkBody = await checkRes.json();
    expect(checkBody.data.status).toBe("ok");
    const resultRes = await app.request(`/api/v1/agents/${agentId}/health-check/result`, {
      headers: bearer(access_token),
    });
    expect(resultRes.status).toBe(200);
    const resultBody = await resultRes.json();
    expect(resultBody.data.status).toBe("ok");
    expect(resultBody.data.checked_at).toBeDefined();
  });

  it("POST /api/v1/agents/:id/test-call runs A2A and returns output", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "testcall@example.com", password: "password123", role: "provider" }),
    });
    expect(reg.status).toBe(201);
    const { access_token } = (await reg.json()).data;
    const createRes = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({
        name: "Test Call Agent",
        description: "Mock",
        agent_type: "logical",
        source_url: "mock://testcall",
        capabilities: [{ name: "t", risk_level: "low" }],
      }),
    });
    const agentId = (await createRes.json()).data.id;
    const testRes = await app.request(`/api/v1/agents/${agentId}/test-call`, {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({ message: "Hello" }),
    });
    expect(testRes.status).toBe(200);
    const testBody = await testRes.json();
    expect(testBody.data.output_text).toBeDefined();
    expect(testBody.data.output_text).toContain("mocked A2A response");
  });

  it("POST /api/v1/agents/:id/submit-review sets status to active", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "review@example.com", password: "password123", role: "provider" }),
    });
    expect(reg.status).toBe(201);
    const { access_token } = (await reg.json()).data;
    const createRes = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(access_token) },
      body: JSON.stringify({
        name: "Review Agent",
        description: "For review",
        agent_type: "logical",
        source_url: "mock://review",
        capabilities: [{ name: "r", risk_level: "low" }],
      }),
    });
    const agentId = (await createRes.json()).data.id;
    const submitRes = await app.request(`/api/v1/agents/${agentId}/submit-review`, {
      method: "POST",
      headers: bearer(access_token),
    });
    expect(submitRes.status).toBe(200);
    const submitBody = await submitRes.json();
    expect(submitBody.data.status).toBe("active");
    const listRes = await app.request("/api/v1/agents");
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    const found = listBody.data.find((a: { id: string }) => a.id === agentId);
    expect(found).toBeDefined();
    expect(found?.status).toBe("active");
  });

  it("health-check and test-call forbid non-owner", async () => {
    const app = createApp();
    const reg1 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com", password: "password123", role: "provider" }),
    });
    const { access_token: ownerToken } = (await reg1.json()).data;
    const createRes = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(ownerToken) },
      body: JSON.stringify({
        name: "Owned Agent",
        description: "x",
        agent_type: "logical",
        source_url: "mock://owned",
        capabilities: [{ name: "o", risk_level: "low" }],
      }),
    });
    const agentId = (await createRes.json()).data.id;
    const reg2 = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "other@example.com", password: "password123", role: "provider" }),
    });
    const { access_token: otherToken } = (await reg2.json()).data;
    const checkRes = await app.request(`/api/v1/agents/${agentId}/health-check`, {
      method: "POST",
      headers: bearer(otherToken),
    });
    expect(checkRes.status).toBe(403);
    const callRes = await app.request(`/api/v1/agents/${agentId}/test-call`, {
      method: "POST",
      headers: { "content-type": "application/json", ...bearer(otherToken) },
      body: JSON.stringify({}),
    });
    expect(callRes.status).toBe(403);
  });
});
