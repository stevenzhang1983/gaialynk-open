/**
 * E-1 V1.3: Spaces bootstrap + JWT-backed ACTOR_CONTEXT + Space APIs
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("E-1 spaces and JWT actor", () => {
  it("after register, GET /api/v1/spaces with Bearer returns at least one personal space", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e1-spaces@example.com", password: "password123" }),
    });
    expect(reg.status).toBe(201);
    const { access_token } = (await reg.json()).data;
    const res = await app.request("/api/v1/spaces", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    const personal = body.data.find((s: { type: string }) => s.type === "personal");
    expect(personal).toBeDefined();
    expect(personal.name).toBe("Personal");
  });

  it("GET /api/v1/me works with Bearer JWT without X-Actor-Id", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e1-me@example.com", password: "password123" }),
    });
    const { access_token, user } = (await reg.json()).data;
    const res = await app.request("/api/v1/me", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.actor.id).toBe(user.id);
    expect(body.data.actor.role).toBe("consumer");
  });

  it("POST /api/v1/spaces creates team space; owner can add member", async () => {
    const app = createApp();
    const regA = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e1-owner@example.com", password: "password123" }),
    });
    const regB = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "e1-member@example.com", password: "password123" }),
    });
    const tokenA = (await regA.json()).data.access_token;
    const userB = (await regB.json()).data.user;

    const createRes = await app.request("/api/v1/spaces", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: "Team Alpha", type: "team" }),
    });
    expect(createRes.status).toBe(201);
    const teamId = (await createRes.json()).data.id;

    const addRes = await app.request(`/api/v1/spaces/${teamId}/members`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ user_id: userB.id, role: "member" }),
    });
    expect(addRes.status).toBe(201);

    const listRes = await app.request(`/api/v1/spaces/${teamId}/members`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    expect(listRes.status).toBe(200);
    const members = (await listRes.json()).data;
    expect(members.some((m: { user_id: string }) => m.user_id === userB.id)).toBe(true);
  });
});
