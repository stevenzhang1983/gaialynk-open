import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("node directory sync", () => {
  it("syncs node agent directory into main directory", async () => {
    const app = createApp();

    const registerNodeRes = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Partner Node",
        endpoint: "https://partner-node.example.com",
      }),
    });
    expect(registerNodeRes.status).toBe(201);
    const registerNodeBody = await registerNodeRes.json();
    const nodeId = registerNodeBody.data.node_id as string;

    const syncRes = await app.request("/api/v1/nodes/sync-directory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        agents: [
          {
            name: "Partner Summarizer",
            description: "Remote summarize agent",
            agent_type: "logical",
            source_url: "mock://partner-summarizer",
            capabilities: [{ name: "summarize", risk_level: "low" }],
          },
        ],
      }),
    });
    expect(syncRes.status).toBe(200);
    const syncBody = await syncRes.json();
    expect(syncBody.data.synced_count).toBe(1);
    expect(syncBody.data.agents[0].source_origin).toBe("connected_node");
    expect(syncBody.data.agents[0].node_id).toBe(nodeId);

    const listAgentsRes = await app.request("/api/v1/agents");
    expect(listAgentsRes.status).toBe(200);
    const listAgentsBody = await listAgentsRes.json();
    const synced = (listAgentsBody.data as Array<{ source_url: string; node_id?: string }>).find(
      (agent) => agent.source_url === "mock://partner-summarizer",
    );
    expect(synced?.node_id).toBe(nodeId);
  });

  it("allows synced node agent to collaborate with local agent in one conversation", async () => {
    const app = createApp();

    const registerNodeRes = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Partner Node B",
        endpoint: "https://partner-node-b.example.com",
      }),
    });
    expect(registerNodeRes.status).toBe(201);
    const registerNodeBody = await registerNodeRes.json();
    const nodeId = registerNodeBody.data.node_id as string;

    const syncRes = await app.request("/api/v1/nodes/sync-directory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        agents: [
          {
            name: "Partner Executor",
            description: "Remote execution agent",
            agent_type: "execution",
            source_url: "mock://partner-executor",
            capabilities: [{ name: "remote_task", risk_level: "low" }],
          },
        ],
      }),
    });
    expect(syncRes.status).toBe(200);
    const syncBody = await syncRes.json();
    const partnerAgentId = syncBody.data.agents[0].id as string;
    expect(syncBody.data.agents[0].source_origin).toBe("connected_node");

    const localAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Local Executor",
        description: "Self hosted local agent",
        agent_type: "execution",
        source_url: "mock://local-executor",
        source_origin: "self_hosted",
        capabilities: [{ name: "local_task", risk_level: "low" }],
      }),
    });
    expect(localAgentRes.status).toBe(201);
    const localAgentBody = await localAgentRes.json();
    const localAgentId = localAgentBody.data.id as string;

    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Node + Local Collaboration" }),
    });
    expect(conversationRes.status).toBe(201);
    const conversationBody = await conversationRes.json();
    const conversationId = conversationBody.data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: partnerAgentId }),
    });
    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: localAgentId }),
    });

    const invokeRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "network-user",
        text: "execute both remote and local tasks",
        target_agent_ids: [partnerAgentId, localAgentId],
      }),
    });
    expect(invokeRes.status).toBe(201);
    const invokeBody = await invokeRes.json();
    expect(invokeBody.meta.completed_receipts).toHaveLength(2);

    const detailRes = await app.request(`/api/v1/conversations/${conversationId}`);
    expect(detailRes.status).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody.data.messages).toHaveLength(3);

    const auditRes = await app.request(`/api/v1/audit-events?conversation_id=${conversationId}`);
    expect(auditRes.status).toBe(200);
    const auditBody = await auditRes.json();
    const completedEvents = (auditBody.data as Array<{ event_type: string }>).filter(
      (event) => event.event_type === "invocation.completed",
    );
    expect(completedEvents).toHaveLength(2);
  });
});
