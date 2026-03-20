/**
 * T-5.5 风险确认 API 验收测试
 * 验收条件：确认/拒绝后对应的 Agent 操作正确继续/取消；调用链摘要包含完整的决策路径。
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

async function setupPendingApproval() {
  const app = createApp();

  const createConv = await app.request("/api/v1/conversations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "Approval Test" }),
  });
  const convBody = await createConv.json();
  const conversationId = convBody.data.id as string;

  const regAgent = await app.request("/api/v1/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "High Risk Agent",
      description: "Needs confirmation",
      agent_type: "execution",
      source_url: "mock://high-agent",
      capabilities: [{ name: "dangerous", risk_level: "high" }],
    }),
  });
  const agentBody = await regAgent.json();
  const agentId = agentBody.data.id as string;

  await app.request(`/api/v1/conversations/${conversationId}/agents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ agent_id: agentId }),
  });

  const sendMsg = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sender_id: "user-1", text: "run high risk" }),
  });
  expect(sendMsg.status).toBe(202);
  const sendBody = await sendMsg.json();
  expect(sendBody.meta?.trust_decision?.decision).toBe("need_confirmation");
  const invocationId = sendBody.meta?.invocation_id as string;
  expect(invocationId).toBeTypeOf("string");

  return { app, conversationId, invocationId, agentId };
}

describe("T-5.5 Risk confirmation (approvals) API", () => {
  it("GET /api/v1/approvals returns pending list", async () => {
    const { app, invocationId } = await setupPendingApproval();

    const listRes = await app.request("/api/v1/approvals");
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data).toBeDefined();
    expect(Array.isArray(listBody.data)).toBe(true);
    expect(listBody.data.length).toBeGreaterThanOrEqual(1);
    const found = listBody.data.find((a: { id: string }) => a.id === invocationId);
    expect(found).toBeDefined();
    expect(found.conversation_id).toBeDefined();
    expect(found.agent_id).toBeDefined();
    expect(found.status).toBe("pending_confirmation");
    expect(found.created_at).toBeDefined();
  });

  it("GET /api/v1/approvals/:id returns approval detail", async () => {
    const { app, invocationId, agentId, conversationId } = await setupPendingApproval();

    const detailRes = await app.request(`/api/v1/approvals/${invocationId}`);
    expect(detailRes.status).toBe(200);
    const detail = await detailRes.json();
    expect(detail.data).toBeDefined();
    expect(detail.data.id).toBe(invocationId);
    expect(detail.data.conversation_id).toBe(conversationId);
    expect(detail.data.agent_id).toBe(agentId);
    expect(detail.data.user_text).toBe("run high risk");
    expect(detail.data.status).toBe("pending_confirmation");
    expect(detail.data.agent).toBeDefined();
    expect(detail.data.agent.name).toBe("High Risk Agent");
  });

  it("GET /api/v1/approvals/:id returns 404 for non-existent", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/approvals/00000000-0000-0000-0000-000000000000");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error?.code).toBe("approval_not_found");
  });

  it("POST /api/v1/approvals/:id/confirm continues agent operation", async () => {
    const { app, conversationId, invocationId } = await setupPendingApproval();

    const confirmRes = await app.request(`/api/v1/approvals/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-1" }),
    });
    expect(confirmRes.status).toBe(200);
    const confirmBody = await confirmRes.json();
    expect(confirmBody.data?.status).toBe("completed");
    expect(confirmBody.meta?.receipt_id).toBeDefined();

    const listAfter = await app.request("/api/v1/approvals");
    const listAfterBody = await listAfter.json();
    const stillPending = listAfterBody.data.filter((a: { id: string }) => a.id === invocationId);
    expect(stillPending.length).toBe(0);

    const convRes = await app.request(`/api/v1/conversations/${conversationId}`);
    const convBody = await convRes.json();
    expect(convBody.data.messages?.length).toBeGreaterThanOrEqual(2);
  });

  it("POST /api/v1/approvals/:id/reject cancels and does not execute", async () => {
    const { app, conversationId, invocationId } = await setupPendingApproval();

    const rejectRes = await app.request(`/api/v1/approvals/${invocationId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-1", reason: "Not allowed" }),
    });
    expect(rejectRes.status).toBe(200);
    const rejectBody = await rejectRes.json();
    expect(rejectBody.data?.status).toBe("denied");
    expect(rejectBody.data?.invocation_id).toBe(invocationId);

    const listAfter = await app.request("/api/v1/approvals");
    const listAfterBody = await listAfter.json();
    const stillPending = listAfterBody.data.filter((a: { id: string }) => a.id === invocationId);
    expect(stillPending.length).toBe(0);

    const convRes = await app.request(`/api/v1/conversations/${conversationId}`);
    const convBody = await convRes.json();
    const messageCount = convBody.data.messages?.length ?? 0;
    expect(messageCount).toBe(1);
  });

  it("GET /api/v1/approvals/:id/chain returns decision path", async () => {
    const { app, invocationId } = await setupPendingApproval();

    const chainRes = await app.request(`/api/v1/approvals/${invocationId}/chain`);
    expect(chainRes.status).toBe(200);
    const chainBody = await chainRes.json();
    expect(chainBody.data).toBeDefined();
    expect(Array.isArray(chainBody.data)).toBe(true);
    expect(chainBody.data.length).toBeGreaterThanOrEqual(1);

    const eventTypes = chainBody.data.map((e: { event_type: string }) => e.event_type);
    expect(eventTypes).toContain("invocation.pending_confirmation");
    chainBody.data.forEach((event: { event_type: string; actor_type: string; created_at: string }) => {
      expect(event.event_type).toBeDefined();
      expect(event.actor_type).toBeDefined();
      expect(event.created_at).toBeDefined();
    });
  });

  it("POST /api/v1/approvals/:id/confirm returns 409 when already processed", async () => {
    const { app, invocationId } = await setupPendingApproval();

    await app.request(`/api/v1/approvals/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-1" }),
    });

    const secondConfirm = await app.request(`/api/v1/approvals/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-1" }),
    });
    expect(secondConfirm.status).toBe(409);
    const body = await secondConfirm.json();
    expect(body.error?.code).toBe("invocation_not_confirmable");
  });

  it("POST /api/v1/approvals/:id/reject is idempotent when already denied", async () => {
    const { app, invocationId } = await setupPendingApproval();

    const first = await app.request(`/api/v1/approvals/${invocationId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-1", reason: "No" }),
    });
    expect(first.status).toBe(200);

    const second = await app.request(`/api/v1/approvals/${invocationId}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "user-1", reason: "No" }),
    });
    expect(second.status).toBe(200);
    const body = await second.json();
    expect(body.data?.status).toBe("denied");
  });
});
