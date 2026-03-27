/**
 * E-4 / E-13: Notion cloud connector — OAuth token exchange + Search / list DB / query / create page.
 */

import {
  stubCreatePage,
  stubListDatabases,
  stubQueryDatabase,
  stubSearch,
} from "./notion.mock";

const NOTION_API = "https://api.notion.com";
const NOTION_VERSION = "2022-06-28";

export function notionOAuthRedirectUri(): string {
  return (
    process.env.NOTION_OAUTH_REDIRECT_URI?.trim() ||
    "http://localhost:3000/api/v1/connectors/cloud/oauth/callback/notion"
  );
}

function clientId(): string | undefined {
  return process.env.NOTION_CLIENT_ID?.trim();
}

function clientSecret(): string | undefined {
  return process.env.NOTION_CLIENT_SECRET?.trim();
}

/** CI / local mock: explicit NOTION_MOCK, global cloud stub, or Vitest. */
export function isNotionStubMode(): boolean {
  return (
    process.env.NOTION_MOCK === "true" ||
    process.env.CONNECTOR_CLOUD_STUB === "1" ||
    process.env.VITEST === "true"
  );
}

export class NotionProviderError extends Error {
  constructor(
    message: string,
    public readonly httpStatus: number,
    public readonly responseBodySnippet?: string,
  ) {
    super(message);
    this.name = "NotionProviderError";
  }
}

export interface NotionTokenResponse {
  access_token: string;
  workspace_id?: string;
  workspace_name?: string;
  bot_id?: string;
}

export async function exchangeNotionAuthorizationCode(code: string): Promise<NotionTokenResponse> {
  if (isNotionStubMode()) {
    return {
      access_token: "stub-notion-access",
      workspace_id: "stub-ws",
      workspace_name: "Stub Workspace",
      bot_id: "stub-bot",
    };
  }
  const cid = clientId();
  const sec = clientSecret();
  if (!cid || !sec) {
    throw new Error("NOTION_CLIENT_ID/SECRET not configured");
  }
  const credentials = Buffer.from(`${cid}:${sec}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: notionOAuthRedirectUri(),
  });
  const res = await fetch(`${NOTION_API}/v1/oauth/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
      "Notion-Version": NOTION_VERSION,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`notion_token_exchange_failed: ${res.status} ${t.slice(0, 200)}`);
  }
  return (await res.json()) as NotionTokenResponse;
}

async function notionPost<T>(accessToken: string, path: string, jsonBody: unknown): Promise<T> {
  const res = await fetch(`${NOTION_API}${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify(jsonBody),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new NotionProviderError(
      `notion_api_failed: ${path} ${res.status}`,
      res.status,
      text.slice(0, 400),
    );
  }
  return JSON.parse(text) as T;
}

async function notionGet<T>(accessToken: string, path: string): Promise<T> {
  const res = await fetch(`${NOTION_API}${path}`, {
    method: "GET",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new NotionProviderError(
      `notion_api_failed: ${path} ${res.status}`,
      res.status,
      text.slice(0, 400),
    );
  }
  return JSON.parse(text) as T;
}

/** Resolve database title for connector receipt UI (W-17). */
export async function notionGetDatabaseTitle(accessToken: string, databaseId: string): Promise<string> {
  if (isNotionStubMode()) {
    return "Stub database";
  }
  const data = await notionGet<{ title?: unknown }>(accessToken, `/v1/databases/${databaseId}`);
  const t = plainFromRichText(data.title);
  return t || databaseId.slice(0, 8) + "…";
}

function plainFromRichText(title: unknown): string {
  if (!Array.isArray(title)) return "";
  const parts: string[] = [];
  for (const block of title) {
    if (block && typeof block === "object" && "plain_text" in block) {
      const pt = (block as { plain_text?: string }).plain_text;
      if (typeof pt === "string") parts.push(pt);
    }
  }
  return parts.join("").trim() || "Untitled";
}

function titleFromSearchResult(row: Record<string, unknown>): string {
  if (row.object === "database") {
    return plainFromRichText(row.title);
  }
  if (row.object === "page" && row.properties && typeof row.properties === "object") {
    const props = row.properties as Record<string, { type?: string; title?: unknown }>;
    for (const v of Object.values(props)) {
      if (v?.type === "title" && v.title) {
        return plainFromRichText(v.title);
      }
    }
  }
  return String(row.object ?? "item");
}

export async function notionListDatabases(
  accessToken: string,
): Promise<{ databases: Array<{ id: string; title: string }>; raw_count: number }> {
  if (isNotionStubMode()) {
    return stubListDatabases();
  }
  const data = await notionPost<{
    results?: Array<Record<string, unknown> & { id?: string }>;
  }>(accessToken, "/v1/search", {
    filter: { property: "object", value: "database" },
    page_size: 100,
  });
  const results = data.results ?? [];
  const databases = results
    .filter((r) => r.object === "database" && typeof r.id === "string")
    .map((r) => ({ id: r.id as string, title: titleFromSearchResult(r) }));
  return { databases, raw_count: databases.length };
}

export async function notionQueryDatabase(
  accessToken: string,
  databaseId: string,
  opts?: { filter?: unknown; sorts?: unknown[]; page_size?: number },
): Promise<{ result_count: number; has_more: boolean }> {
  if (isNotionStubMode()) {
    return stubQueryDatabase();
  }
  const body: Record<string, unknown> = {};
  if (opts?.filter !== undefined) body.filter = opts.filter;
  if (opts?.sorts !== undefined) body.sorts = opts.sorts;
  if (opts?.page_size !== undefined) body.page_size = opts.page_size;
  const data = await notionPost<{ results?: unknown[]; has_more?: boolean }>(
    accessToken,
    `/v1/databases/${databaseId}/query`,
    body,
  );
  return { result_count: (data.results ?? []).length, has_more: Boolean(data.has_more) };
}

export async function notionCreatePage(
  accessToken: string,
  parentDatabaseId: string,
  properties: Record<string, unknown>,
): Promise<{ page_id: string; url: string }> {
  if (isNotionStubMode()) {
    return stubCreatePage();
  }
  const data = await notionPost<{ id?: string; url?: string }>(accessToken, "/v1/pages", {
    parent: { database_id: parentDatabaseId },
    properties,
  });
  if (!data.id) {
    throw new NotionProviderError("notion_create_page_missing_id", 502);
  }
  return { page_id: data.id, url: data.url ?? "" };
}

export async function notionSearch(
  accessToken: string,
  query?: string,
): Promise<{ count: number; titles: string[] }> {
  if (isNotionStubMode()) {
    return stubSearch();
  }
  const data = await notionPost<{ results?: Array<Record<string, unknown>> }>(accessToken, "/v1/search", {
    query: query ?? "",
    page_size: 10,
  });
  const results = data.results ?? [];
  return {
    count: results.length,
    titles: results.map((r) => titleFromSearchResult(r)),
  };
}
