/**
 * E-5 V1.3: orchestration recommend / execute / get / cancel / retry / invocation resume.
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

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

async function pollUntil(
  cond: () => Promise<boolean>,
  attempts = 80,
  delayMs = 25,
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    if (await cond()) return;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error("poll timeout");
}

describe("E-5 orchestration runtime", () => {
  it("recommend and execute two mock agents sequentially to completed", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e5-orch1@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E5 Orch" }),
    });
    expect(convRes.status).toBe(201);
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    const partRes = await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });
    expect(partRes.status).toBe(201);

    async function regAgent(name: string) {
      const ar = await app.request("/api/v1/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          description: "e5",
          agent_type: "execution",
          source_url: `mock://e5-${name}`,
          capabilities: [{ name: "task", risk_level: "low" }],
        }),
      });
      expect(ar.status).toBe(201);
      return ((await ar.json()) as { data: { id: string } }).data.id;
    }
    const a1 = await regAgent("A1");
    const a2 = await regAgent("A2");

    for (const aid of [a1, a2]) {
      const jr = await app.request(`/api/v1/conversations/${convId}/agents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: aid }),
      });
      expect(jr.status).toBe(201);
    }

    const recRes = await app.request("/api/v1/orchestrations/recommend", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ conversation_id: convId, user_message: "summarize and plan task" }),
    });
    expect(recRes.status).toBe(200);
    const recBody = (await recRes.json()) as { data: { steps: { agent_id: string }[] } };
    expect(recBody.data.steps.length).toBeGreaterThanOrEqual(1);

    const execRes = await app.request("/api/v1/orchestrations/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        conversation_id: convId,
        user_message: "summarize and plan task",
        topology_source: "dynamic",
        steps: recBody.data.steps,
        idempotency_key: "e5-key-1",
      }),
    });
    expect(execRes.status).toBe(202);
    const runId = ((await execRes.json()) as { data: { run: { id: string } } }).data.run.id;

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string } } };
      return b.data.run.status === "completed";
    });

    const idem = await app.request("/api/v1/orchestrations/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        conversation_id: convId,
        user_message: "summarize and plan task",
        topology_source: "dynamic",
        steps: recBody.data.steps,
        idempotency_key: "e5-key-1",
      }),
    });
    expect(idem.status).toBe(200);
    const idemBody = (await idem.json()) as { data: { idempotent_replay?: boolean } };
    expect(idemBody.data.idempotent_replay).toBe(true);
  });

  it("high-risk first step pauses for human review then continues after confirm", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e5-orch2@example.com");

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E5 Orch HR" }),
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

    const highRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E5High",
        description: "high",
        agent_type: "execution",
        source_url: "mock://e5-high",
        capabilities: [{ name: "risky", risk_level: "high" }],
      }),
    });
    const lowRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E5Low",
        description: "low",
        agent_type: "execution",
        source_url: "mock://e5-low",
        capabilities: [{ name: "safe", risk_level: "low" }],
      }),
    });
    const highId = ((await highRes.json()) as { data: { id: string } }).data.id;
    const lowId = ((await lowRes.json()) as { data: { id: string } }).data.id;

    for (const aid of [highId, lowId]) {
      await app.request(`/api/v1/conversations/${convId}/agents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: aid }),
      });
    }

    const steps = [
      {
        agent_id: highId,
        capability_name: "risky",
        expected_input: { template: "{{user_message}}" },
        expected_output: { required_fields: ["text"] },
      },
      {
        agent_id: lowId,
        capability_name: "safe",
        expected_input: {
          template: "Prior output: {{prev}}\nUser: {{user_message}}",
        },
        expected_output: { required_fields: ["text"] },
      },
    ];

    const execRes = await app.request("/api/v1/orchestrations/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        conversation_id: convId,
        user_message: "do chained work",
        steps,
      }),
    });
    expect(execRes.status).toBe(202);
    const runId = ((await execRes.json()) as { data: { run: { id: string } } }).data.run.id;

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string }; steps: { pending_invocation_id: string | null }[] } };
      return b.data.run.status === "awaiting_human_review" && Boolean(b.data.steps[0]?.pending_invocation_id);
    });

    const detail = (await (
      await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
    ).json()) as { data: { steps: { pending_invocation_id: string | null }[] } };
    const invId = detail.data.steps[0]?.pending_invocation_id;
    expect(invId).toBeTruthy();

    const conf = await app.request(`/api/v1/invocations/${invId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approver_id: user.id }),
    });
    expect(conf.status).toBe(200);

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string } } };
      return b.data.run.status === "completed";
    });
  });

  it("cancels a run awaiting human review", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e5-orch3@example.com");

    const convId = ((await (await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E5 cancel" }),
    })).json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    const highRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E5HighC",
        description: "high",
        agent_type: "execution",
        source_url: "mock://e5-high-c",
        capabilities: [{ name: "risky", risk_level: "high" }],
      }),
    });
    const highId = ((await highRes.json()) as { data: { id: string } }).data.id;
    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: highId }),
    });

    const execRes = await app.request("/api/v1/orchestrations/execute", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        conversation_id: convId,
        user_message: "x",
        steps: [
          {
            agent_id: highId,
            expected_input: { template: "{{user_message}}" },
            expected_output: { required_fields: ["text"] },
          },
        ],
      }),
    });
    const runId = ((await execRes.json()) as { data: { run: { id: string } } }).data.run.id;

    await pollUntil(async () => {
      const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const b = (await gr.json()) as { data: { run: { status: string } } };
      return b.data.run.status === "awaiting_human_review";
    });

    const can = await app.request(`/api/v1/orchestrations/${runId}/cancel`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ actor_id: user.id }),
    });
    expect(can.status).toBe(200);

    const gr = await app.request(`/api/v1/orchestrations/${runId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const b = (await gr.json()) as { data: { run: { status: string } } };
    expect(b.data.run.status).toBe("canceled");
  });
});
