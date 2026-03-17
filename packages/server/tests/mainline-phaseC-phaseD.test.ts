import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline phase C/D APIs", () => {
  it("supports user task instance lifecycle and run history", async () => {
    const app = createApp();

    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "user-task-1",
        name: "Weekly market summary",
        schedule_cron: "0 9 * * 1",
      }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const taskId = createBody.data.id as string;
    expect(createBody.data.status).toBe("draft");

    const resumeRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "user-task-1" }),
    });
    expect(resumeRes.status).toBe(200);
    const resumeBody = await resumeRes.json();
    expect(resumeBody.data.status).toBe("active");

    const runRes = await app.request(`/api/v1/user-task-instances/${taskId}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "user-task-1" }),
    });
    expect(runRes.status).toBe(200);
    const runBody = await runRes.json();
    expect(runBody.data.status).toBe("completed");

    const historyRes = await app.request(`/api/v1/user-task-instances/${taskId}/history`);
    const historyWithActorRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/history?actor_id=user-task-1&limit=10`,
    );
    expect(historyRes.status).toBe(400);
    expect(historyWithActorRes.status).toBe(200);
    const historyBody = await historyWithActorRes.json();
    expect(historyBody.data.runs.length).toBeGreaterThanOrEqual(1);
    expect(historyBody.data.anomaly_summary).toBeDefined();
    expect(historyBody.data.anomaly_summary.total_runs).toBeGreaterThanOrEqual(1);
    expect(historyBody.meta.page_size).toBe(10);
    expect(typeof historyBody.meta.has_more).toBe("boolean");
  });

  it("P0-1 C: PATCH user-task-instances/:id and GET export (non-owner 403)", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "patch-owner-1",
        name: "Original name",
        schedule_cron: "0 8 * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = (await createRes.json()).data.id as string;

    const patchRes = await app.request(`/api/v1/user-task-instances/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor_id: "patch-owner-1",
        name: "Updated name",
        schedule_cron: "0 9 * * 1",
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.name).toBe("Updated name");
    expect(patchBody.data.schedule_cron).toBe("0 9 * * 1");

    const forbiddenPatchRes = await app.request(`/api/v1/user-task-instances/${taskId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "other-user", name: "Hacked" }),
    });
    expect(forbiddenPatchRes.status).toBe(403);

    const exportJsonRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/export?format=json&actor_id=patch-owner-1`,
    );
    expect(exportJsonRes.status).toBe(200);
    const exportJsonBody = await exportJsonRes.json();
    expect(exportJsonBody.data.task).toBeDefined();
    expect(exportJsonBody.data.task.name).toBe("Updated name");
    expect(Array.isArray(exportJsonBody.data.runs)).toBe(true);

    const exportCsvRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/export?format=csv&actor_id=patch-owner-1`,
    );
    expect(exportCsvRes.status).toBe(200);
    expect(exportCsvRes.headers.get("Content-Type")).toContain("text/csv");
    const csvText = await exportCsvRes.text();
    expect(csvText).toContain("task_id");
    expect(csvText).toContain("Updated name");

    const forbiddenExportRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/export?format=json&actor_id=other-user`,
    );
    expect(forbiddenExportRes.status).toBe(403);
  });

  it("supports task delete semantics with ownership and idempotency", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "task-delete-owner-1",
        name: "Delete me task",
        schedule_cron: "0 7 * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = ((await createRes.json()).data.id as string) ?? "";

    const forbiddenDeleteRes = await app.request(`/api/v1/user-task-instances/${taskId}/delete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-delete-intruder-1" }),
    });
    expect(forbiddenDeleteRes.status).toBe(403);

    const deleteRes = await app.request(`/api/v1/user-task-instances/${taskId}/delete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-delete-owner-1" }),
    });
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.data.status).toBe("deleted");

    const deleteAgainRes = await app.request(`/api/v1/user-task-instances/${taskId}/delete`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-delete-owner-1" }),
    });
    expect(deleteAgainRes.status).toBe(200);
    const deleteAgainBody = await deleteAgainRes.json();
    expect(deleteAgainBody.data.status).toBe("deleted");

    const resumeDeletedRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-delete-owner-1" }),
    });
    expect(resumeDeletedRes.status).toBe(409);
    expect((await resumeDeletedRes.json()).error.code).toBe("task_instance_deleted");

    const historyRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/history?actor_id=task-delete-owner-1`,
    );
    expect(historyRes.status).toBe(404);
  });

  it("enforces task ownership isolation and supports idempotent status actions", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "task-owner-1",
        name: "Owner-only task",
        schedule_cron: "0 10 * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = ((await createRes.json()).data.id as string) ?? "";

    const forbiddenResumeRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "intruder-1" }),
    });
    expect(forbiddenResumeRes.status).toBe(403);

    const resumeRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-owner-1" }),
    });
    expect(resumeRes.status).toBe(200);
    const resumeAgainRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-owner-1" }),
    });
    expect(resumeAgainRes.status).toBe(200);
    expect((await resumeAgainRes.json()).data.status).toBe("active");

    const forbiddenRunRes = await app.request(`/api/v1/user-task-instances/${taskId}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "intruder-1" }),
    });
    expect(forbiddenRunRes.status).toBe(403);

    const archiveRes = await app.request(`/api/v1/user-task-instances/${taskId}/archive`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-owner-1" }),
    });
    expect(archiveRes.status).toBe(200);
    const archiveAgainRes = await app.request(`/api/v1/user-task-instances/${taskId}/archive`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "task-owner-1" }),
    });
    expect(archiveAgainRes.status).toBe(200);
    expect((await archiveAgainRes.json()).data.status).toBe("archived");

    const forbiddenHistoryRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/history?actor_id=intruder-1`,
    );
    expect(forbiddenHistoryRes.status).toBe(403);
  });

  it("supports dispute evidence and arbitration workflow", async () => {
    const app = createApp();

    const createRes = await app.request("/api/v1/disputes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task_instance_id: "task-001",
        reporter_id: "user-1",
        reason: "结果与预期不一致",
        evidence_refs: ["receipt-1", "audit-2"],
      }),
    });
    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    const disputeId = createBody.data.id as string;
    expect(createBody.data.status).toBe("open");

    const disputeForbiddenRes = await app.request(`/api/v1/disputes/${disputeId}?actor_id=user-2`);
    expect(disputeForbiddenRes.status).toBe(403);

    const disputeGetRes = await app.request(`/api/v1/disputes/${disputeId}?actor_id=user-1`);
    expect(disputeGetRes.status).toBe(200);

    const arbitrateForbiddenRes = await app.request(`/api/v1/disputes/${disputeId}/arbitrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        arbitrator_id: "user-2",
        decision: "accepted",
        note: "非法仲裁尝试",
      }),
    });
    expect(arbitrateForbiddenRes.status).toBe(403);

    const arbitrateRes = await app.request(`/api/v1/disputes/${disputeId}/arbitrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        arbitrator_id: "ops-lead",
        decision: "accepted",
        note: "证据完整，判定用户诉求成立",
      }),
    });
    expect(arbitrateRes.status).toBe(200);
    const arbitrateBody = await arbitrateRes.json();
    expect(arbitrateBody.data.status).toBe("resolved");
    expect(arbitrateBody.data.decision).toBe("accepted");
  });

  it("supports connector authorization and high-risk local action receipt", async () => {
    const app = createApp();

    const authRes = await app.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "connector-user-1",
        connector: "notion",
        scope_level: "action",
        scope_value: "notion.pages.delete",
        expires_in_sec: 3600,
      }),
    });
    expect(authRes.status).toBe(201);
    const authBody = await authRes.json();
    const authorizationId = authBody.data.id as string;
    expect(authBody.data.status).toBe("active");

    const scopeBlockedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.read",
        risk_level: "low",
        params_summary: { page_id: "p-123" },
      }),
    });
    expect(scopeBlockedRes.status).toBe(403);
    const scopeBlockedBody = await scopeBlockedRes.json();
    expect(scopeBlockedBody.error.code).toBe("authorization_scope_violation");

    const blockedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        params_summary: { page_id: "p-123" },
      }),
    });
    expect(blockedRes.status).toBe(403);
    const blockedBody = await blockedRes.json();
    expect(blockedBody.error.code).toBe("high_risk_confirmation_required");

    const confirmedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        confirmed: true,
        params_summary: { page_id: "p-123" },
      }),
    });
    expect(confirmedRes.status).toBe(200);
    const confirmedBody = await confirmedRes.json();
    expect(confirmedBody.data.status).toBe("completed");
    expect(confirmedBody.data.receipt_id).toBeTypeOf("string");

    const receiptRes = await app.request(
      `/api/v1/connectors/local-action-receipts/${confirmedBody.data.receipt_id}?actor_id=connector-user-1`,
    );
    expect(receiptRes.status).toBe(200);
    const receiptBody = await receiptRes.json();
    expect(receiptBody.data.action).toBe("notion.pages.delete");

    const receiptForbiddenRes = await app.request(
      `/api/v1/connectors/local-action-receipts/${confirmedBody.data.receipt_id}?actor_id=connector-user-2`,
    );
    expect(receiptForbiddenRes.status).toBe(403);

    const revokeRes = await app.request(`/api/v1/connectors/authorizations/${authorizationId}/revoke`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "connector-user-1" }),
    });
    expect(revokeRes.status).toBe(200);
    const revokeBody = await revokeRes.json();
    expect(revokeBody.data.status).toBe("revoked");
  });

  it("enforces connector-action consistency and scope matrix across action/application/directory", async () => {
    const app = createApp();

    const actionScopeAuthRes = await app.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "scope-matrix-user-1",
        connector: "notion",
        scope_level: "action",
        scope_value: "notion.pages.delete",
        expires_in_sec: 3600,
      }),
    });
    expect(actionScopeAuthRes.status).toBe(201);
    const actionAuthId = ((await actionScopeAuthRes.json()).data.id as string) ?? "";

    const actionAllowedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: actionAuthId,
        action: "notion.pages.delete",
        risk_level: "high",
        confirmed: true,
        params_summary: { page_id: "matrix-1" },
      }),
    });
    expect(actionAllowedRes.status).toBe(200);

    const actionBlockedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: actionAuthId,
        action: "notion.pages.read",
        risk_level: "low",
        params_summary: { page_id: "matrix-2" },
      }),
    });
    expect(actionBlockedRes.status).toBe(403);
    expect((await actionBlockedRes.json()).error.code).toBe("authorization_scope_violation");

    const appScopeAuthRes = await app.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "scope-matrix-user-1",
        connector: "notion",
        scope_level: "application",
        scope_value: "notion.pages",
        expires_in_sec: 3600,
      }),
    });
    expect(appScopeAuthRes.status).toBe(201);
    const appAuthId = ((await appScopeAuthRes.json()).data.id as string) ?? "";

    const appAllowedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: appAuthId,
        action: "notion.pages.update",
        risk_level: "low",
        params_summary: { page_id: "matrix-3" },
      }),
    });
    expect(appAllowedRes.status).toBe(200);

    const appBlockedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: appAuthId,
        action: "notion.database.query",
        risk_level: "low",
        params_summary: { db_id: "matrix-db" },
      }),
    });
    expect(appBlockedRes.status).toBe(403);
    expect((await appBlockedRes.json()).error.code).toBe("authorization_scope_violation");

    const directoryScopeAuthRes = await app.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "scope-matrix-user-2",
        connector: "github",
        scope_level: "directory",
        scope_value: "github.repo",
        expires_in_sec: 3600,
      }),
    });
    expect(directoryScopeAuthRes.status).toBe(201);
    const directoryAuthId = ((await directoryScopeAuthRes.json()).data.id as string) ?? "";

    const directoryAllowedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: directoryAuthId,
        action: "github.repo.create",
        risk_level: "low",
        params_summary: { repo: "matrix-repo" },
      }),
    });
    expect(directoryAllowedRes.status).toBe(200);

    const connectorMismatchRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: actionAuthId,
        action: "github.repo.create",
        risk_level: "low",
        params_summary: { repo: "cross-connector-repo" },
      }),
    });
    expect(connectorMismatchRes.status).toBe(403);
    expect((await connectorMismatchRes.json()).error.code).toBe("authorization_connector_mismatch");
  });

  it("exposes phase C ops report with task stability and dispute SLA", async () => {
    const app = createApp();

    const taskCreateRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "ops-c-user-1",
        name: "Daily digest",
        schedule_cron: "0 8 * * *",
      }),
    });
    const taskCreateBody = await taskCreateRes.json();
    const taskId = taskCreateBody.data.id as string;

    await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "ops-c-user-1" }),
    });
    const taskRunRes = await app.request(`/api/v1/user-task-instances/${taskId}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "ops-c-user-1" }),
    });
    expect(taskRunRes.status).toBe(200);

    const disputeCreateRes = await app.request("/api/v1/disputes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task_instance_id: taskId,
        reporter_id: "ops-c-user-1",
        reason: "结果遗漏关键字段",
        evidence_refs: ["receipt-x", "audit-y"],
      }),
    });
    expect(disputeCreateRes.status).toBe(201);
    const disputeCreateBody = await disputeCreateRes.json();
    const disputeId = disputeCreateBody.data.id as string;

    const arbitrateRes = await app.request(`/api/v1/disputes/${disputeId}/arbitrate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        arbitrator_id: "ops-c-reviewer",
        decision: "accepted",
        note: "确认争议成立",
      }),
    });
    expect(arbitrateRes.status).toBe(200);

    const reportRes = await app.request("/api/v1/ops/reports/phase-c?window_days=7");
    expect(reportRes.status).toBe(200);
    const reportBody = await reportRes.json();
    expect(reportBody.data.window_days).toBe(7);
    expect(reportBody.data.subscription_task_stable_completion_rate).toBeGreaterThan(0);
    expect(reportBody.data.dispute.completed_cases).toBeGreaterThanOrEqual(1);
    expect(reportBody.data.dispute.sla_ms_p95).toBeGreaterThanOrEqual(0);
  });

  it("exposes phase D ops report with connector governance metrics", async () => {
    const app = createApp();

    const authRes = await app.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "connector-ops-user-1",
        connector: "notion",
        scope_level: "action",
        scope_value: "notion.pages.delete",
        expires_in_sec: 3600,
      }),
    });
    expect(authRes.status).toBe(201);
    const authBody = await authRes.json();
    const authorizationId = authBody.data.id as string;

    const blockedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        params_summary: { page_id: "ops-page-1" },
      }),
    });
    expect(blockedRes.status).toBe(403);

    const confirmedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        confirmed: true,
        params_summary: { page_id: "ops-page-1" },
      }),
    });
    expect(confirmedRes.status).toBe(200);

    const revokeRes = await app.request(`/api/v1/connectors/authorizations/${authorizationId}/revoke`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "connector-ops-user-1" }),
    });
    expect(revokeRes.status).toBe(200);

    const revokedBlockedRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        confirmed: true,
        params_summary: { page_id: "ops-page-2" },
      }),
    });
    expect(revokedBlockedRes.status).toBe(409);

    const reportRes = await app.request("/api/v1/ops/reports/phase-d?window_days=7");
    expect(reportRes.status).toBe(200);
    const reportBody = await reportRes.json();
    expect(reportBody.data.window_days).toBe(7);
    expect(reportBody.data.connector_overreach_block_rate).toBeGreaterThan(0);
    expect(reportBody.data.high_risk_confirmation_pass_rate).toBeGreaterThan(0);
    expect(reportBody.data.revoke_block_rate).toBeGreaterThan(0);
  });

  it("supports scheduler-triggered task runs with retry strategy", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "scheduler-user-1",
        name: "Scheduled retry task",
        schedule_cron: "*/15 * * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = ((await createRes.json()).data.id as string) ?? "";

    const resumeRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "scheduler-user-1" }),
    });
    expect(resumeRes.status).toBe(200);

    const tickRes = await app.request("/api/v1/user-task-instances/scheduler/tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor_id: "scheduler-user-1",
        limit: 10,
        retry_max: 2,
        retry_backoff_base_ms: 500,
        selection_strategy: "updated_at_asc",
        simulate_failure_task_ids: [taskId],
      }),
    });
    expect(tickRes.status).toBe(200);
    const tickBody = await tickRes.json();
    expect(tickBody.data.executed_count).toBeGreaterThanOrEqual(1);
    expect(tickBody.data.succeeded_count).toBeGreaterThanOrEqual(1);
    expect(tickBody.data.retry_attempts).toBeGreaterThanOrEqual(1);
    expect(tickBody.data.selection_strategy).toBe("updated_at_asc");
    expect(tickBody.data.retry_backoff_ms_total).toBeGreaterThanOrEqual(500);
    expect(
      (tickBody.data.runs as Array<{ task_instance_id: string; attempts: number }>).some(
        (run) => run.task_instance_id === taskId && run.attempts >= 2,
      ),
    ).toBe(true);
  });

  it("supports task history replay cursor and anomaly summary", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "history-user-1",
        name: "History replay task",
        schedule_cron: "*/10 * * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = ((await createRes.json()).data.id as string) ?? "";

    const resumeRes = await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "history-user-1" }),
    });
    expect(resumeRes.status).toBe(200);

    const runRes = await app.request(`/api/v1/user-task-instances/${taskId}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "history-user-1" }),
    });
    expect(runRes.status).toBe(200);

    const schedulerFailRes = await app.request("/api/v1/user-task-instances/scheduler/tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor_id: "history-user-1",
        retry_max: 0,
        simulate_failure_task_ids: [taskId],
      }),
    });
    expect(schedulerFailRes.status).toBe(200);

    const firstPageRes = await app.request(
      `/api/v1/user-task-instances/${taskId}/history?actor_id=history-user-1&limit=1`,
    );
    expect(firstPageRes.status).toBe(200);
    const firstPageBody = await firstPageRes.json();
    expect(firstPageBody.data.runs.length).toBe(1);
    expect(firstPageBody.data.anomaly_summary.failed_runs).toBeGreaterThanOrEqual(1);
    expect(firstPageBody.meta.page_size).toBe(1);
    expect(typeof firstPageBody.meta.has_more).toBe("boolean");
    if (typeof firstPageBody.meta.next_cursor === "string") {
      const secondPageRes = await app.request(
        `/api/v1/user-task-instances/${taskId}/history?actor_id=history-user-1&limit=1&cursor=${firstPageBody.meta.next_cursor}`,
      );
      expect(secondPageRes.status).toBe(200);
      const secondPageBody = await secondPageRes.json();
      expect(secondPageBody.data.runs.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("exposes task billing summary with quota and billable usage", async () => {
    const app = createApp();
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: "billing-user-1",
        name: "Billing task",
        schedule_cron: "0 * * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = ((await createRes.json()).data.id as string) ?? "";

    await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "billing-user-1" }),
    });

    await app.request(`/api/v1/user-task-instances/${taskId}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: "billing-user-1" }),
    });

    await app.request("/api/v1/user-task-instances/scheduler/tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor_id: "billing-user-1",
        retry_max: 0,
        simulate_failure_task_ids: [taskId],
      }),
    });

    const billingRes = await app.request(
      "/api/v1/usage/task-billing-summary?actor_id=billing-user-1&window_days=7",
    );
    expect(billingRes.status).toBe(200);
    const billingBody = await billingRes.json();
    expect(billingBody.data.task_runs_completed).toBeGreaterThanOrEqual(1);
    expect(billingBody.data.task_runs_failed).toBeGreaterThanOrEqual(1);
    expect(billingBody.data.billable_task_runs).toBe(billingBody.data.task_runs_completed);
    expect(billingBody.data.total_estimated_usd).toBeGreaterThan(0);
    expect(billingBody.data.quota.feature).toBe("subscription_task_runs");
    expect(Array.isArray(billingBody.data.billable_items)).toBe(true);
    expect(billingBody.data.billable_items.length).toBeGreaterThanOrEqual(1);
    expect(billingBody.data.billable_items[0]).toHaveProperty("event_id");
    expect(billingBody.data.billable_items[0]).toHaveProperty("run_id");
    expect(billingBody.data.billable_items[0]).toHaveProperty("amount_usd");
  });
});
