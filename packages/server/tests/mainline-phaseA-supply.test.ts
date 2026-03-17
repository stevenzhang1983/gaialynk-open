import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline phase A supply APIs", () => {
  it("creates and lists public agent templates with semantic version", async () => {
    const app = createApp();

    const createRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Invoice Assistant",
        category: "finance",
        major_version: 1,
        minor_version: 0,
        source_url: "https://agents.example.com/invoice-assistant",
      }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.data.version).toBe("1.0");
    expect(createBody.data.status).toBe("draft");

    const listRes = await app.request("/api/v1/public-agent-templates");
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody.data.length).toBeGreaterThanOrEqual(1);
    expect(listBody.data[0].name).toBe("Invoice Assistant");
  });

  it("runs preflight checks and returns hard-gate result", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Ops Assistant",
        category: "ops",
        major_version: 1,
        minor_version: 2,
        source_url: "https://agents.example.com/ops-assistant",
      }),
    });
    const createBody = await createRes.json();
    const templateId = createBody.data.id as string;

    const preflightRes = await app.request(`/api/v1/public-agent-templates/${templateId}/preflight-check`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connectivity_ok: true,
        p95_latency_ms: 860,
        error_rate: 0.02,
        rate_limit_ok: true,
      }),
    });
    expect(preflightRes.status).toBe(200);
    const preflightBody = await preflightRes.json();
    expect(preflightBody.data.gate_passed).toBe(true);
    expect(preflightBody.data.checks.connectivity).toBe("pass");
    expect(preflightBody.data.checks.latency).toBe("pass");
    expect(preflightBody.data.checks.error_rate).toBe("pass");
    expect(preflightBody.data.checks.rate_limit).toBe("pass");
  });

  it("aggregates quality window metrics in 7 and 30 day windows", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Support Assistant",
        category: "support",
        major_version: 2,
        minor_version: 1,
        source_url: "https://agents.example.com/support-assistant",
      }),
    });
    const createBody = await createRes.json();
    const templateId = createBody.data.id as string;

    const qualityRes = await app.request(`/api/v1/public-agent-templates/${templateId}/quality-evaluations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        samples: [
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: false, timed_out: true, complaint: true, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: true },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: false, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
        ],
      }),
    });
    expect(qualityRes.status).toBe(201);
    const qualityBody = await qualityRes.json();
    expect(qualityBody.data.sample_count).toBe(10);

    const window7Res = await app.request(`/api/v1/public-agent-templates/${templateId}/quality?window_days=7`);
    expect(window7Res.status).toBe(200);
    const window7Body = await window7Res.json();
    expect(window7Body.data.window_days).toBe(7);
    expect(window7Body.data.success_rate).toBeTypeOf("number");
    expect(window7Body.data.timeout_rate).toBeTypeOf("number");

    const window30Res = await app.request(`/api/v1/public-agent-templates/${templateId}/quality?window_days=30`);
    expect(window30Res.status).toBe(200);
    const window30Body = await window30Res.json();
    expect(window30Body.data.window_days).toBe(30);
    expect(window30Body.data.evaluation_count).toBeGreaterThanOrEqual(1);
  });

  it("exposes unified failure semantics dictionary", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/public-agent-templates/failure-semantics");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.error_rate_high.user_message).toContain("稳定性");
    expect(body.data.latency_high.user_message).toContain("响应较慢");
  });

  it("supports listing workflow apply -> decide -> status query", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Listing Assistant",
        category: "ops",
        major_version: 1,
        minor_version: 0,
        source_url: "https://agents.example.com/listing-assistant",
      }),
    });
    const createBody = await createRes.json();
    const templateId = createBody.data.id as string;

    const applyRes = await app.request(`/api/v1/public-agent-templates/${templateId}/listing/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "publisher-1" }),
    });
    expect(applyRes.status).toBe(201);
    const applyBody = await applyRes.json();
    expect(applyBody.data.status).toBe("pending_review");

    const decideRes = await app.request(`/api/v1/public-agent-templates/${templateId}/listing/decide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reviewer_id: "reviewer-1",
        decision: "approved",
        note: "quality checks passed",
      }),
    });
    expect(decideRes.status).toBe(200);
    const decideBody = await decideRes.json();
    expect(decideBody.data.status).toBe("approved");

    const statusRes = await app.request(`/api/v1/public-agent-templates/${templateId}/listing/status`);
    expect(statusRes.status).toBe(200);
    const statusBody = await statusRes.json();
    expect(statusBody.data.template_status).toBe("published");
    expect(statusBody.data.latest_application.status).toBe("approved");
  });

  it("exposes publisher metrics in 7/30 day windows", async () => {
    const app = createApp();
    const createTemplateRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Publisher Metrics Assistant",
        category: "ops",
        major_version: 1,
        minor_version: 1,
        source_url: "mock://publisher-metrics-assistant",
      }),
    });
    const createTemplateBody = await createTemplateRes.json();
    const templateId = createTemplateBody.data.id as string;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Publisher Metrics Conversation" }),
    });
    const convBody = await convRes.json();
    const conversationId = convBody.data.id as string;

    const lowAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Publisher Low Agent",
        description: "publisher low risk",
        agent_type: "execution",
        source_url: "mock://publisher-metrics-assistant",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const lowAgentBody = await lowAgentRes.json();

    const criticalAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Publisher Critical Agent",
        description: "publisher critical risk",
        agent_type: "execution",
        source_url: "mock://publisher-metrics-assistant",
        capabilities: [{ name: "delete", risk_level: "critical" }],
      }),
    });
    const criticalAgentBody = await criticalAgentRes.json();

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: lowAgentBody.data.id }),
    });
    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: criticalAgentBody.data.id }),
    });

    const lowInvokeRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "publisher-user",
        text: "run summary",
        target_agent_ids: [lowAgentBody.data.id],
      }),
    });
    expect(lowInvokeRes.status).toBe(201);

    const criticalInvokeRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "publisher-user",
        text: "run delete",
        target_agent_ids: [criticalAgentBody.data.id],
      }),
    });
    expect(criticalInvokeRes.status).toBe(403);

    const metrics7Res = await app.request(
      `/api/v1/public-agent-templates/${templateId}/publisher-metrics?window_days=7`,
    );
    expect(metrics7Res.status).toBe(200);
    const metrics7Body = await metrics7Res.json();
    expect(metrics7Body.data.window_days).toBe(7);
    expect(metrics7Body.data.invocation_total).toBeGreaterThanOrEqual(2);
    expect(metrics7Body.data.success_rate).toBeGreaterThan(0);
    expect(metrics7Body.data.failure_types.denied).toBeGreaterThanOrEqual(1);

    const metrics30Res = await app.request(
      `/api/v1/public-agent-templates/${templateId}/publisher-metrics?window_days=30`,
    );
    expect(metrics30Res.status).toBe(200);
    const metrics30Body = await metrics30Res.json();
    expect(metrics30Body.data.window_days).toBe(30);
  });

  it("triggers governance actions and exposes publisher dashboard", async () => {
    const app = createApp();
    const createTemplateRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Governance Assistant",
        category: "ops",
        major_version: 1,
        minor_version: 0,
        source_url: "mock://governance-assistant",
      }),
    });
    const createTemplateBody = await createTemplateRes.json();
    const templateId = createTemplateBody.data.id as string;

    await app.request(`/api/v1/public-agent-templates/${templateId}/listing/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "publisher-gov-1" }),
    });
    await app.request(`/api/v1/public-agent-templates/${templateId}/listing/decide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reviewer_id: "reviewer-gov-1",
        decision: "approved",
      }),
    });

    const qualityRes = await app.request(`/api/v1/public-agent-templates/${templateId}/quality-evaluations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        samples: [
          { success: false, timed_out: true, complaint: true, withdrawn: false },
          { success: false, timed_out: true, complaint: false, withdrawn: false },
          { success: false, timed_out: false, complaint: true, withdrawn: false },
          { success: false, timed_out: false, complaint: false, withdrawn: true },
          { success: false, timed_out: true, complaint: true, withdrawn: false },
          { success: false, timed_out: false, complaint: false, withdrawn: false },
          { success: false, timed_out: true, complaint: false, withdrawn: true },
          { success: false, timed_out: false, complaint: true, withdrawn: false },
          { success: false, timed_out: true, complaint: false, withdrawn: false },
          { success: false, timed_out: false, complaint: true, withdrawn: false },
        ],
      }),
    });
    expect(qualityRes.status).toBe(201);
    const qualityBody = await qualityRes.json();
    expect(qualityBody.meta.governance.action).toBe("suspend");

    const governanceEventsRes = await app.request(
      `/api/v1/public-agent-templates/${templateId}/governance/events?window_days=7`,
    );
    expect(governanceEventsRes.status).toBe(200);
    const governanceEventsBody = await governanceEventsRes.json();
    expect(governanceEventsBody.data.events.length).toBeGreaterThanOrEqual(1);
    expect(governanceEventsBody.data.events[0].event_type).toBe("template.governance.triggered");

    const dashboardRes = await app.request("/api/v1/publishers/publisher-gov-1/dashboard?window_days=7");
    expect(dashboardRes.status).toBe(200);
    const dashboardBody = await dashboardRes.json();
    expect(dashboardBody.data.publisher_id).toBe("publisher-gov-1");
    expect(dashboardBody.data.template_count).toBeGreaterThanOrEqual(1);
  });

  it("exposes publisher trend and alerts for ops evidence", async () => {
    const app = createApp();
    const createTemplateRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Evidence Assistant",
        category: "ops",
        major_version: 1,
        minor_version: 0,
        source_url: "mock://evidence-assistant",
      }),
    });
    const templateId = (await createTemplateRes.json()).data.id as string;

    await app.request(`/api/v1/public-agent-templates/${templateId}/listing/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "publisher-evidence-1" }),
    });
    await app.request(`/api/v1/public-agent-templates/${templateId}/listing/decide`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reviewer_id: "reviewer-evidence-1",
        decision: "approved",
      }),
    });

    const qualityRes = await app.request(`/api/v1/public-agent-templates/${templateId}/quality-evaluations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        samples: [
          { success: false, timed_out: true, complaint: true, withdrawn: false },
          { success: false, timed_out: true, complaint: false, withdrawn: false },
          { success: false, timed_out: false, complaint: true, withdrawn: false },
          { success: false, timed_out: false, complaint: false, withdrawn: true },
          { success: false, timed_out: true, complaint: true, withdrawn: false },
          { success: false, timed_out: false, complaint: false, withdrawn: false },
          { success: false, timed_out: true, complaint: false, withdrawn: true },
          { success: false, timed_out: false, complaint: true, withdrawn: false },
          { success: false, timed_out: true, complaint: false, withdrawn: false },
          { success: false, timed_out: false, complaint: true, withdrawn: false },
        ],
      }),
    });
    expect(qualityRes.status).toBe(201);

    const trendRes = await app.request("/api/v1/publishers/publisher-evidence-1/dashboard/trends?window_days=7");
    expect(trendRes.status).toBe(200);
    const trendBody = await trendRes.json();
    expect(trendBody.data.publisher_id).toBe("publisher-evidence-1");
    expect(Array.isArray(trendBody.data.daily)).toBe(true);
    expect(trendBody.data.daily.length).toBe(7);

    const alertsRes = await app.request("/api/v1/publishers/publisher-evidence-1/alerts?window_days=7");
    expect(alertsRes.status).toBe(200);
    const alertsBody = await alertsRes.json();
    expect(Array.isArray(alertsBody.data.alerts)).toBe(true);
    expect(alertsBody.data.alerts.length).toBeGreaterThanOrEqual(1);
    expect(alertsBody.data.alerts[0].severity).toMatch(/warning|critical/);

    const evidenceRes = await app.request("/api/v1/mainline/evidence?window_days=7");
    expect(evidenceRes.status).toBe(200);
    const evidenceBody = await evidenceRes.json();
    expect(evidenceBody.data.window_days).toBe(7);
    expect(evidenceBody.data).toHaveProperty("metrics_snapshot");
    expect(evidenceBody.data).toHaveProperty("supply_governance_summary");
    expect(evidenceBody.data).toHaveProperty("release_gate");
    expect(evidenceBody.data.release_gate).toHaveProperty("receipt_traceability_ok");
    expect(evidenceBody.data.release_gate).toHaveProperty("rollback_strategy_available");
    expect(evidenceBody.data.release_gate).toHaveProperty("ttfr_ok");
    expect(evidenceBody.data.release_gate).toHaveProperty("fallback_ok");
    expect(evidenceBody.data.release_gate).toHaveProperty("task_stability_ok");
    expect(Array.isArray(evidenceBody.data.release_gate.failed_checks)).toBe(true);
    expect(evidenceBody.data.release_gate).toHaveProperty("thresholds");
    expect(evidenceBody.data.release_gate).toHaveProperty("observed");
    expect(evidenceBody.data.release_gate).toHaveProperty("decision_reason");
    expect(typeof evidenceBody.data.release_gate.decision_reason).toBe("string");
  });
});
