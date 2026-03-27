/**
 * E-11 V1.3.1: RBAC 全量挂载、成员展示字段、Agent 代邀请策略与审计。
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { listAuditEventsAsync } from "../src/modules/audit/audit.store";

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  expect(res.status).toBe(201);
  return (await res.json()).data as {
    access_token: string;
    user: { id: string; email: string };
  };
}

describe("E-11 RBAC full binding + identity", () => {
  const prevTrust = process.env.ACTOR_TRUST_TOKEN;

  beforeEach(() => {
    process.env.ACTOR_TRUST_TOKEN = "e11-test-trust";
  });

  afterEach(() => {
    process.env.ACTOR_TRUST_TOKEN = prevTrust;
  });

  it("guest cannot trigger_connector when space_id is supplied (403 + reason_code)", async () => {
    const app = createApp();
    const owner = await register(app, "e11-owner-conn@example.com");
    const guest = await register(app, "e11-guest-conn@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ name: "E11 Conn Team", type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ user_id: guest.user.id, role: "guest" }),
    });

    const authRes = await app.request("/api/v1/connectors/authorizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: guest.user.id,
        connector: "notion",
        scope_level: "action",
        scope_value: "notion.pages.delete",
        expires_in_sec: 3600,
      }),
    });
    expect(authRes.status).toBe(201);
    const authorizationId = ((await authRes.json()) as { data: { id: string } }).data.id;

    const execRes = await app.request("/api/v1/connectors/local-actions/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        authorization_id: authorizationId,
        action: "notion.pages.delete",
        risk_level: "high",
        confirmed: true,
        space_id: spaceId,
      }),
    });
    expect(execRes.status).toBe(403);
    const body = (await execRes.json()) as {
      error: { code: string; message: string; details?: { reason_code?: string } };
    };
    expect(body.error.code).toBe("forbidden");
    expect(body.error.details?.reason_code).toBe("space_rbac_trigger_connector");
    expect(body.error.message).toContain("guest");
  });

  it("member cannot export_audit when Bearer + space_id (403)", async () => {
    const app = createApp();
    const owner = await register(app, "e11-owner-audit@example.com");
    const member = await register(app, "e11-member-audit@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ name: "E11 Audit Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ user_id: member.user.id, role: "member" }),
    });

    const res = await app.request(
      `/api/v1/audit-events?space_id=${encodeURIComponent(spaceId)}&limit=5`,
      { headers: { Authorization: `Bearer ${member.access_token}` } },
    );
    expect(res.status).toBe(403);
    const body = (await res.json()) as {
      error: { details?: { reason_code?: string }; message: string };
    };
    expect(body.error.details?.reason_code).toBe("space_rbac_export_audit");
  });

  it("Agent actor invite without delegating owner/admin → 403 + agent.invitation_denied_policy audit", async () => {
    const app = createApp();
    const owner = await register(app, "e11-owner-agent@example.com");
    const member = await register(app, "e11-member-agent@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ name: "E11 Agent Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ user_id: member.user.id, role: "member" }),
    });

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ title: "E11 agent chain", space_id: spaceId }),
    });
    const convId = (await convRes.json()).data.id as string;

    const agent1Res = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E11 Agent One",
        description: "a1",
        agent_type: "execution",
        source_url: "mock://e11-a1",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const agent2Res = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E11 Agent Two",
        description: "a2",
        agent_type: "execution",
        source_url: "mock://e11-a2",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const agent1Id = (await agent1Res.json()).data.id as string;
    const agent2Id = (await agent2Res.json()).data.id as string;

    const add1 = await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ agent_id: agent1Id }),
    });
    expect(add1.status).toBe(201);

    const inviteRes = await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Actor-Id": agent1Id,
        "X-Actor-Type": "agent",
        "X-Actor-Trust-Token": "e11-test-trust",
      },
      body: JSON.stringify({
        agent_id: agent2Id,
        delegating_user_id: member.user.id,
      }),
    });
    expect(inviteRes.status).toBe(403);

    const auditPage = await listAuditEventsAsync({ eventType: "agent.invitation_denied_policy", limit: 20 });
    const hit = auditPage.data.find(
      (e) =>
        e.event_type === "agent.invitation_denied_policy" &&
        (e.payload as { delegating_user_id?: string }).delegating_user_id === member.user.id,
    );
    expect(hit).toBeDefined();
  });

  it("owner can DELETE /api/v1/spaces/:id/members/:userId for a guest", async () => {
    const app = createApp();
    const owner = await register(app, "e11-owner-del@example.com");
    const guest = await register(app, "e11-guest-del@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ name: "E11 Del Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ user_id: guest.user.id, role: "guest" }),
    });

    const delRes = await app.request(`/api/v1/spaces/${spaceId}/members/${guest.user.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${owner.access_token}` },
    });
    expect(delRes.status).toBe(200);

    const listRes = await app.request(`/api/v1/spaces/${spaceId}/members`, {
      headers: { Authorization: `Bearer ${owner.access_token}` },
    });
    const rows = (await listRes.json()).data as { user_id: string }[];
    expect(rows.some((r) => r.user_id === guest.user.id)).toBe(false);
  });

  it("GET /api/v1/spaces/:id/members returns display_name and email_masked", async () => {
    const app = createApp();
    const owner = await register(app, "e11-owner-memb@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ name: "E11 Mem Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    const memRes = await app.request(`/api/v1/spaces/${spaceId}/members`, {
      headers: { Authorization: `Bearer ${owner.access_token}` },
    });
    expect(memRes.status).toBe(200);
    const rows = (await memRes.json()).data as Array<{
      user_id: string;
      email_masked: string | null;
      display_name: string | null;
    }>;
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const self = rows.find((r) => r.user_id === owner.user.id);
    expect(self).toBeDefined();
    expect(self?.email_masked).toMatch(/\*\*\*@/);
    expect(self?.display_name === null || typeof self?.display_name === "string").toBe(true);
  });
});
