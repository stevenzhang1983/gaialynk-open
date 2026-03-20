/**
 * T-5.3 用户认证 API 验收测试
 * CTO-Execution-Directive-v1 §5
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("T-5.3 Auth API", () => {
  it("POST /api/v1/auth/register creates user and returns tokens", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "user@example.com", password: "password123" }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()).data;
    expect(data.access_token).toBeDefined();
    expect(data.refresh_token).toBeDefined();
    expect(data.expires_in).toBeGreaterThan(0);
    expect(data.user).toEqual({ id: expect.any(String), email: "user@example.com", role: "consumer" });
  });

  it("POST /api/v1/auth/register with role returns that role", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "provider@example.com", password: "password123", role: "provider" }),
    });
    expect(res.status).toBe(201);
    const data = (await res.json()).data;
    expect(data.user.role).toBe("provider");
  });

  it("POST /api/v1/auth/register rejects duplicate email", async () => {
    const app = createApp();
    await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "dup@example.com", password: "password123" }),
    });
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "dup@example.com", password: "anotherpass123" }),
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error?.code).toBe("email_taken");
  });

  it("POST /api/v1/auth/login returns tokens for valid credentials", async () => {
    const app = createApp();
    await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "login@example.com", password: "secret123" }),
    });
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "login@example.com", password: "secret123" }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()).data;
    expect(data.access_token).toBeDefined();
    expect(data.refresh_token).toBeDefined();
    expect(data.user.email).toBe("login@example.com");
  });

  it("POST /api/v1/auth/login rejects invalid password", async () => {
    const app = createApp();
    await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wrong@example.com", password: "correct" }),
    });
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "wrong@example.com", password: "wrong" }),
    });
    expect(res.status).toBe(401);
    expect((await res.json()).error?.code).toBe("invalid_credentials");
  });

  it("POST /api/v1/auth/refresh returns new tokens", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "refresh@example.com", password: "password123" }),
    });
    const regBody = await reg.json();
    const refreshToken = regBody.data.refresh_token;
    const firstAccessToken = regBody.data.access_token;
    const res = await app.request("/api/v1/auth/refresh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    expect(res.status).toBe(200);
    const data = (await res.json()).data;
    expect(data.access_token).toBeDefined();
    expect(data.refresh_token).toBeDefined();
  });

  it("GET /api/v1/auth/me returns current user with Bearer token", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "me@example.com", password: "password123" }),
    });
    const accessToken = (await reg.json()).data.access_token;
    const res = await app.request("/api/v1/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const data = (await res.json()).data;
    expect(data.email).toBe("me@example.com");
    expect(data.role).toBe("consumer");
    expect(data.id).toBeDefined();
  });

  it("GET /api/v1/auth/me rejects without Bearer", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/auth/me");
    expect(res.status).toBe(401);
  });

  it("PUT /api/v1/auth/me/role updates role", async () => {
    const app = createApp();
    const reg = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "role@example.com", password: "password123", role: "consumer" }),
    });
    const accessToken = (await reg.json()).data.access_token;
    const putRes = await app.request("/api/v1/auth/me/role", {
      method: "PUT",
      headers: { "content-type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ role: "provider" }),
    });
    expect(putRes.status).toBe(200);
    expect((await putRes.json()).data.role).toBe("provider");
    const meRes = await app.request("/api/v1/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } });
    expect((await meRes.json()).data.role).toBe("provider");
  });

  it("GET /api/v1/auth/oauth/github returns redirect or 503 when not configured", async () => {
    const app = createApp();
    const res = await app.request("/api/v1/auth/oauth/github");
    if (res.status === 302) {
      expect(res.headers.get("location")).toContain("github.com");
    } else {
      expect(res.status).toBe(503);
    }
  });
});
