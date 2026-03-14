import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

async function bootstrap(app: ReturnType<typeof createApp>) {
  const createConversationResponse = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Phase0 Conversation" }),
  });
  const conversationBody = await createConversationResponse.json();
  const conversationId = conversationBody.data.id as string;

  const registerAgentResponse = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Phase0 Agent",
      description: "Agent for phase0",
      agent_type: "logical",
      source_url: "https://example.com/phase0-agent",
      capabilities: [{ name: "summarize", risk_level: "low" }],
    }),
  });
  const agentBody = await registerAgentResponse.json();
  const agentId = agentBody.data.id as string;

  await app.request(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });

  return { conversationId, agentId };
}

describe("Phase0 API completeness", () => {
  it("supports conversation/agent list and detail endpoints", async () => {
    const app = createApp();
    const { conversationId, agentId } = await bootstrap(app);

    const conversationsResponse = await app.request("/api/v1/conversations");
    expect(conversationsResponse.status).toBe(200);
    const conversationsBody = await conversationsResponse.json();
    expect(conversationsBody.data.length).toBeGreaterThanOrEqual(1);

    const agentsResponse = await app.request("/api/v1/agents");
    expect(agentsResponse.status).toBe(200);
    const agentsBody = await agentsResponse.json();
    expect(agentsBody.data.length).toBeGreaterThanOrEqual(1);

    const agentDetailResponse = await app.request(`/api/v1/agents/${agentId}`);
    expect(agentDetailResponse.status).toBe(200);
    const agentDetailBody = await agentDetailResponse.json();
    expect(agentDetailBody.data.id).toBe(agentId);

    const conversationDetailResponse = await app.request(`/api/v1/conversations/${conversationId}`);
    expect(conversationDetailResponse.status).toBe(200);
  });

  it("denies critical risk invocation and records audit denial", async () => {
    const app = createApp();

    const createConversationResponse = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Critical Conversation" }),
    });
    const conversationBody = await createConversationResponse.json();
    const conversationId = conversationBody.data.id as string;

    const registerAgentResponse = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Critical Agent",
        description: "Dangerous agent",
        agent_type: "execution",
        source_url: "https://example.com/critical-agent",
        capabilities: [{ name: "danger", risk_level: "critical" }],
      }),
    });
    const agentBody = await registerAgentResponse.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    const invokeResponse = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "u-critical", text: "run critical action" }),
    });

    expect(invokeResponse.status).toBe(403);

    const detailResponse = await app.request(`/api/v1/conversations/${conversationId}`);
    const detailBody = await detailResponse.json();
    expect(detailBody.data.messages).toHaveLength(1);

    const auditResponse = await app.request("/api/v1/audit-events");
    const auditBody = await auditResponse.json();
    const eventTypes = auditBody.data.map((event: { event_type: string }) => event.event_type);
    expect(eventTypes).toContain("invocation.denied");
  });

  it("tracks invocation status from pending_confirmation to completed", async () => {
    const app = createApp();

    const createConversationResponse = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "High Risk Conversation" }),
    });
    const conversationBody = await createConversationResponse.json();
    const conversationId = conversationBody.data.id as string;

    const registerAgentResponse = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "High Agent",
        description: "High risk agent",
        agent_type: "execution",
        source_url: "https://example.com/high-agent",
        capabilities: [{ name: "high-op", risk_level: "high" }],
      }),
    });
    const agentBody = await registerAgentResponse.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    const messageResponse = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "user-h", text: "do high operation" }),
    });
    expect(messageResponse.status).toBe(202);
    const messageBody = await messageResponse.json();
    const invocationId = messageBody.meta.invocation_id as string;

    const pendingStatusResponse = await app.request(`/api/v1/invocations/${invocationId}`);
    expect(pendingStatusResponse.status).toBe(200);
    const pendingStatusBody = await pendingStatusResponse.json();
    expect(pendingStatusBody.data.status).toBe("pending_confirmation");

    await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-h" }),
    });

    const completedStatusResponse = await app.request(`/api/v1/invocations/${invocationId}`);
    expect(completedStatusResponse.status).toBe(200);
    const completedStatusBody = await completedStatusResponse.json();
    expect(completedStatusBody.data.status).toBe("completed");
  });

  it("supports node register/heartbeat and exposes basic metrics", async () => {
    const app = createApp();

    const registerNodeResponse = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Node A", endpoint: "https://node-a.example.com" }),
    });

    expect(registerNodeResponse.status).toBe(201);
    const registerNodeBody = await registerNodeResponse.json();
    const nodeId = registerNodeBody.data.node_id as string;

    const heartbeatResponse = await app.request("/api/v1/nodes/heartbeat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ node_id: nodeId }),
    });

    expect(heartbeatResponse.status).toBe(200);

    const nodesResponse = await app.request("/api/v1/nodes");
    expect(nodesResponse.status).toBe(200);
    const nodesBody = await nodesResponse.json();
    expect(nodesBody.data.length).toBeGreaterThanOrEqual(1);
    expect(nodesBody.data[0].node_id).toBe(nodeId);

    const metricsResponse = await app.request("/api/v1/metrics");
    expect(metricsResponse.status).toBe(200);
    const metricsBody = await metricsResponse.json();

    expect(metricsBody.data).toHaveProperty("invocation_total");
    expect(metricsBody.data).toHaveProperty("audit_events_total");
  });
});
