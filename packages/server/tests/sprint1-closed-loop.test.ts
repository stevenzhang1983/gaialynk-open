import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("Sprint1 minimal closed loop", () => {
  it("creates conversation, registers agent, joins, and writes A2A response", async () => {
    const app = createApp();

    const createConversationResponse = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Sprint 1 Demo" }),
    });

    expect(createConversationResponse.status).toBe(201);
    const conversationBody = await createConversationResponse.json();
    const conversationId = conversationBody.data.id as string;
    expect(conversationBody.data.title).toBe("Sprint 1 Demo");

    const registerAgentResponse = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Summarizer Agent",
        description: "Summarize user content",
        agent_type: "logical",
        source_url: "mock://sprint1-agent",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });

    expect(registerAgentResponse.status).toBe(201);
    const agentBody = await registerAgentResponse.json();
    const agentId = agentBody.data.id as string;

    const joinResponse = await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    expect(joinResponse.status).toBe(201);

    const sendMessageResponse = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "user-1",
        text: "Please summarize this text",
      }),
    });

    expect(sendMessageResponse.status).toBe(201);

    const detailResponse = await app.request(`/api/v1/conversations/${conversationId}`);
    expect(detailResponse.status).toBe(200);

    const detailBody = await detailResponse.json();
    expect(detailBody.data.participants).toHaveLength(1);
    expect(detailBody.data.messages).toHaveLength(2);
    expect(detailBody.data.messages[0].sender_type).toBe("user");
    expect(detailBody.data.messages[1].sender_type).toBe("agent");
    expect(detailBody.data.messages[1].content.text).toContain("[Summarizer Agent]");
  });
});
