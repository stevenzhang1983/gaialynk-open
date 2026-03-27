/**
 * E-13 V1.3.1: Notion connector list / query / create + receipts; connector_expired on 401.
 */
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app";
import {
  getConnectorAuthorizationByIdAsync,
  insertCloudSaasConnectorAuthorizationAsync,
} from "../src/modules/connectors/connector.store";
import { STUB_DATABASE_ID } from "../src/modules/connectors/cloud-proxy/notion.mock";

async function register(app: ReturnType<typeof createApp>, email: string) {
  const res = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  expect(res.status).toBe(201);
  return (await res.json()).data as { access_token: string; user: { id: string } };
}

describe("E-13 Notion connector", () => {
  it("list-databases returns stub databases and receipt", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e13-notion-list@example.com");
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
    const res = await app.request("/api/v1/connectors/cloud/notion/actions/list-databases", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({ authorization_id: authRow.id }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      data: { databases: Array<{ id: string; title: string }>; receipt_id: string; raw_count: number };
    };
    expect(body.data.raw_count).toBeGreaterThanOrEqual(1);
    expect(body.data.databases[0]?.id).toBe(STUB_DATABASE_ID);
    expect(body.data.receipt_id).toMatch(/^[0-9a-f-]{36}$/i);

    const recRes = await app.request(`/api/v1/connectors/external-action-receipts/${body.data.receipt_id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    expect(recRes.status).toBe(200);
    const rec = (await recRes.json()) as { data: { action: string; response_summary: Record<string, unknown> } };
    expect(rec.data.action).toBe("notion.list_databases");
    expect(rec.data.response_summary.provider).toBe("notion");
  });

  it("query database and create page return receipts (stub)", async () => {
    const app = createApp();
    const { access_token, user } = await register(app, "e13-notion-query@example.com");
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
    const q = await app.request(
      `/api/v1/connectors/cloud/notion/databases/${STUB_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ authorization_id: authRow.id }),
      },
    );
    expect(q.status).toBe(200);
    const qBody = (await q.json()) as { data: { receipt_id: string; result_count: number } };
    expect(qBody.data.result_count).toBe(0);

    const p = await app.request("/api/v1/connectors/cloud/notion/pages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        authorization_id: authRow.id,
        database_id: STUB_DATABASE_ID,
        properties: { Name: { title: [{ text: { content: "E13 stub row" } }] } },
      }),
    });
    expect(p.status).toBe(200);
    const pBody = (await p.json()) as { data: { receipt_id: string; page_id: string } };
    expect(pBody.data.page_id).toBeTruthy();
  });

  it("Notion API 401 revokes authorization and returns connector_expired", async () => {
    const originalFetch = globalThis.fetch;
    vi.stubEnv("VITEST", "");
    vi.stubEnv("NOTION_MOCK", "");
    vi.stubEnv("CONNECTOR_CLOUD_STUB", "");
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : (input as Request).url;
      if (url.includes("api.notion.com")) {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
      return originalFetch(input, init);
    }) as typeof fetch;

    try {
      const app = createApp();
      const { access_token, user } = await register(app, "e13-notion-401@example.com");
      const authRow = await insertCloudSaasConnectorAuthorizationAsync({
        userId: user.id,
        connector: "notion",
        provider: "notion",
        scopeLevel: "application",
        scopeValue: "notion.workspace",
        accessToken: "real-looking-token",
        refreshToken: null,
        oauthExpiresAt: null,
      });
      const res = await app.request("/api/v1/connectors/cloud/notion/actions/list-databases", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ authorization_id: authRow.id }),
      });
      expect(res.status).toBe(401);
      const err = (await res.json()) as { error: { code: string }; meta?: { receipt_id: string } };
      expect(err.error.code).toBe("connector_expired");
      expect(err.meta?.receipt_id).toMatch(/^[0-9a-f-]{36}$/i);

      const authAfter = await getConnectorAuthorizationByIdAsync(authRow.id);
      expect(authAfter?.status).toBe("revoked");
    } finally {
      globalThis.fetch = originalFetch;
      vi.unstubAllEnvs();
    }
  });
});
