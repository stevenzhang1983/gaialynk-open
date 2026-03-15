import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline API contract compatibility guards", () => {
  it("guards /api/v1/public/entry-events contract", async () => {
    const app = createApp();

    const accepted = await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "page_view",
        locale: "en",
        page: "home",
      }),
    });
    expect(accepted.status).toBe(202);
    const acceptedBody = await accepted.json();
    expect(acceptedBody.data.accepted).toBe(true);
    expect(acceptedBody.data.event_type).toBe("entry.page_view");

    const rejected = await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "invalid_event",
        locale: "en",
        page: "home",
      }),
    });
    expect(rejected.status).toBe(400);
    const rejectedBody = await rejected.json();
    expect(rejectedBody.error.code).toBe("invalid_public_entry_event");
  });

  it("guards /api/v1/public/entry-metrics read contract keys", async () => {
    const app = createApp();

    const response = await app.request("/api/v1/public/entry-metrics");
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(Array.isArray(body.data.locales_supported)).toBe(true);
    expect(body.data).toHaveProperty("conversion_baseline");
    expect(body.data.conversion_baseline).toHaveProperty("page_view_home");
    expect(body.data.conversion_baseline).toHaveProperty("cta_click_start_building");
    expect(body.data.conversion_baseline).toHaveProperty("docs_click");
    expect(body.data.conversion_baseline).toHaveProperty("waitlist_submit");
    expect(body.data.conversion_baseline).toHaveProperty("demo_submit");
    expect(body.data).toHaveProperty("locale_breakdown");
  });

  it("guards /api/v1/agents/recommendations contract and errors", async () => {
    const app = createApp();

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Contract Summarizer",
        description: "summary helper",
        agent_type: "execution",
        source_url: "mock://contract-summarizer",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });

    const response = await app.request("/api/v1/agents/recommendations?intent=summary&risk_max=low");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty("agent");
      expect(body.data[0]).toHaveProperty("score");
      expect(body.data[0]).toHaveProperty("reason");
    }

    const invalid = await app.request("/api/v1/agents/recommendations?intent=summary&risk_max=bad");
    expect(invalid.status).toBe(400);
    const invalidBody = await invalid.json();
    expect(invalidBody.error.code).toBe("invalid_recommendation_query");
  });

  it("guards /api/v1/nodes/health contract and errors", async () => {
    const app = createApp();

    const register = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Health Contract Node",
        endpoint: "https://health-contract.example.com",
      }),
    });
    expect(register.status).toBe(201);

    const health = await app.request("/api/v1/nodes/health?stale_after_sec=120");
    expect(health.status).toBe(200);
    const healthBody = await health.json();
    expect(healthBody.data).toHaveProperty("stale_after_sec");
    expect(healthBody.data).toHaveProperty("summary");
    expect(healthBody.data).toHaveProperty("nodes");
    expect(Array.isArray(healthBody.data.nodes)).toBe(true);

    const invalid = await app.request("/api/v1/nodes/health?stale_after_sec=0");
    expect(invalid.status).toBe(400);
    const invalidBody = await invalid.json();
    expect(invalidBody.error.code).toBe("invalid_nodes_health_query");
  });

  it("guards /api/v1/nodes/relay/invoke contract and errors", async () => {
    const app = createApp();

    const nodeRes = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Relay Contract Node",
        endpoint: "https://relay-contract.example.com",
      }),
    });
    const nodeBody = await nodeRes.json();
    const nodeId = nodeBody.data.node_id as string;

    const syncRes = await app.request("/api/v1/nodes/sync-directory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        agents: [
          {
            name: "Relay Contract Agent",
            description: "relay",
            agent_type: "execution",
            source_url: "mock://relay-contract-agent",
            capabilities: [{ name: "relay", risk_level: "low" }],
          },
        ],
      }),
    });
    expect(syncRes.status).toBe(200);
    const syncBody = await syncRes.json();
    const relayAgentId = syncBody.data.agents[0].id as string;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Relay Contract Conversation" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: relayAgentId }),
    });

    const relay = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: relayAgentId,
        sender_id: "relay-contract-user",
        text: "relay contract path",
      }),
    });
    expect([201, 202]).toContain(relay.status);
    const relayBody = await relay.json();
    expect(relayBody).toHaveProperty("meta");
    expect(relayBody.meta).toHaveProperty("completed_receipts");

    const missingNodeRelay = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: "44444444-4444-4444-8444-444444444444",
        conversation_id: conversationId,
        agent_id: relayAgentId,
        sender_id: "relay-contract-user",
        text: "missing node",
      }),
    });
    expect(missingNodeRelay.status).toBe(404);
    const missingNodeBody = await missingNodeRelay.json();
    expect(missingNodeBody.error.code).toBe("node_not_found");
  });
});
