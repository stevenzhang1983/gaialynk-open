import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../src/app";
import { closePool } from "../src/infra/db/client";

const integrationDescribe = process.env.DATABASE_URL ? describe : describe.skip;

integrationDescribe("postgres integration", () => {
  const app = createApp();

  beforeAll(() => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set for postgres integration test");
    }
  });

  afterAll(async () => {
    await closePool();
  });

  it("runs trusted invocation flow on PostgreSQL backend", async () => {
    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "PG Integration Conversation" }),
    });
    expect(conversationRes.status).toBe(201);
    const conversationBody = await conversationRes.json();
    const conversationId = conversationBody.data.id as string;

    const lowAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG Low Agent",
        description: "low risk agent",
        agent_type: "execution",
        source_url: "mock://pg-low",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    expect(lowAgentRes.status).toBe(201);
    const lowAgentBody = await lowAgentRes.json();
    const lowAgentId = lowAgentBody.data.id as string;

    const joinRes = await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: lowAgentId }),
    });
    expect(joinRes.status).toBe(201);

    const lowMessageRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "pg-user", text: "run low task" }),
    });
    expect(lowMessageRes.status).toBe(201);
    const lowMessageBody = await lowMessageRes.json();
    expect(lowMessageBody.meta.trust_decision.decision).toBe("allow");
    expect(lowMessageBody.meta.receipt_id).toBeTypeOf("string");

    const highConversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "PG High Conversation" }),
    });
    const highConversationBody = await highConversationRes.json();
    const highConversationId = highConversationBody.data.id as string;

    const highAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG High Agent",
        description: "high risk agent",
        agent_type: "execution",
        source_url: "mock://pg-high",
        capabilities: [{ name: "delete_data", risk_level: "high" }],
      }),
    });
    const highAgentBody = await highAgentRes.json();

    await app.request(`/api/v1/conversations/${highConversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: highAgentBody.data.id }),
    });

    const highMessageRes = await app.request(`/api/v1/conversations/${highConversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "pg-user", text: "run high task" }),
    });
    expect(highMessageRes.status).toBe(202);
    const highMessageBody = await highMessageRes.json();
    expect(highMessageBody.meta.trust_decision.decision).toBe("need_confirmation");

    const invocationId = highMessageBody.meta.invocation_id as string;
    const confirmRes = await app.request(`/api/v1/invocations/${invocationId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: "pg-user" }),
    });
    expect(confirmRes.status).toBe(200);
    const confirmBody = await confirmRes.json();

    const receiptRes = await app.request(`/api/v1/receipts/${confirmBody.meta.receipt_id}`);
    expect(receiptRes.status).toBe(200);
    const receiptBody = await receiptRes.json();
    expect(receiptBody.meta.is_valid).toBe(true);

    const metricsRes = await app.request("/api/v1/metrics");
    expect(metricsRes.status).toBe(200);
    const metricsBody = await metricsRes.json();
    expect(["go", "hold"]).toContain(metricsBody.data.go_no_go.decision);
    expect(Array.isArray(metricsBody.data.go_no_go.reasons)).toBe(true);
    expect(metricsBody.data.high_risk_interception_ratio).toBeGreaterThanOrEqual(0);
    expect(metricsBody.data.high_risk_interception_ratio).toBeLessThanOrEqual(1);
    expect(metricsBody.data.key_receipt_coverage_ratio).toBeGreaterThanOrEqual(0);
    expect(metricsBody.data.key_receipt_coverage_ratio).toBeLessThanOrEqual(1);
    expect(metricsBody.data.audit_event_coverage_ratio).toBeGreaterThanOrEqual(0);
    expect(metricsBody.data.audit_event_coverage_ratio).toBeLessThanOrEqual(1);
  });

  it("persists deployment records across app restarts", async () => {
    const instantiateRes = await app.request("/api/v1/deploy/templates/starter-assistant/instantiate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor_id: "pg-deploy-user",
        agent_name: "PG Persistent Agent",
      }),
    });
    expect(instantiateRes.status).toBe(201);
    const instantiateBody = await instantiateRes.json();
    const deploymentId = instantiateBody.data.id as string;

    const appAfterRestart = createApp();
    const activateRes = await appAfterRestart.request(`/api/v1/deployments/${deploymentId}/activate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "pg-deploy-user" }),
    });
    expect(activateRes.status).toBe(201);
    const activateBody = await activateRes.json();
    expect(activateBody.data.status).toBe("ready");
    expect(activateBody.data.agent.id).toBeTypeOf("string");

    const secondRestartApp = createApp();
    const activateAgainRes = await secondRestartApp.request(`/api/v1/deployments/${deploymentId}/activate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "pg-deploy-user" }),
    });
    expect(activateAgainRes.status).toBe(200);
    const activateAgainBody = await activateAgainRes.json();
    expect(activateAgainBody.meta.idempotent).toBe(true);
  });

  it("persists phase B/C/D domain records across app restarts", async () => {
    const createTemplateRes = await app.request("/api/v1/public-agent-templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG Template",
        category: "ops",
        major_version: 1,
        minor_version: 0,
        source_url: "https://agents.example.com/pg-template",
      }),
    });
    expect(createTemplateRes.status).toBe(201);
    const createTemplateBody = await createTemplateRes.json();
    const templateId = createTemplateBody.data.id as string;

    const qualityRes = await app.request(`/api/v1/public-agent-templates/${templateId}/quality-evaluations`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        samples: [
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
          { success: true, timed_out: false, complaint: false, withdrawn: false },
        ],
      }),
    });
    expect(qualityRes.status).toBe(201);

    const taskRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "pg-task-user",
        name: "PG Scheduled Task",
        schedule_cron: "0 8 * * *",
      }),
    });
    expect(taskRes.status).toBe(201);
    const taskBody = await taskRes.json();
    const taskId = taskBody.data.id as string;

    const appAfterRestart = createApp();
    const qualitySummaryRes = await appAfterRestart.request(
      `/api/v1/public-agent-templates/${templateId}/quality?window_days=7`,
    );
    expect(qualitySummaryRes.status).toBe(200);
    const qualitySummaryBody = await qualitySummaryRes.json();
    expect(qualitySummaryBody.data.evaluation_count).toBeGreaterThanOrEqual(1);

    const resumeRes = await appAfterRestart.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "pg-task-user" }),
    });
    expect(resumeRes.status).toBe(200);

    const runRes = await appAfterRestart.request(`/api/v1/user-task-instances/${taskId}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "pg-task-user" }),
    });
    expect(runRes.status).toBe(200);

    const connectorAuthRes = await appAfterRestart.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "pg-connector-user",
        connector: "notion",
        scope_level: "action",
        scope_value: "notion.pages.delete",
        expires_in_sec: 3600,
      }),
    });
    expect(connectorAuthRes.status).toBe(201);
    const connectorAuthBody = await connectorAuthRes.json();
    const authorizationId = connectorAuthBody.data.id as string;

    const executeRes = await appAfterRestart.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        confirmed: true,
        params_summary: { page_id: "pg-page-1" },
      }),
    });
    expect(executeRes.status).toBe(200);
    const executeBody = await executeRes.json();
    const receiptId = executeBody.data.receipt_id as string;

    const secondRestart = createApp();
    const receiptRes = await secondRestart.request(
      `/api/v1/connectors/local-action-receipts/${receiptId}?actor_id=pg-connector-user`,
    );
    expect(receiptRes.status).toBe(200);
    const receiptBody = await receiptRes.json();
    expect(receiptBody.data.action).toBe("notion.pages.delete");
  });

  it("persists ask sessions and fallback runs across app restarts", async () => {
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG Ask Agent",
        description: "ask flow agent",
        agent_type: "execution",
        source_url: "mock://pg-ask-agent",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "PG Ask Backup Agent",
        description: "ask flow backup",
        agent_type: "execution",
        source_url: "mock://pg-ask-backup",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });

    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "summarize release notes",
        target_format: "markdown",
      }),
    });
    expect(askRes.status).toBe(201);
    const askBody = await askRes.json();
    const askId = askBody.data.ask_id as string;

    const appAfterRestart = createApp();
    const fallbackRes = await appAfterRestart.request(`/api/v1/ask/${askId}/fallback/alternative`, {
      method: "POST",
    });
    expect(fallbackRes.status).toBe(200);

    const visualizationRes = await appAfterRestart.request(`/api/v1/ask/${askId}/visualization?level=l2`);
    expect(visualizationRes.status).toBe(200);
    const visualizationBody = await visualizationRes.json();
    expect(Array.isArray(visualizationBody.data.timeline)).toBe(true);
    expect(visualizationBody.data.timeline.length).toBeGreaterThanOrEqual(1);
  });
});
