import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline ask routing control (P0-1 A)", () => {
  it("POST /ask accepts routing_mode auto (default) and returns route_reason_codes and route_candidates", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Auto Agent",
        description: "for auto routing",
        agent_type: "execution",
        source_url: "mock://auto",
        capabilities: [{ name: "auto", risk_level: "low" }],
      }),
    });
    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "auto query", routing_mode: "auto" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.route).toBeDefined();
    expect(Array.isArray(body.data.route.route_reason_codes)).toBe(true);
    expect(Array.isArray(body.data.route.route_candidates)).toBe(true);
    expect(body.data.route.selected_agent_ids.length).toBeGreaterThanOrEqual(1);
  });

  it("manual routing_mode: only selects from manual_agent_ids", async () => {
    const app = createApp();
    const a1 = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Manual One",
        description: "first",
        agent_type: "execution",
        source_url: "mock://m1",
        capabilities: [{ name: "m1", risk_level: "low" }],
      }),
    });
    const a2 = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Manual Two",
        description: "second",
        agent_type: "execution",
        source_url: "mock://m2",
        capabilities: [{ name: "m2", risk_level: "low" }],
      }),
    });
    const id1 = (await a1.json()).data.id as string;
    const id2 = (await a2.json()).data.id as string;

    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "only use second agent",
        routing_mode: "manual",
        manual_agent_ids: [id2],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.route.selected_agent_ids).toEqual([id2]);
    expect(body.data.route.route_reason_codes).toContain("manual");
  });

  it("manual routing_mode with empty manual_agent_ids returns 400 with explainable error", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Any",
        description: "any",
        agent_type: "execution",
        source_url: "mock://any",
        capabilities: [{ name: "any", risk_level: "low" }],
      }),
    });
    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "query",
        routing_mode: "manual",
        manual_agent_ids: [],
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error?.code).toBeDefined();
    expect(body.error?.message).toBeDefined();
  });

  it("manual routing_mode with non-existent manual_agent_ids returns 400", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Any",
        description: "any",
        agent_type: "execution",
        source_url: "mock://any",
        capabilities: [{ name: "any", risk_level: "low" }],
      }),
    });
    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "query",
        routing_mode: "manual",
        manual_agent_ids: ["non-existent-agent-id"],
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error?.code).toBeDefined();
  });

  it("constrained_auto respects blocked_agent_ids", async () => {
    const app = createApp();
    const r1 = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Blocked Agent",
        description: "blocked",
        agent_type: "execution",
        source_url: "mock://blocked",
        capabilities: [{ name: "blocked", risk_level: "low" }],
      }),
    });
    const r2 = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Allowed Agent",
        description: "allowed",
        agent_type: "execution",
        source_url: "mock://allowed",
        capabilities: [{ name: "allowed", risk_level: "low" }],
      }),
    });
    const blockedId = (await r1.json()).data.id as string;
    const allowedId = (await r2.json()).data.id as string;

    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "blocked allowed",
        routing_mode: "constrained_auto",
        blocked_agent_ids: [blockedId],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.route.selected_agent_ids).not.toContain(blockedId);
    expect(body.data.route.route_reason_codes).toBeDefined();
  });

  it("constrained_auto respects blocked_agent_categories (agent_type)", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Logical Agent",
        description: "logical",
        agent_type: "logical",
        source_url: "mock://logical",
        capabilities: [{ name: "logical", risk_level: "low" }],
      }),
    });
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Execution Agent",
        description: "execution",
        agent_type: "execution",
        source_url: "mock://exec",
        capabilities: [{ name: "exec", risk_level: "low" }],
      }),
    });

    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "execution logical",
        routing_mode: "constrained_auto",
        blocked_agent_categories: ["logical"],
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    const selected = body.data.route.selected_agent_ids as string[];
    expect(selected.length).toBeGreaterThanOrEqual(1);
    const agentsRes = await app.request("/api/v1/agents");
    const agentsBody = await agentsRes.json();
    const agents = agentsBody.data as Array<{ id: string; agent_type: string }>;
    for (const id of selected) {
      const agent = agents.find((a: { id: string }) => a.id === id);
      if (agent) expect(agent.agent_type).not.toBe("logical");
    }
  });
});
