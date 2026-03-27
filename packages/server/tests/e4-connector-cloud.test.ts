/**
 * E-4 V1.3 / V1.3.1: cloud connectors (Google Calendar, Notion), uploads, external receipts.
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { insertCloudSaasConnectorAuthorizationAsync } from "../src/modules/connectors/connector.store";

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  expect(res.status).toBe(201);
  return (await res.json()).data as { access_token: string; user: { id: string } };
}

describe("E-4 cloud connectors & file upload", () => {
  it("Google Calendar list-events creates external receipt and returns stub events", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e4-cal@example.com");
    const authRow = await insertCloudSaasConnectorAuthorizationAsync({
      userId: user.id,
      connector: "google_calendar",
      provider: "google_calendar",
      scopeLevel: "application",
      scopeValue: "google_calendar.read",
      accessToken: "test-access",
      refreshToken: "test-refresh",
      oauthExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });

    const listRes = await app.request("/api/v1/connectors/cloud/google-calendar/actions/list-events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ authorization_id: authRow.id, max_results: 5 }),
    });
    expect(listRes.status).toBe(200);
    const body = (await listRes.json()) as { data: { events: unknown[]; receipt_id: string } };
    expect(body.data.events.length).toBeGreaterThan(0);
    expect(body.data.receipt_id).toMatch(/^[0-9a-f-]{36}$/i);

    const recRes = await app.request(`/api/v1/connectors/external-action-receipts/${body.data.receipt_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(recRes.status).toBe(200);
  });

  it("revoked Google Calendar authorization returns 409 on list-events", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e4-cal-revoke@example.com");
    const authRow = await insertCloudSaasConnectorAuthorizationAsync({
      userId: user.id,
      connector: "google_calendar",
      provider: "google_calendar",
      scopeLevel: "application",
      scopeValue: "google_calendar.read",
      accessToken: "x",
      refreshToken: "y",
      oauthExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    const rev = await app.request(`/api/v1/connectors/authorizations/${authRow.id}/revoke`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ actor_id: user.id }),
    });
    expect(rev.status).toBe(200);

    const listRes = await app.request("/api/v1/connectors/cloud/google-calendar/actions/list-events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ authorization_id: authRow.id }),
    });
    expect(listRes.status).toBe(409);
    const err = (await listRes.json()) as { error: { code: string } };
    expect(err.error.code).toBe("authorization_revoked");
  });

  it("Notion search returns receipt in stub mode", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e4-notion@example.com");
    const authRow = await insertCloudSaasConnectorAuthorizationAsync({
      userId: user.id,
      connector: "notion",
      provider: "notion",
      scopeLevel: "application",
      scopeValue: "notion.workspace",
      accessToken: "notion-access",
      refreshToken: null,
      oauthExpiresAt: null,
    });
    const res = await app.request("/api/v1/connectors/cloud/notion/actions/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ authorization_id: authRow.id, query: "test" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { receipt_id: string; count: number } };
    expect(body.data.count).toBeGreaterThanOrEqual(1);
    expect(body.data.receipt_id).toBeTruthy();
  });

  it("file upload then message with file_ref reaches mock agent with excerpt", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e4-file@example.com");

    const form = new FormData();
    form.append("file", new Blob([`ingredient note: vanilla flavoring for the cake`], { type: "text/plain" }), "recipe.txt");
    const up = await app.request("/api/v1/connectors/file-upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${access_token}` },
      body: form,
    });
    expect(up.status).toBe(201);
    const fileRef = ((await up.json()) as { data: { file_ref_id: string } }).data.file_ref_id;

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ title: "E4 file" }),
    });
    expect(convRes.status).toBe(201);
    const convId = ((await convRes.json()) as { data: { id: string } }).data.id;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E4 Mock",
        description: "mock",
        agent_type: "execution",
        source_url: "mock://e4-file",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${convId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    await app.request(`/api/v1/conversations/${convId}/participants`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${access_token}` },
      body: JSON.stringify({ user_id: user.id, role: "member" }),
    });

    const msgRes = await app.request(`/api/v1/conversations/${convId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: user.id,
        text: "read my file",
        file_ref_id: fileRef,
      }),
    });
    expect(msgRes.status).toBe(201);
    const msgBody = (await msgRes.json()) as { meta?: { receipt_id?: string } };
    expect(msgBody.meta?.receipt_id).toBeTruthy();

    const listMsg = await app.request(`/api/v1/conversations/${convId}/messages`);
    expect(listMsg.status).toBe(200);
    const msgs = ((await listMsg.json()) as { data: Array<{ content: { text?: string } }> }).data;
    const agentReply = msgs.find((m) => m.content.text?.includes("vanilla flavoring"));
    expect(agentReply).toBeTruthy();
  });
});
