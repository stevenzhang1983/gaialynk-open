import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

async function setupConversationWithAgent(riskLevel: "low" | "high") {
  const app = createApp();

  const createConversationResponse = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Trust Loop Demo" }),
  });
  const conversationBody = await createConversationResponse.json();
  const conversationId = conversationBody.data.id as string;

  const registerAgentResponse = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Risk Agent",
      description: "Handles risk-sensitive actions",
      agent_type: "execution",
      source_url: "mock://risk-agent",
      capabilities: [{ name: "execute_action", risk_level: riskLevel }],
    }),
  });
  const agentBody = await registerAgentResponse.json();
  const agentId = agentBody.data.id as string;

  await app.request(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });

  return { app, conversationId };
}

describe("Sprint2 trust minimal closed loop", () => {
  it("allows low risk invocation, writes audit events, and issues verifiable receipt", async () => {
    const { app, conversationId } = await setupConversationWithAgent("low");

    const sendMessageResponse = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "user-1", text: "execute action safely" }),
    });

    expect(sendMessageResponse.status).toBe(201);
    const sendBody = await sendMessageResponse.json();
    expect(sendBody.meta.trust_decision.decision).toBe("allow");
    expect(sendBody.meta.receipt_id).toBeTypeOf("string");

    const auditResponse = await app.request("/api/v1/audit-events");
    expect(auditResponse.status).toBe(200);
    const auditBody = await auditResponse.json();

    const eventTypes = auditBody.data.map((event: { event_type: string }) => event.event_type);
    expect(eventTypes).toContain("invocation.allowed");
    expect(eventTypes).toContain("invocation.completed");

    const receiptResponse = await app.request(`/api/v1/receipts/${sendBody.meta.receipt_id}`);
    expect(receiptResponse.status).toBe(200);

    const receiptBody = await receiptResponse.json();
    expect(receiptBody.data.receipt_type).toBe("invocation_completed");
    expect(receiptBody.meta.is_valid).toBe(true);
  });

  it("requires confirmation for high risk invocation and executes after confirm", async () => {
    const { app, conversationId } = await setupConversationWithAgent("high");

    const sendMessageResponse = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "user-2", text: "execute high risk action" }),
    });

    expect(sendMessageResponse.status).toBe(202);
    const sendBody = await sendMessageResponse.json();
    expect(sendBody.meta.trust_decision.decision).toBe("need_confirmation");
    expect(sendBody.meta.invocation_id).toBeTypeOf("string");
    const invocationId = sendBody.meta.invocation_id as string;

    const queueBeforeConfirm = await app.request(
      `/api/v1/invocations?status=pending_confirmation&conversation_id=${conversationId}`,
    );
    expect(queueBeforeConfirm.status).toBe(200);
    const queueBeforeBody = await queueBeforeConfirm.json();
    expect(queueBeforeBody.data).toHaveLength(1);
    expect(queueBeforeBody.data[0].id).toBe(invocationId);

    const beforeConfirmDetailResponse = await app.request(`/api/v1/conversations/${conversationId}`);
    const beforeConfirmDetail = await beforeConfirmDetailResponse.json();
    expect(beforeConfirmDetail.data.messages).toHaveLength(1);

    const confirmResponse = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-2" }),
    });

    expect(confirmResponse.status).toBe(200);
    const confirmBody = await confirmResponse.json();
    expect(confirmBody.meta.receipt_id).toBeTypeOf("string");

    const detailResponse = await app.request(`/api/v1/conversations/${conversationId}`);
    const detailBody = await detailResponse.json();
    expect(detailBody.data.messages).toHaveLength(2);
    expect(detailBody.data.messages[1].sender_type).toBe("agent");

    const receiptResponse = await app.request(`/api/v1/receipts/${confirmBody.meta.receipt_id}`);
    expect(receiptResponse.status).toBe(200);
    const receiptBody = await receiptResponse.json();
    expect(receiptBody.meta.is_valid).toBe(true);

    const queueAfterConfirm = await app.request(
      `/api/v1/invocations?status=pending_confirmation&conversation_id=${conversationId}`,
    );
    expect(queueAfterConfirm.status).toBe(200);
    const queueAfterBody = await queueAfterConfirm.json();
    expect(queueAfterBody.data).toHaveLength(0);

    const secondConfirm = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-2" }),
    });
    expect(secondConfirm.status).toBe(409);
  });
});
