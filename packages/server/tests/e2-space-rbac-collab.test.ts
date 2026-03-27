/**
 * E-2 V1.3: Space RBAC, invite/join, scoped conversations, guest restrictions, audit.
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
  return (await res.json()).data as {
    access_token: string;
    user: { id: string; email: string };
  };
}

describe("E-2 Space / RBAC / multi-user conversations", () => {
  it("invite → join → Space conversation → both users exchange messages", async () => {
    const app = createApp();
    const a = await register(app, "e2-a-collab@example.com");
    const b = await register(app, "e2-b-collab@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "E2 Team", type: "team" }),
    });
    expect(teamRes.status).toBe(201);
    const spaceId = (await teamRes.json()).data.id as string;

    const invRes = await app.request(`/api/v1/spaces/${spaceId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ preset_role: "member", ttl_hours: 24 }),
    });
    expect(invRes.status).toBe(201);
    const token = (await invRes.json()).data.token as string;

    const joinRes = await app.request("/api/v1/spaces/join", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${b.access_token}` },
      body: JSON.stringify({ token }),
    });
    expect(joinRes.status).toBe(200);

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ title: "E2 thread", space_id: spaceId }),
    });
    expect(convRes.status).toBe(201);
    const convId = (await convRes.json()).data.id as string;

    const partRes = await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ user_id: b.user.id, role: "member" }),
    });
    expect(partRes.status).toBe(201);

    const m1 = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${a.access_token}`,
      },
      body: JSON.stringify({ sender_id: a.user.id, text: "hello from A" }),
    });
    expect(m1.status).toBe(201);

    const m2 = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${b.access_token}`,
      },
      body: JSON.stringify({ sender_id: b.user.id, text: "hi from B" }),
    });
    expect(m2.status).toBe(201);

    const gA = await app.request(`/api/v1/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${a.access_token}` },
    });
    const gB = await app.request(`/api/v1/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${b.access_token}` },
    });
    expect(gA.status).toBe(200);
    expect(gB.status).toBe(200);
    const dataA = (await gA.json()).data as unknown[];
    const dataB = (await gB.json()).data as unknown[];
    expect(dataA.length).toBeGreaterThanOrEqual(3);
    expect(dataB.length).toBe(dataA.length);
  });

  it("guest cannot create Space invitations (403 + human message)", async () => {
    const app = createApp();
    const owner = await register(app, "e2-owner-guest@example.com");
    const guest = await register(app, "e2-guest-user@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ name: "Guest Matrix", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    await app.request(`/api/v1/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${owner.access_token}` },
      body: JSON.stringify({ user_id: guest.user.id, role: "guest" }),
    });

    const invAttempt = await app.request(`/api/v1/spaces/${spaceId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${guest.access_token}` },
      body: JSON.stringify({ preset_role: "member" }),
    });
    expect(invAttempt.status).toBe(403);
    const body = await invAttempt.json();
    expect(String(body.error?.message)).toContain("邀请");
  });

  it("non–Space member cannot access Space-bound conversation", async () => {
    const app = createApp();
    const a = await register(app, "e2-a-iso@example.com");
    const e = await register(app, "e2-e-out@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "Iso Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ title: "Secret", space_id: spaceId }),
    });
    const convId = (await convRes.json()).data.id as string;

    const peek = await app.request(`/api/v1/conversations/${convId}`, {
      headers: { Authorization: `Bearer ${e.access_token}` },
    });
    expect(peek.status).toBe(403);
  });

  it("audit records space.member_joined after token join", async () => {
    const app = createApp();
    const a = await register(app, "e2-audit-a@example.com");
    const b = await register(app, "e2-audit-b@example.com");

    const teamRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ name: "Audit Team", type: "team" }),
    });
    const spaceId = (await teamRes.json()).data.id as string;

    const invRes = await app.request(`/api/v1/spaces/${spaceId}/invitations`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${a.access_token}` },
      body: JSON.stringify({ preset_role: "member" }),
    });
    const token = (await invRes.json()).data.token as string;

    await app.request("/api/v1/spaces/join", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${b.access_token}` },
      body: JSON.stringify({ token }),
    });

    const aud = await app.request("/api/v1/audit-events?event_type=space.member_joined&limit=50");
    expect(aud.status).toBe(200);
    const events = (await aud.json()).data as { event_type: string; actor_id: string; payload: unknown }[];
    const joined = events.filter(
      (ev) => ev.event_type === "space.member_joined" && ev.actor_id === b.user.id,
    );
    expect(joined.length).toBeGreaterThanOrEqual(1);
  });
});
