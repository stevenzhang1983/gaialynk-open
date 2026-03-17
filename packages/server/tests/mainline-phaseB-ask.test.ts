import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline phase B ask and fallback APIs", () => {
  it("supports ask mainline contract with routing and aggregated result", async () => {
    const app = createApp();

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Summary Agent",
        description: "summarize long text",
        agent_type: "execution",
        source_url: "mock://summary-agent",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });

    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "summarize this report in bullets",
        target_format: "markdown",
        deadline_sec: 60,
        budget_tokens: 1200,
      }),
    });
    expect(askRes.status).toBe(201);
    const askBody = await askRes.json();
    expect(askBody.data.ask_id).toBeTypeOf("string");
    expect(askBody.data.route.selected_agent_ids.length).toBeGreaterThanOrEqual(1);
    expect(askBody.data.result.summary).toBeTypeOf("string");
    expect(askBody.data.result.cost_estimate_tokens).toBeTypeOf("number");
  });

  it("supports retry/alternative/degraded fallback and l1/l2 visualization", async () => {
    const app = createApp();

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Ops Agent",
        description: "operations helper",
        agent_type: "execution",
        source_url: "mock://ops-agent",
        capabilities: [{ name: "ops", risk_level: "low" }],
      }),
    });
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Backup Ops Agent",
        description: "alternative operations helper",
        agent_type: "execution",
        source_url: "mock://ops-agent-backup",
        capabilities: [{ name: "ops", risk_level: "low" }],
      }),
    });

    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "ops health report",
        target_format: "json",
      }),
    });
    const askBody = await askRes.json();
    const askId = askBody.data.ask_id as string;

    const retryRes = await app.request(`/api/v1/ask/${askId}/fallback/retry`, { method: "POST" });
    expect(retryRes.status).toBe(200);
    const retryBody = await retryRes.json();
    expect(retryBody.data.action).toBe("retry");

    const alternativeRes = await app.request(`/api/v1/ask/${askId}/fallback/alternative`, {
      method: "POST",
    });
    expect(alternativeRes.status).toBe(200);
    const alternativeBody = await alternativeRes.json();
    expect(alternativeBody.data.action).toBe("alternative");

    const degradedRes = await app.request(`/api/v1/ask/${askId}/fallback/degraded`, { method: "POST" });
    expect(degradedRes.status).toBe(200);
    const degradedBody = await degradedRes.json();
    expect(degradedBody.data.action).toBe("degraded");
    expect(degradedBody.data.result.summary).toContain("degraded");

    const l1Res = await app.request(`/api/v1/ask/${askId}/visualization?level=l1`);
    expect(l1Res.status).toBe(200);
    const l1Body = await l1Res.json();
    expect(l1Body.data.level).toBe("l1");
    expect(l1Body.data.route_summary).toBeTypeOf("string");

    const l2Res = await app.request(`/api/v1/ask/${askId}/visualization?level=l2`);
    expect(l2Res.status).toBe(200);
    const l2Body = await l2Res.json();
    expect(l2Body.data.level).toBe("l2");
    expect(Array.isArray(l2Body.data.timeline)).toBe(true);
  });

  it("visualization returns path_summary, risk_hints, key_evidence_refs, rerun_token (P0-1 B)", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Viz Agent",
        description: "for viz",
        agent_type: "execution",
        source_url: "mock://viz",
        capabilities: [{ name: "viz", risk_level: "low" }],
      }),
    });
    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "viz query" }),
    });
    const askId = (await askRes.json()).data.ask_id as string;
    const vizRes = await app.request(`/api/v1/ask/${askId}/visualization?level=l2`);
    expect(vizRes.status).toBe(200);
    const viz = (await vizRes.json()).data;
    expect(viz.path_summary).toBeTypeOf("string");
    expect(Array.isArray(viz.risk_hints)).toBe(true);
    expect(Array.isArray(viz.key_evidence_refs)).toBe(true);
    expect(viz.rerun_token).toBe(askId);
  });

  it("POST /api/v1/ask/:id/rerun runs again and returns result (P0-1 B)", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Rerun Agent",
        description: "rerun",
        agent_type: "execution",
        source_url: "mock://rerun",
        capabilities: [{ name: "rerun", risk_level: "low" }],
      }),
    });
    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "rerun me" }),
    });
    const askId = (await askRes.json()).data.ask_id as string;
    const rerunRes = await app.request(`/api/v1/ask/${askId}/rerun`, { method: "POST" });
    expect(rerunRes.status).toBe(200);
    const body = await rerunRes.json();
    expect(body.data.ask_id).toBe(askId);
    expect(body.data.rerun_token).toBe(askId);
    expect(body.data.result.summary).toBeTypeOf("string");
    expect(Array.isArray(body.data.result.evidence)).toBe(true);
    const notFoundRes = await app.request("/api/v1/ask/non-existent-id/rerun", { method: "POST" });
    expect(notFoundRes.status).toBe(404);
  });

  it("supports ask_more_info and delegate HITL actions", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "HITL Actions" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const highAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "High Risk HITL Agent",
        description: "high risk operation",
        agent_type: "execution",
        source_url: "mock://hitl-agent",
        capabilities: [{ name: "dangerous", risk_level: "high" }],
      }),
    });
    const highAgentBody = await highAgentRes.json();
    const agentId = highAgentBody.data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const pendingRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "hitl-requester",
        text: "please run high risk action",
        target_agent_ids: [agentId],
      }),
    });
    expect(pendingRes.status).toBe(202);
    const pendingBody = await pendingRes.json();
    const invocationId = pendingBody.meta.pending_invocations[0].invocation_id as string;

    const askMoreRes = await app.request(`/api/v1/review-queue/${invocationId}/ask-more-info`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        approver_id: "reviewer-ask-more",
        question: "请补充影响范围",
      }),
    });
    expect(askMoreRes.status).toBe(200);
    const askMoreBody = await askMoreRes.json();
    expect(askMoreBody.data.action).toBe("ask_more_info");

    const delegateRes = await app.request(`/api/v1/review-queue/${invocationId}/delegate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        approver_id: "reviewer-lead",
        delegate_to: "reviewer-senior",
      }),
    });
    expect(delegateRes.status).toBe(200);
    const delegateBody = await delegateRes.json();
    expect(delegateBody.data.action).toBe("delegate");
  });

  it("exposes phase B ops report with fallback success and HITL SLA", async () => {
    const app = createApp();

    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Report Ask Agent",
        description: "ask report agent",
        agent_type: "execution",
        source_url: "mock://report-ask-agent",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });

    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "generate report summary",
        target_format: "markdown",
      }),
    });
    expect(askRes.status).toBe(201);
    const askBody = await askRes.json();
    const askId = askBody.data.ask_id as string;

    const fallbackRes = await app.request(`/api/v1/ask/${askId}/fallback/retry`, { method: "POST" });
    expect(fallbackRes.status).toBe(200);

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Phase B Report Conversation" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const highAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Report High Agent",
        description: "high risk for review sla",
        agent_type: "execution",
        source_url: "mock://report-high-agent",
        capabilities: [{ name: "dangerous", risk_level: "high" }],
      }),
    });
    const highAgentBody = await highAgentRes.json();
    const highAgentId = highAgentBody.data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: highAgentId }),
    });

    const pendingRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "report-user",
        text: "run high risk action",
        target_agent_ids: [highAgentId],
      }),
    });
    expect(pendingRes.status).toBe(202);
    const pendingBody = await pendingRes.json();
    const invocationId = pendingBody.meta.pending_invocations[0].invocation_id as string;

    const approveRes = await app.request(`/api/v1/review-queue/${invocationId}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "report-reviewer" }),
    });
    expect(approveRes.status).toBe(200);

    const reportRes = await app.request("/api/v1/ops/reports/phase-b?window_days=7");
    expect(reportRes.status).toBe(200);
    const reportBody = await reportRes.json();
    expect(reportBody.data.window_days).toBe(7);
    expect(reportBody.data.fallback_success_rate).toBeGreaterThan(0);
    expect(reportBody.data.hitl.approval_sla_ms_p95).toBeGreaterThanOrEqual(0);
    expect(reportBody.data.hitl.completed_reviews).toBeGreaterThanOrEqual(1);
  });
});
