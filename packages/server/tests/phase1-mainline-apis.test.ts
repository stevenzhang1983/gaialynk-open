import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("phase1 mainline APIs", () => {
  it("supports thread/mentions payload and presence endpoint", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Presence Conversation" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Presence Agent",
        description: "presence",
        agent_type: "execution",
        source_url: "mock://presence-agent",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const agentBody = await agentRes.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "user-presence",
        text: "threaded message",
        thread_id: "thread-1",
        mentions: ["agent-1", "user-2"],
      }),
    });

    const detailRes = await app.request(`/api/v1/conversations/${conversationId}`);
    const detailBody = await detailRes.json();
    expect(detailBody.data.messages[0].content.thread_id).toBe("thread-1");
    expect(detailBody.data.messages[0].content.mentions).toEqual(["agent-1", "user-2"]);

    const presenceRes = await app.request(`/api/v1/conversations/${conversationId}/presence`);
    expect(presenceRes.status).toBe(200);
    const presenceBody = await presenceRes.json();
    expect(presenceBody.data.participants.length).toBeGreaterThanOrEqual(1);
  });

  it("supports recommendations and public readonly/meta endpoints", async () => {
    const app = createApp();

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Summarizer Agent",
        description: "summary and report writer",
        agent_type: "execution",
        source_url: "mock://summarizer",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Delete Agent",
        description: "dangerous operation",
        agent_type: "execution",
        source_url: "mock://delete",
        capabilities: [{ name: "delete", risk_level: "critical" }],
      }),
    });

    const recommendRes = await app.request("/api/v1/agents/recommendations?intent=summary&risk_max=low&limit=3");
    expect(recommendRes.status).toBe(200);
    const recommendBody = await recommendRes.json();
    expect(recommendBody.data.length).toBeGreaterThanOrEqual(1);
    expect(recommendBody.data[0].agent.name).toContain("Summarizer");

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Mixed Risk Agent",
        description: "has low and critical capabilities",
        agent_type: "execution",
        source_url: "mock://mixed-risk",
        capabilities: [
          { name: "summarize", risk_level: "low" },
          { name: "delete", risk_level: "critical" },
        ],
      }),
    });

    const safeDeleteRecommendRes = await app.request(
      "/api/v1/agents/recommendations?intent=delete&risk_max=low&limit=10",
    );
    expect(safeDeleteRecommendRes.status).toBe(200);
    const safeDeleteRecommendBody = await safeDeleteRecommendRes.json();
    expect(
      safeDeleteRecommendBody.data.some((item: { agent: { name: string } }) => item.agent.name === "Mixed Risk Agent"),
    ).toBe(false);

    const metaRes = await app.request("/api/v1/meta");
    expect(metaRes.status).toBe(200);
    const metaBody = await metaRes.json();
    expect(metaBody.data.api_version).toBe("v1");
    expect(Array.isArray(metaBody.data.features)).toBe(true);
    expect(metaBody.data.node_protocol.min).toBe("1.0.0");
    expect(Array.isArray(metaBody.data.quickstart_endpoints)).toBe(true);

    const overviewRes = await app.request("/api/v1/public/overview");
    expect(overviewRes.status).toBe(200);
    const overviewBody = await overviewRes.json();
    expect(overviewBody.data).toHaveProperty("weekly_trusted_invocations");
    expect(overviewBody.data).toHaveProperty("go_no_go");

    const compatibilityRes = await app.request("/api/v1/nodes/compatibility");
    expect(compatibilityRes.status).toBe(200);
    const compatibilityBody = await compatibilityRes.json();
    expect(compatibilityBody.data.node_protocol_min).toBeTypeOf("string");

    await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "page_view",
        locale: "en",
        page: "docs",
        referrer: "direct",
        source: "test",
        device_type: "desktop",
      }),
    });
    await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "page_view",
        locale: "en",
        page: "home",
        referrer: "direct",
        source: "test",
        device_type: "desktop",
      }),
    });
    await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "cta_click",
        locale: "en",
        page: "home",
        referrer: "direct",
        cta_id: "start_building",
        source: "test",
        device_type: "desktop",
      }),
    });
    await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "cta_click",
        locale: "en",
        page: "home",
        referrer: "direct",
        cta_id: "book_demo",
        source: "test",
        device_type: "desktop",
      }),
    });
    await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "docs_click",
        locale: "zh-Hans",
        page: "home",
        referrer: "direct",
        source: "test",
        device_type: "mobile",
      }),
    });

    const entryMetricsRes = await app.request("/api/v1/public/entry-metrics");
    expect(entryMetricsRes.status).toBe(200);
    const entryMetricsBody = await entryMetricsRes.json();
    expect(entryMetricsBody.data.locales_supported).toContain("en");
    expect(entryMetricsBody.data.conversion_baseline.page_view_home).toBe(1);
    expect(entryMetricsBody.data.conversion_baseline.cta_click_start_building).toBe(1);
    expect(entryMetricsBody.data.locale_breakdown["zh-Hans"].docs_click).toBeGreaterThanOrEqual(1);

    const legacyEventRes = await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "waitlist_submit",
        locale: "en",
        page: "waitlist",
      }),
    });
    expect(legacyEventRes.status).toBe(202);

    const invalidEntryEventRes = await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event_name: "unknown_event",
        locale: "en",
        page: "home",
      }),
    });
    expect(invalidEntryEventRes.status).toBe(400);
    const invalidEntryEventBody = await invalidEntryEventRes.json();
    expect(invalidEntryEventBody.error.code).toBe("invalid_public_entry_event");

    const invalidJsonEntryEventRes = await app.request("/api/v1/public/entry-events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{bad-json",
    });
    expect(invalidJsonEntryEventRes.status).toBe(400);
  });

  it("supports usage counters endpoint", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Usage Counter Conversation" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Usage Agent",
        description: "usage test",
        agent_type: "execution",
        source_url: "mock://usage-agent",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const agentBody = await agentRes.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentBody.data.id }),
    });

    await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "usage-user", text: "count me" }),
    });

    const usageRes = await app.request("/api/v1/usage/counters?actor_id=usage-user&window_days=7");
    expect(usageRes.status).toBe(200);
    const usageBody = await usageRes.json();
    expect(usageBody.data.actor_id).toBe("usage-user");
    expect(usageBody.data.audit_events_total).toBeGreaterThanOrEqual(1);
    expect(typeof usageBody.data.window_from).toBe("string");
    expect(usageBody.data.event_type_counts).toBeTypeOf("object");

    const invalidUsageQueryRes = await app.request("/api/v1/usage/counters?window_days=-1");
    expect(invalidUsageQueryRes.status).toBe(400);
  });

  it("supports minimal cross-node relay invoke loop", async () => {
    const app = createApp();

    const nodeRes = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Relay Node",
        endpoint: "https://relay-node.example.com",
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
            name: "Relay Agent",
            description: "relay capable agent",
            agent_type: "execution",
            source_url: "mock://relay-agent",
            capabilities: [{ name: "relay", risk_level: "low" }],
          },
        ],
      }),
    });
    const syncBody = await syncRes.json();
    const relayAgentId = syncBody.data.agents[0].id as string;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Relay Conversation" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: relayAgentId }),
    });

    const relayInvokeRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: relayAgentId,
        sender_id: "relay-user",
        text: "relay this task",
      }),
    });
    expect(relayInvokeRes.status).toBe(201);
    const relayBody = await relayInvokeRes.json();
    expect(relayBody.meta.completed_receipts).toHaveLength(1);

    const healthRes = await app.request("/api/v1/nodes/health?stale_after_sec=9999");
    expect(healthRes.status).toBe(200);
    const healthBody = await healthRes.json();
    expect(healthBody.data.summary.total).toBeGreaterThanOrEqual(1);

    const offlineRelayRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: relayAgentId,
        sender_id: "relay-user",
        text: "relay while stale",
        stale_after_sec: 1,
      }),
    });
    expect([201, 503]).toContain(offlineRelayRes.status);

    const invalidHealthRes = await app.request("/api/v1/nodes/health?stale_after_sec=0");
    expect(invalidHealthRes.status).toBe(400);

    const nodeNotFoundRelayRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: "11111111-1111-4111-8111-111111111111",
        conversation_id: conversationId,
        agent_id: relayAgentId,
        sender_id: "relay-user",
        text: "relay to unknown node",
      }),
    });
    expect(nodeNotFoundRelayRes.status).toBe(404);
    const nodeNotFoundRelayBody = await nodeNotFoundRelayRes.json();
    expect(nodeNotFoundRelayBody.error.code).toBe("node_not_found");
  });

  it("keeps boundary error codes consistent for mainline endpoints", async () => {
    const app = createApp();

    const notFoundPresenceRes = await app.request(
      "/api/v1/conversations/11111111-1111-4111-8111-111111111111/presence",
    );
    expect(notFoundPresenceRes.status).toBe(404);
    const notFoundPresenceBody = await notFoundPresenceRes.json();
    expect(notFoundPresenceBody.error.code).toBe("conversation_not_found");

    const badRecommendationRes = await app.request("/api/v1/agents/recommendations?intent=ops&risk_max=invalid");
    expect(badRecommendationRes.status).toBe(400);
    const badRecommendationBody = await badRecommendationRes.json();
    expect(badRecommendationBody.error.code).toBe("invalid_recommendation_query");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Relay Error Cases" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const nodeRes = await app.request("/api/v1/nodes/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Mismatch Node",
        endpoint: "https://mismatch.example.com",
      }),
    });
    const nodeBody = await nodeRes.json();
    const nodeId = nodeBody.data.node_id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Local Agent",
        description: "local only",
        agent_type: "execution",
        source_url: "mock://local-agent",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const agentBody = await agentRes.json();

    const mismatchRelayRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: agentBody.data.id,
        sender_id: "relay-user",
        text: "should fail with mismatch",
      }),
    });
    expect(mismatchRelayRes.status).toBe(400);
    const mismatchRelayBody = await mismatchRelayRes.json();
    expect(mismatchRelayBody.error.code).toBe("agent_node_mismatch");

    const agentNotFoundRelayRes = await app.request("/api/v1/nodes/relay/invoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        conversation_id: conversationId,
        agent_id: "22222222-2222-4222-8222-222222222222",
        sender_id: "relay-user",
        text: "missing agent",
      }),
    });
    expect(agentNotFoundRelayRes.status).toBe(404);
    const agentNotFoundRelayBody = await agentNotFoundRelayRes.json();
    expect(agentNotFoundRelayBody.error.code).toBe("agent_not_found");

    const syncMissingNodeRes = await app.request("/api/v1/nodes/sync-directory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        node_id: "33333333-3333-4333-8333-333333333333",
        agents: [
          {
            name: "Remote Agent",
            description: "remote",
            agent_type: "execution",
            source_url: "https://example.com/agent",
            capabilities: [{ name: "task", risk_level: "low" }],
          },
        ],
      }),
    });
    expect(syncMissingNodeRes.status).toBe(404);
    const syncMissingNodeBody = await syncMissingNodeRes.json();
    expect(syncMissingNodeBody.error.code).toBe("node_not_found");

    const highAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "High Risk Agent",
        description: "needs confirm",
        agent_type: "execution",
        source_url: "mock://high-risk-agent",
        capabilities: [{ name: "dangerous", risk_level: "high" }],
      }),
    });
    const highAgentBody = await highAgentRes.json();
    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: highAgentBody.data.id }),
    });

    const pendingMessageRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "u-confirm",
        text: "high risk action",
        target_agent_ids: [highAgentBody.data.id],
      }),
    });
    expect(pendingMessageRes.status).toBe(202);
    const pendingMessageBody = await pendingMessageRes.json();
    const invocationId = pendingMessageBody.meta.pending_invocations[0].invocation_id as string;

    const invalidConfirmPayloadRes = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "" }),
    });
    expect(invalidConfirmPayloadRes.status).toBe(400);
    const invalidConfirmPayloadBody = await invalidConfirmPayloadRes.json();
    expect(invalidConfirmPayloadBody.error.code).toBe("validation_error");
  });
});
