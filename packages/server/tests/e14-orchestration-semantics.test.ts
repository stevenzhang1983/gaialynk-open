/**
 * E-14 V1.3.1: 编排语义（output_schema 软校验）、B 类调度 tick、租约超时 lease_expired。
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { createApp } from "../src/app";
import * as a2aGateway from "../src/modules/gateway/a2a.gateway";
import {
  attachOrchestrationRunAbortController,
  executeOrchestrationRunAsync,
  maybeDetachOrchestrationAbortOnTerminalAsync,
} from "../src/modules/orchestration/orchestration.engine";
import { runScheduledOrchestrationTickAsync } from "../src/modules/orchestration/orchestration-scheduler";
import { createOrchestrationRunWithStepsAsync } from "../src/modules/orchestration/orchestration.store";

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  expect(res.status).toBe(201);
  const body = (await res.json()) as { data: { access_token: string; user: { id: string } } };
  return body.data;
}

async function pollUntil(cond: () => Promise<boolean>, attempts = 120, delayMs = 25): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    if (await cond()) return;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("poll timeout");
}

describe("E-14 orchestration semantics", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("output_schema mismatch → completed_with_warnings and run still completes", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e14-schema@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E14 schema" }),
    });
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    const ar = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E14A",
        description: "e14",
        agent_type: "execution",
        source_url: "mock://e14-a",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const agentId = ((await ar.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const execRes = await app.request("/api/v1/orchestrations/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        conversation_id: convId,
        user_message: "hello",
        topology_source: "dynamic",
        steps: [
          {
            agent_id: agentId,
            capability_name: "task",
            expected_input: { template: "{{user_message}}" },
            expected_output: { required_fields: ["text"] },
            output_schema: {
              type: "object",
              properties: {
                text: { type: "string" },
                foo: { type: "string", minLength: 1 },
              },
              required: ["text", "foo"],
            },
          },
        ],
      }),
    });
    expect(execRes.status).toBe(202);
    const runId = ((await execRes.json()) as { data: { run: { id: string } } }).data.run.id;

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string }; steps: { status: string }[] } };
      return b.data.run.status === "completed" && b.data.steps[0]?.status === "completed_with_warnings";
    });
  });

  it("B-class scheduled run: tick executes mock agent then returns to scheduled with next_run_at", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e14-cron@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E14 cron" }),
    });
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    const ar = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E14Cron",
        description: "e14",
        agent_type: "execution",
        source_url: "mock://e14-cron",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const agentId = ((await ar.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const { run } = await createOrchestrationRunWithStepsAsync({
      conversationId: convId,
      userId: user.id,
      topologySource: "dynamic",
      steps: [
        {
          agent_id: agentId,
          capability_name: "task",
          expected_input: { template: "{{user_message}}" },
          expected_output: { required_fields: ["text"] },
        },
      ],
      userMessage: "tick",
      stepTimeoutMs: 120_000,
      scheduleCron: "* * * * *",
      nextRunAtIso: new Date(Date.now() - 5000).toISOString(),
    });

    expect(run.status).toBe("scheduled");

    await runScheduledOrchestrationTickAsync();

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${run.id}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as {
        data: { run: { status: string; next_run_at: string | null }; steps: { status: string }[] };
      };
      return (
        b.data.run.status === "scheduled" &&
        Boolean(b.data.run.next_run_at) &&
        b.data.steps[0]?.status === "completed"
      );
    });
  });

  it("step timeout → lease_expired; retry resumes with fresh run_id_per_step", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e14-lease@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E14 lease" }),
    });
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    const ar = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E14Lease",
        description: "e14",
        agent_type: "execution",
        source_url: "mock://e14-lease",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const agentId = ((await ar.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    vi.spyOn(a2aGateway, "requestAgent").mockImplementationOnce((input) => {
      const ms = input.timeoutMs && input.timeoutMs > 0 ? input.timeoutMs : 8000;
      return new Promise((_, reject) => {
        const id = setTimeout(() => reject(new Error("Aborted")), ms);
        input.signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(id);
            reject(new Error("Aborted"));
          },
          { once: true },
        );
      });
    });

    const execRes = await app.request("/api/v1/orchestrations/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        conversation_id: convId,
        user_message: "slow",
        topology_source: "dynamic",
        steps: [
          {
            agent_id: agentId,
            capability_name: "task",
            expected_input: { template: "{{user_message}}" },
            expected_output: { required_fields: ["text"] },
          },
        ],
        step_timeout_ms: 1000,
      }),
    });
    const runId = ((await execRes.json()) as { data: { run: { id: string } } }).data.run.id;

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string }; steps: { status: string }[] } };
      return b.data.run.status === "lease_expired" && b.data.steps[0]?.status === "lease_expired";
    });

    const beforeRetry = await app.request(`/api/v1/orchestrations/${runId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const ridBefore = ((await beforeRetry.json()) as { data: { steps: { run_id_per_step: string }[] } }).data
      .steps[0]!.run_id_per_step;

    const retryRes = await app.request(`/api/v1/orchestrations/${runId}/steps/0/retry`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ actor_id: user.id }),
    });
    expect(retryRes.status).toBe(202);

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string } } };
      return b.data.run.status === "completed";
    });

    const afterRetry = await app.request(`/api/v1/orchestrations/${runId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const ridAfter = ((await afterRetry.json()) as { data: { steps: { run_id_per_step: string }[] } }).data.steps[0]!
      .run_id_per_step;
    expect(ridAfter).not.toBe(ridBefore);
  });

  it("second step failure leaves first step completed (partial_completed)", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e14-partial@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E14 partial" }),
    });
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    const r = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E14P1",
        description: "e14",
        agent_type: "execution",
        source_url: "mock://e14-p1",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const a1 = ((await r.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: a1 }),
    });

    const { run } = await createOrchestrationRunWithStepsAsync({
      conversationId: convId,
      userId: user.id,
      topologySource: "dynamic",
      steps: [
        {
          agent_id: a1,
          expected_input: { template: "{{user_message}}" },
          expected_output: { required_fields: ["text"] },
        },
        {
          agent_id: "00000000-0000-4000-8000-000000000099",
          expected_input: { template: "{{user_message}}" },
          expected_output: { required_fields: ["text"] },
        },
      ],
      userMessage: "multi",
      stepTimeoutMs: 120_000,
    });

    const signal = attachOrchestrationRunAbortController(run.id);
    await executeOrchestrationRunAsync({
      runId: run.id,
      startFromStep: 0,
      actorId: user.id,
      abortSignal: signal,
    });
    await maybeDetachOrchestrationAbortOnTerminalAsync(run.id);

    const gr = await app.request(`/api/v1/orchestrations/${run.id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const b = (await gr.json()) as {
      data: { run: { status: string }; steps: { status: string; step_index: number }[] };
    };
    expect(b.data.run.status).toBe("partial_completed");
    expect(b.data.steps.find((s) => s.step_index === 0)?.status).toBe("completed");
    expect(b.data.steps.find((s) => s.step_index === 1)?.status).toBe("failed");
  });

  it("GET /orchestrations/scheduled lists B-class runs; PATCH pause/resume toggles schedule_paused", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e14-sched-pause@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E14 sched pause" }),
    });
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    const ar = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E14SchedPause",
        description: "e14",
        agent_type: "execution",
        source_url: "mock://e14-sched-pause",
        capabilities: [{ name: "task", risk_level: "low" }],
      }),
    });
    const agentId = ((await ar.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const { run } = await createOrchestrationRunWithStepsAsync({
      conversationId: convId,
      userId: user.id,
      topologySource: "dynamic",
      steps: [
        {
          agent_id: agentId,
          capability_name: "task",
          expected_input: { template: "{{user_message}}" },
          expected_output: { required_fields: ["text"] },
        },
      ],
      userMessage: "pause test",
      stepTimeoutMs: 120_000,
      scheduleCron: "0 9 * * *",
    });

    expect(run.status).toBe("scheduled");

    const listRes = await app.request("/api/v1/orchestrations/scheduled", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(listRes.status).toBe(200);
    const listBody = (await listRes.json()) as { data: { runs: { id: string }[] } };
    expect(listBody.data.runs.some((r) => r.id === run.id)).toBe(true);

    const pauseRes = await app.request(`/api/v1/orchestrations/scheduled/${run.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ action: "pause" }),
    });
    expect(pauseRes.status).toBe(200);
    const paused = (await pauseRes.json()) as { data: { run: { status: string; next_run_at: string | null } } };
    expect(paused.data.run.status).toBe("schedule_paused");
    expect(paused.data.run.next_run_at).toBeNull();

    const resumeRes = await app.request(`/api/v1/orchestrations/scheduled/${run.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ action: "resume" }),
    });
    expect(resumeRes.status).toBe(200);
    const resumed = (await resumeRes.json()) as { data: { run: { status: string; next_run_at: string | null } } };
    expect(resumed.data.run.status).toBe("scheduled");
    expect(resumed.data.run.next_run_at).toBeTruthy();
  });
});
