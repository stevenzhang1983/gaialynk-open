/**
 * E-17 V1.3.1: Invocation receipt visibility matrix + data retention dry-run.
 */
import { afterAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { closePool } from "../src/infra/db/client";
import { runDataRetentionArchivalAsync } from "../src/modules/data-retention/data-retention.job";

const pgDescribe = process.env.DATABASE_URL ? describe : describe.skip;

async function register(
  app: ReturnType<typeof createApp>,
  email: string,
  role?: "provider" | "consumer",
) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      password: "password123",
      ...(role ? { role } : {}),
    }),
  });
  expect(res.status).toBe(201);
  return (await res.json()).data as { access_token: string; user: { id: string } };
}

pgDescribe("E-17 receipt visibility + retention", () => {
  afterAll(async () => {
    await closePool();
  });

  it("member cannot read another user's invocation (404)", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const owner = await register(app, `e17-o1-${suffix}@example.com`);
    const member = await register(app, `e17-m1-${suffix}@example.com`);

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ name: `E17 Team ${suffix}`, type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ user_id: member.user.id, role: "member" }),
    });

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ title: "E17 conv", space_id: spaceId }),
    });
    expect(convRes.status).toBe(201);
    const conversationId = (await convRes.json()).data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: `E17 High ${suffix}`,
        description: "high",
        agent_type: "execution",
        source_url: "mock://e17-high",
        capabilities: [{ name: "high-op", risk_level: "high" }],
      }),
    });
    expect(agentRes.status).toBe(201);
    const agentId = (await agentRes.json()).data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ sender_id: owner.user.id, text: "SECRET_OWNER_INPUT_E17" }),
    });
    expect(msgRes.status).toBe(202);
    const invId = ((await msgRes.json()) as { meta: { invocation_id: string } }).meta.invocation_id;

    const peek = await app.request(`/api/v1/invocations/${invId}`, {
      headers: { Authorization: `Bearer ${member.access_token}` },
    });
    expect(peek.status).toBe(404);
  });

  it("space admin sees full user_text and trust_decision", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const owner = await register(app, `e17-o2-${suffix}@example.com`);
    const admin = await register(app, `e17-a2-${suffix}@example.com`);

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ name: `E17 Team2 ${suffix}`, type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ user_id: admin.user.id, role: "admin" }),
    });

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ title: "E17 conv2", space_id: spaceId }),
    });
    expect(convRes.status).toBe(201);
    const conversationId = (await convRes.json()).data.id as string;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: `E17 High2 ${suffix}`,
        description: "high",
        agent_type: "execution",
        source_url: "mock://e17-high2",
        capabilities: [{ name: "high-op", risk_level: "high" }],
      }),
    });
    const agentId = (await agentRes.json()).data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const secret = "FULL_TEXT_VISIBLE_TO_ADMIN_E17_XYZ";
    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${owner.access_token}`,
      },
      body: JSON.stringify({ sender_id: owner.user.id, text: secret }),
    });
    expect(msgRes.status).toBe(202);
    const invId = ((await msgRes.json()) as { meta: { invocation_id: string } }).meta.invocation_id;

    const res = await app.request(`/api/v1/invocations/${invId}`, {
      headers: { Authorization: `Bearer ${admin.access_token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        user_text: string;
        visibility_role: string;
        trust_decision?: { decision?: string };
      };
    };
    expect(body.data.visibility_role).toBe("space_admin");
    expect(body.data.user_text).toBe(secret);
    expect(body.data.trust_decision).toBeDefined();
    expect(body.data.trust_decision?.decision).toBe("need_confirmation");
  });

  it("developer sees [redacted] user_text and stats for own agent", async () => {
    const app = createApp();
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const consumer = await register(app, `e17-c3-${suffix}@example.com`);
    const provider = await register(app, `e17-p3-${suffix}@example.com`, "provider");

    const regAgent = await app.request("/api/v1/agents/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${provider.access_token}`,
      },
      body: JSON.stringify({
        name: `E17 Prov Agent ${suffix}`,
        description: "owned by provider",
        agent_type: "execution",
        source_url: "mock://e17-prov",
        capabilities: [{ name: "high-op", risk_level: "high" }],
      }),
    });
    expect(regAgent.status).toBe(201);
    const agentId = (await regAgent.json()).data.id as string;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${consumer.access_token}`,
      },
      body: JSON.stringify({ title: "E17 conv3" }),
    });
    expect(convRes.status).toBe(201);
    const conversationId = (await convRes.json()).data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const secret = "USER_SECRET_FOR_DEVELOPER_REDACT_E17";
    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${consumer.access_token}`,
      },
      body: JSON.stringify({ sender_id: consumer.user.id, text: secret }),
    });
    expect(msgRes.status).toBe(202);
    const invId = ((await msgRes.json()) as { meta: { invocation_id: string } }).meta.invocation_id;

    const res = await app.request(`/api/v1/invocations/${invId}`, {
      headers: { Authorization: `Bearer ${provider.access_token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: {
        user_text: string;
        user_text_redacted: boolean;
        visibility_role: string;
        developer_invocation_stats?: { count_last_30d: number };
      };
    };
    expect(body.data.visibility_role).toBe("developer");
    expect(body.data.user_text).toBe("[redacted]");
    expect(body.data.user_text_redacted).toBe(true);
    expect(body.data.developer_invocation_stats?.count_last_30d).toBeGreaterThanOrEqual(1);
  });

  it("data retention dry-run returns candidate counts per table", async () => {
    const { results } = await runDataRetentionArchivalAsync({ dryRun: true });
    expect(results.length).toBeGreaterThanOrEqual(6);
    for (const r of results) {
      expect(typeof r.candidate_count).toBe("number");
      expect(r.updated_count).toBe(0);
    }
  });
});
