/**
 * T-5.2 Agent 目录 API 验收测试
 * CTO-Execution-Directive-v1 §5 主线团队 API 交付
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("T-5.2 Agent Directory API", () => {
  it("GET /api/v1/agents returns list and supports search (keyword fuzzy)", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Fuzzy Search Agent",
        description: "An agent for testing search by keyword",
        agent_type: "logical",
        source_url: "mock://fuzzy",
        capabilities: [{ name: "search", risk_level: "low" }],
      }),
    });

    const listRes = await app.request("/api/v1/agents");
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.data)).toBe(true);

    const searchRes = await app.request("/api/v1/agents?search=Fuzzy");
    expect(searchRes.status).toBe(200);
    const searchBody = await searchRes.json();
    expect(searchBody.data.length).toBeGreaterThanOrEqual(1);
    expect(searchBody.data.some((a: { name: string }) => a.name.includes("Fuzzy"))).toBe(true);

    const searchDesc = await app.request("/api/v1/agents?search=keyword");
    expect(searchDesc.status).toBe(200);
    const descBody = await searchDesc.json();
    expect(descBody.data.some((a: { description: string }) => a.description.includes("keyword"))).toBe(
      true,
    );
  });

  it("GET /api/v1/agents supports cursor, limit, sort and filters", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Page A",
        description: "First",
        agent_type: "logical",
        source_url: "mock://page-a",
        capabilities: [{ name: "a", risk_level: "low" }],
      }),
    });
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Page B",
        description: "Second",
        agent_type: "execution",
        source_url: "mock://page-b",
        capabilities: [{ name: "b", risk_level: "low" }],
      }),
    });
    const page1 = await app.request("/api/v1/agents?limit=1&sort=created_at:desc");
    expect(page1.status).toBe(200);
    const page1Body = await page1.json();
    expect(page1Body.data).toHaveLength(1);
    expect(page1Body.meta?.next_cursor).toBeDefined();
    const page2 = await app.request(
      `/api/v1/agents?limit=1&sort=created_at:desc&cursor=${page1Body.meta.next_cursor}`,
    );
    expect(page2.status).toBe(200);
    const page2Body = await page2.json();
    expect(page2Body.data).toHaveLength(1);
    expect(page2Body.data[0].id).not.toBe(page1Body.data[0].id);
  });

  it("GET /api/v1/agents/:id returns enriched detail with identity_verified and reputation", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Detail Agent",
        description: "For detail test",
        agent_type: "execution",
        source_url: "mock://detail",
        capabilities: [{ name: "run", risk_level: "low" }],
      }),
    });
    const agentId = (await reg.json()).data.id as string;

    const detailRes = await app.request(`/api/v1/agents/${agentId}`);
    expect(detailRes.status).toBe(200);
    const detail = await detailRes.json();
    expect(detail.data.id).toBe(agentId);
    expect(detail.data).toHaveProperty("identity_verified");
    expect(typeof detail.data.identity_verified).toBe("boolean");
    expect(detail.data).toHaveProperty("reputation_score");
    expect(detail.data).toHaveProperty("reputation_grade");
    expect(detail.data).toHaveProperty("success_rate");
    expect(detail.data).toHaveProperty("risk_level");
    expect(detail.data).toHaveProperty("feedback_summary");
    expect(detail.data).toHaveProperty("capabilities");
  });

  it("GET /api/v1/agents/:id returns 404 for unknown id", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/agents/00000000-0000-4000-8000-000000000000");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error?.code).toBe("agent_not_found");
  });

  it("GET /api/v1/agents/:id/stats returns stats for existing agent", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Stats Agent",
        description: "For stats test",
        agent_type: "logical",
        source_url: "mock://stats",
        capabilities: [{ name: "stats", risk_level: "low" }],
      }),
    });
    const agentId = (await reg.json()).data.id as string;

    const statsRes = await app.request(`/api/v1/agents/${agentId}/stats`);
    expect(statsRes.status).toBe(200);
    const stats = await statsRes.json();
    expect(stats.data).toHaveProperty("event_counts");
    expect(stats.data.event_counts).toHaveProperty("completed");
    expect(stats.data.event_counts).toHaveProperty("failed");
    expect(stats.data).toHaveProperty("success_rate");
    expect(stats.data).toHaveProperty("reputation_score");
    expect(stats.data).toHaveProperty("reputation_grade");
    expect(stats.data).toHaveProperty("feedback_summary");
  });

  it("GET /api/v1/agents/:id/stats returns 404 for unknown id", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/agents/00000000-0000-4000-8000-000000000000/stats");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error?.code).toBe("agent_not_found");
  });

  it("directory APIs are callable without auth (no X-Actor-Id)", async () => {
    const app = createApp();
    const listRes = await app.request("/api/v1/agents", { headers: {} });
    expect(listRes.status).toBe(200);
    const reg = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "NoAuth Agent",
        description: "No auth",
        agent_type: "logical",
        source_url: "mock://noauth",
        capabilities: [{ name: "x", risk_level: "low" }],
      }),
    });
    const agentId = (await reg.json()).data.id as string;
    const detailRes = await app.request(`/api/v1/agents/${agentId}`, { headers: {} });
    expect(detailRes.status).toBe(200);
    const statsRes = await app.request(`/api/v1/agents/${agentId}/stats`, { headers: {} });
    expect(statsRes.status).toBe(200);
  });
});
