import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

async function seedLowAndHigh(app: ReturnType<typeof createApp>) {
  const conv = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Audit Query Conversation" }),
  });
  const convBody = await conv.json();
  const conversationId = convBody.data.id as string;

  const lowAgent = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Low Agent",
      description: "low",
      agent_type: "execution",
      source_url: "mock://low-agent",
      capabilities: [{ name: "low", risk_level: "low" }],
    }),
  });
  const lowBody = await lowAgent.json();
  await app.request(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: lowBody.data.id }),
  });

  await app.request(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender_id: "u1", text: "low flow" }),
  });

  const highConv = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "High Conversation" }),
  });
  const highConvBody = await highConv.json();
  const highConversationId = highConvBody.data.id as string;

  const highAgent = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "High Agent",
      description: "high",
      agent_type: "execution",
      source_url: "mock://high-agent",
      capabilities: [{ name: "high", risk_level: "high" }],
    }),
  });
  const highBody = await highAgent.json();

  await app.request(`/api/v1/conversations/${highConversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: highBody.data.id }),
  });

  await app.request(`/api/v1/conversations/${highConversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender_id: "u2", text: "high flow" }),
  });

  return { lowConversationId: conversationId, highConversationId };
}

describe("audit-events query", () => {
  it("filters by event_type and conversation_id", async () => {
    const app = createApp();
    const { highConversationId } = await seedLowAndHigh(app);

    const response = await app.request(
      `/api/v1/audit-events?event_type=invocation.need_confirmation&conversation_id=${highConversationId}`,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);

    for (const event of body.data as Array<{ event_type: string; conversation_id?: string }>) {
      expect(event.event_type).toBe("invocation.need_confirmation");
      expect(event.conversation_id).toBe(highConversationId);
    }
  });

  it("supports cursor pagination with meta.next_cursor", async () => {
    const app = createApp();
    await seedLowAndHigh(app);

    const firstPage = await app.request("/api/v1/audit-events?limit=2");
    expect(firstPage.status).toBe(200);
    const firstBody = await firstPage.json();
    expect(firstBody.data).toHaveLength(2);
    expect(firstBody.meta.next_cursor).toBeTypeOf("string");

    const secondPage = await app.request(`/api/v1/audit-events?limit=2&cursor=${firstBody.meta.next_cursor}`);
    expect(secondPage.status).toBe(200);
    const secondBody = await secondPage.json();
    expect(secondBody.data.length).toBeGreaterThanOrEqual(1);
  });

  it("filters by actor_type and agent_id", async () => {
    const app = createApp();
    const { lowConversationId } = await seedLowAndHigh(app);

    const detailRes = await app.request(`/api/v1/conversations/${lowConversationId}`);
    const detailBody = await detailRes.json();
    const firstParticipant = (detailBody.data.participants as Array<{ participant_id: string }>)[0];
    if (!firstParticipant) {
      throw new Error("expected at least one participant");
    }
    const lowAgentId = firstParticipant.participant_id;

    const response = await app.request(`/api/v1/audit-events?actor_type=agent&agent_id=${lowAgentId}`);
    expect(response.status).toBe(200);
    const body = await response.json();

    for (const event of body.data as Array<{ actor_type: string; agent_id?: string }>) {
      expect(event.actor_type).toBe("agent");
      expect(event.agent_id).toBe(lowAgentId);
    }
  });

  it("returns 400 for invalid query parameters", async () => {
    const app = createApp();

    const invalidActorTypeRes = await app.request("/api/v1/audit-events?actor_type=invalid");
    expect(invalidActorTypeRes.status).toBe(400);
    const invalidActorTypeBody = await invalidActorTypeRes.json();
    expect(invalidActorTypeBody.error.code).toBe("invalid_audit_events_query");

    const invalidLimitRes = await app.request("/api/v1/audit-events?limit=0");
    expect(invalidLimitRes.status).toBe(400);
  });
});
