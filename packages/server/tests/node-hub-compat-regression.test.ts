import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("node-hub compatibility and failure regressions", () => {
  it("covers version window boundaries for connection wizard", async () => {
    const app = createApp();

    const minBoundary = await app.request("/api/v1/nodes/connection-wizard/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://boundary.example.com",
        node_protocol_version: "1.0.0",
      }),
    });
    expect(minBoundary.status).toBe(200);
    const minBoundaryBody = await minBoundary.json();
    expect(minBoundaryBody.data.compatibility).toBe("compatible_with_warning");

    const recommendedBoundary = await app.request("/api/v1/nodes/connection-wizard/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://boundary.example.com",
        node_protocol_version: "1.1.0",
      }),
    });
    expect(recommendedBoundary.status).toBe(200);
    const recommendedBoundaryBody = await recommendedBoundary.json();
    expect(recommendedBoundaryBody.data.compatibility).toBe("compatible");

    const belowMin = await app.request("/api/v1/nodes/connection-wizard/validate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpoint: "https://boundary.example.com",
        node_protocol_version: "0.9.9",
      }),
    });
    expect(belowMin.status).toBe(400);
    const belowMinBody = await belowMin.json();
    expect(belowMinBody.error.code).toBe("node_connection_invalid");
  });

  it("covers offline, mismatch and retry-failed relay paths", async () => {
    const app = createApp();

    const nodeRes = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Regression Node",
        endpoint: "https://regression-node.example.com",
      }),
    });
    expect(nodeRes.status).toBe(201);
    const nodeBody = await nodeRes.json();
    const nodeId = nodeBody.data.node_id as string;

    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Node Regression Conversation" }),
    });
    const conversationBody = await conversationRes.json();
    const conversationId = conversationBody.data.id as string;

    const localAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Local Mismatch Agent",
        description: "not from node",
        agent_type: "execution",
        source_url: "mock://local-mismatch",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const localAgentBody = await localAgentRes.json();
    const localAgentId = localAgentBody.data.id as string;

    const mismatchRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: localAgentId,
        sender_id: "reg-user",
        text: "mismatch check",
      }),
    });
    expect(mismatchRes.status).toBe(400);
    const mismatchBody = await mismatchRes.json();
    expect(mismatchBody.error.code).toBe("agent_node_mismatch");

    const syncBadAgentRes = await app.request("/api/v1/nodes/sync-directory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        agents: [
          {
            name: "Retry Failure Agent",
            description: "always fails on outbound a2a",
            agent_type: "execution",
            source_url: "http://127.0.0.1:9",
            capabilities: [{ name: "task", risk_level: "low" }],
          },
        ],
      }),
    });
    const syncBadAgentBody = await syncBadAgentRes.json();
    const badAgentId = syncBadAgentBody.data.agents[0].id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: badAgentId }),
    });

    const retryFailed = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: badAgentId,
        sender_id: "reg-user",
        text: "retry failure check",
        retry_max: 2,
      }),
    });
    expect(retryFailed.status).toBe(502);
    const retryFailedBody = await retryFailed.json();
    expect(retryFailedBody.error.code).toBe("a2a_invocation_failed");

    await new Promise((resolve) => setTimeout(resolve, 1100));
    const offlineRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: badAgentId,
        sender_id: "reg-user",
        text: "offline check",
        stale_after_sec: 1,
      }),
    });
    expect(offlineRes.status).toBe(503);
    const offlineBody = await offlineRes.json();
    expect(offlineBody.error.code).toBe("node_unavailable");
  });
});
