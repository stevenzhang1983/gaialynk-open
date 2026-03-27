import { createHash, randomUUID } from "node:crypto";
import type { Context, Hono } from "hono";
import { z } from "zod";
import { emitAuditEventAsync } from "../../audit/audit.store";
import { createAuthMeMiddleware, requireAuth } from "../../auth/auth.routes";
import {
  appendMessageAsync,
  conversationHasUserParticipantAsync,
  getConversationSummaryAsync,
} from "../../conversation/conversation.store";
import { publishConversationRealtime } from "../../conversation/conversation-realtime";
import { forbiddenUnlessSpaceRbac } from "../../spaces/rbac.middleware";
import { userIsMemberOfSpaceAsync } from "../../spaces/space.store";
import { getDeviceByIdAsync } from "../desktop/desktop-connector.store";
import { insertExternalActionReceiptAsync, getExternalActionReceiptByIdAsync } from "../external-action-receipt.store";
import { saveConnectorUploadAsync, buildUploadExcerptForAgentAsync } from "../connector-upload.store";
import {
  getConnectorAuthorizationByIdAsync,
  insertCloudSaasConnectorAuthorizationAsync,
  loadCloudOAuthTokensAsync,
  revokeConnectorAuthorizationAsync,
  updateCloudConnectorOAuthTokensAsync,
  type ConnectorAuthorization,
} from "../connector.store";
import { signOAuthState, verifyOAuthState } from "../oauth-state";
import { notifyConnectorOAuthExpiringSoonAsync } from "../../notifications/notification-triggers";
import { emitProductEventAsync } from "../../product-events/product-events.emit";
import {
  createPrimaryCalendarEvent,
  exchangeGoogleAuthorizationCode,
  googleCalendarReadScope,
  googleCalendarWriteScope,
  googleOAuthRedirectUri,
  isGoogleCalendarStubMode,
  listPrimaryCalendarEvents,
  refreshGoogleAccessToken,
} from "./google-calendar.adapter";
import {
  exchangeNotionAuthorizationCode,
  isNotionStubMode,
  NotionProviderError,
  notionCreatePage,
  notionGetDatabaseTitle,
  notionListDatabases,
  notionOAuthRedirectUri,
  notionQueryDatabase,
  notionSearch,
} from "./notion.adapter";

const GL_NOTION_RECEIPT_V1 = "gl_notion_receipt_v1";

function glNotionReceiptJson(payload: {
  receipt_id: string;
  action: string;
  status: "ok" | "error" | "connector_expired";
  target_label?: string;
}): string {
  return JSON.stringify({ v: 1, t: GL_NOTION_RECEIPT_V1, ...payload });
}

/** Website popup / return URL; supports `{locale}` placeholder (W-17). */
function buildConnectorOAuthSuccessRedirect(
  connector: string,
  authorizationId: string,
  locale: string | undefined,
): string | null {
  const template = process.env.CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL?.trim();
  if (!template) return null;
  const loc = locale?.trim() || "en";
  const urlStr = template.includes("{locale}") ? template.replace(/\{locale\}/g, loc) : template;
  try {
    const u = new URL(urlStr);
    u.searchParams.set("authorization_id", authorizationId);
    u.searchParams.set("connector", connector);
    return u.toString();
  } catch {
    return null;
  }
}

function requestHash(parts: unknown): string {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

async function ensureFreshGoogleAccessToken(
  auth: ConnectorAuthorization,
): Promise<{ accessToken: string } | { error: string }> {
  const tokens = await loadCloudOAuthTokensAsync(auth.id);
  if (!tokens) {
    return { error: "oauth_tokens_missing" };
  }
  const expMs = auth.oauth_expires_at ? Date.parse(auth.oauth_expires_at) : 0;
  const needsRefresh = !expMs || expMs < Date.now() + 60_000;
  if (!needsRefresh) {
    return { accessToken: tokens.accessToken };
  }
  if (!tokens.refreshToken) {
    return { error: "reauth_required" };
  }
  try {
    const refreshed = await refreshGoogleAccessToken(tokens.refreshToken);
    const oauthExpiresAt =
      refreshed.expires_in != null
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : null;
    await updateCloudConnectorOAuthTokensAsync(auth.id, {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? tokens.refreshToken,
      oauthExpiresAt,
    });
    return { accessToken: refreshed.access_token };
  } catch {
    return { error: "reauth_required" };
  }
}

function calendarScopeAllowsList(scopeValue: string): boolean {
  return scopeValue === "google_calendar.read" || scopeValue === "google_calendar.write";
}

function calendarScopeAllowsWrite(scopeValue: string): boolean {
  return scopeValue === "google_calendar.write";
}

async function appendConnectorSummaryToConversation(
  conversationId: string | undefined,
  userId: string,
  title: string,
  lines: string[],
): Promise<void> {
  if (!conversationId || lines.length === 0) return;
  const summary = await getConversationSummaryAsync(conversationId);
  if (!summary) return;
  if (summary.space_id) {
    const ok = await userIsMemberOfSpaceAsync(summary.space_id, userId);
    if (!ok) return;
  } else if (!(await conversationHasUserParticipantAsync(conversationId, userId))) {
    return;
  }
  const msg = await appendMessageAsync({
    conversationId,
    senderType: "system",
    senderId: "system",
    text: `${title}\n${lines.join("\n")}`,
  });
  if (msg) publishConversationRealtime(conversationId, msg);
}

const listEventsBodySchema = z.object({
  authorization_id: z.string().uuid(),
  max_results: z.number().int().min(1).max(50).optional(),
  conversation_id: z.string().uuid().optional(),
  space_id: z.string().uuid().optional(),
});

const createEventBodySchema = z.object({
  authorization_id: z.string().uuid(),
  summary: z.string().min(1).max(500),
  start_iso: z.string().min(1),
  conversation_id: z.string().uuid().optional(),
  space_id: z.string().uuid().optional(),
});

const notionSearchBodySchema = z.object({
  authorization_id: z.string().uuid(),
  query: z.string().max(200).optional(),
  conversation_id: z.string().uuid().optional(),
  space_id: z.string().uuid().optional(),
});

const notionBaseActionBodySchema = z.object({
  authorization_id: z.string().uuid(),
  conversation_id: z.string().uuid().optional(),
  space_id: z.string().uuid().optional(),
});

const notionQueryDatabaseBodySchema = notionBaseActionBodySchema.extend({
  filter: z.unknown().optional(),
  sorts: z.array(z.unknown()).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
});

const notionCreatePageBodySchema = notionBaseActionBodySchema.extend({
  database_id: z.string().min(1).max(128),
  properties: z.record(z.string(), z.unknown()),
});

async function prepareNotionCloudAction(
  c: Context,
  me: { userId: string },
  body: { authorization_id: string; conversation_id?: string; space_id?: string },
): Promise<
  | { ok: true; auth: ConnectorAuthorization; correlationId: string; accessToken: string }
  | { ok: false; response: Response }
> {
  const correlationId = c.req.header("X-Correlation-Id")?.trim() || randomUUID();
  const auth = await getConnectorAuthorizationByIdAsync(body.authorization_id);
  if (!auth || auth.user_id !== me.userId) {
    return {
      ok: false,
      response: c.json({ error: { code: "authorization_not_found", message: "Authorization not found" } }, 404),
    };
  }
  let notionSpaceId: string | null | undefined = body.space_id ?? null;
  if (!notionSpaceId && body.conversation_id) {
    const sum = await getConversationSummaryAsync(body.conversation_id);
    notionSpaceId = sum?.space_id ?? undefined;
  }
  if (notionSpaceId) {
    const notionDenied = await forbiddenUnlessSpaceRbac(c, notionSpaceId, me.userId, "trigger_connector");
    if (notionDenied) return { ok: false, response: notionDenied };
  }
  if (auth.status !== "active") {
    return {
      ok: false,
      response: c.json({ error: { code: "authorization_revoked", message: "Reconnect Notion" } }, 409),
    };
  }
  if (auth.connector !== "notion") {
    return {
      ok: false,
      response: c.json({ error: { code: "invalid_authorization", message: "Not a Notion authorization" } }, 400),
    };
  }
  const tokens = await loadCloudOAuthTokensAsync(auth.id);
  if (!tokens) {
    return {
      ok: false,
      response: c.json({ error: { code: "reauth_required", message: "Notion tokens missing" } }, 401),
    };
  }
  return { ok: true, auth, correlationId, accessToken: tokens.accessToken };
}

async function onNotionAdapterFailure(
  c: Context,
  e: unknown,
  ctx: {
    auth: ConnectorAuthorization;
    me: { userId: string };
    correlationId: string;
    action: string;
    requestHash: string;
    conversationId?: string;
  },
): Promise<Response> {
  if (e instanceof NotionProviderError && e.httpStatus === 401) {
    await revokeConnectorAuthorizationAsync(ctx.auth.id);
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: ctx.auth.id,
      action: ctx.action,
      requestHash: ctx.requestHash,
      responseStatus: 401,
      auditCorrelationId: ctx.correlationId,
      responseSummary: {
        provider: "notion",
        status: "connector_expired",
        action: ctx.action,
        detail: e.responseBodySnippet ?? "unauthorized",
      },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.failed",
      actorType: "user",
      actorId: ctx.me.userId,
      payload: {
        authorization_id: ctx.auth.id,
        action: ctx.action,
        receipt_id: receipt.id,
        reason: "connector_expired",
      },
      correlationId: ctx.correlationId,
    });
    await appendConnectorSummaryToConversation(ctx.conversationId, ctx.me.userId, "Notion", [
      "Notion 连接已失效或已被撤销。请在 设置 → 连接器 中重新授权 Notion。",
      glNotionReceiptJson({
        receipt_id: receipt.id,
        action: ctx.action,
        status: "connector_expired",
        target_label: "—",
      }),
    ]);
    return c.json(
      {
        error: {
          code: "connector_expired",
          message: "Notion authorization is no longer valid; please reconnect in Settings → Connectors",
        },
        meta: { receipt_id: receipt.id },
      },
      401,
    );
  }
  const status = e instanceof NotionProviderError ? e.httpStatus : 502;
  const receipt = await insertExternalActionReceiptAsync({
    connectorAuthorizationId: ctx.auth.id,
    action: ctx.action,
    requestHash: ctx.requestHash,
    responseStatus: status,
    auditCorrelationId: ctx.correlationId,
    responseSummary: {
      provider: "notion",
      status: "error",
      action: ctx.action,
      error: String(e),
    },
  });
  const httpStatus = status >= 400 && status < 600 ? status : 502;
  return c.json(
    { error: { code: "provider_error", message: String(e) }, meta: { receipt_id: receipt.id } },
    httpStatus as Parameters<typeof c.json>[1],
  );
}

export function registerCloudProxyRoutes(app: Hono): void {
  const authMw = createAuthMeMiddleware();

  app.get("/api/v1/connectors/cloud/google-calendar/oauth/start", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const mode = (c.req.query("scope_mode") as "read" | "write" | undefined) ?? "read";
    const cid = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
    if (!cid && !isGoogleCalendarStubMode()) {
      return c.json(
        { error: { code: "oauth_not_configured", message: "Google OAuth client id is not configured on server" } },
        503,
      );
    }
    const scope = mode === "write" ? googleCalendarWriteScope() : googleCalendarReadScope();
    const scopeValue = mode === "write" ? "google_calendar.write" : "google_calendar.read";
    const uiLocale = c.req.query("ui_locale")?.trim();
    const state = signOAuthState({
      userId: me.userId,
      provider: "google_calendar",
      nonce: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
      calendar_scope: mode,
      ui_locale: uiLocale || undefined,
    });
    const redirectUri = googleOAuthRedirectUri();
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", cid ?? "stub-client");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);
    return c.redirect(authUrl.toString(), 302);
  });

  app.get("/api/v1/connectors/cloud/oauth/callback/google-calendar", async (c) => {
    const code = c.req.query("code");
    const stateRaw = c.req.query("state");
    const err = c.req.query("error");
    if (err) {
      return c.json({ error: { code: "oauth_denied", message: `Provider error: ${err}` } }, 400);
    }
    if (!code || !stateRaw) {
      return c.json({ error: { code: "invalid_callback", message: "Missing code or state" } }, 400);
    }
    const state = verifyOAuthState(stateRaw);
    if (!state || state.provider !== "google_calendar") {
      return c.json({ error: { code: "invalid_state", message: "Invalid or expired OAuth state" } }, 400);
    }
    try {
      const tokens = await exchangeGoogleAuthorizationCode(code);
      const mode = state.calendar_scope ?? "read";
      const scopeValue = mode === "write" ? "google_calendar.write" : "google_calendar.read";
      const oauthExpiresAt =
        tokens.expires_in != null
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null;
      const row = await insertCloudSaasConnectorAuthorizationAsync({
        userId: state.userId,
        connector: "google_calendar",
        provider: "google_calendar",
        scopeLevel: "application",
        scopeValue,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        oauthExpiresAt,
      });
      await notifyConnectorOAuthExpiringSoonAsync({
        userId: state.userId,
        authorizationId: row.id,
        provider: "google_calendar",
        expiresAt: oauthExpiresAt,
      });
      void emitProductEventAsync({
        name: "connector.authorized",
        userId: state.userId,
        payload: { connector: "google_calendar", authorization_id: row.id },
      });
      const success = buildConnectorOAuthSuccessRedirect("google_calendar", row.id, state.ui_locale);
      if (success) {
        return c.redirect(success, 302);
      }
      return c.json({ data: { authorization_id: row.id, connector: "google_calendar", status: "connected" } }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "oauth_failed";
      return c.json({ error: { code: "oauth_exchange_failed", message: msg } }, 502);
    }
  });

  const handleNotionOAuthStart = async (c: Context) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const nid = process.env.NOTION_CLIENT_ID?.trim();
    if (!nid && !isNotionStubMode()) {
      return c.json(
        { error: { code: "oauth_not_configured", message: "Notion OAuth is not configured on server" } },
        503,
      );
    }
    const uiLocale = c.req.query("ui_locale")?.trim();
    const state = signOAuthState({
      userId: me.userId,
      provider: "notion",
      nonce: randomUUID(),
      exp: Math.floor(Date.now() / 1000) + 900,
      ui_locale: uiLocale || undefined,
    });
    const redirectUri = notionOAuthRedirectUri();
    const authUrl = new URL("https://api.notion.com/v1/oauth/authorize");
    authUrl.searchParams.set("client_id", nid ?? "stub-notion");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("owner", "user");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    return c.redirect(authUrl.toString(), 302);
  };
  app.get("/api/v1/connectors/cloud/notion/oauth/start", authMw, handleNotionOAuthStart);
  app.get("/api/v1/connectors/cloud/notion/authorize", authMw, handleNotionOAuthStart);

  const handleNotionOAuthCallback = async (c: Context) => {
    const code = c.req.query("code");
    const stateRaw = c.req.query("state");
    if (!code || !stateRaw) {
      return c.json({ error: { code: "invalid_callback", message: "Missing code or state" } }, 400);
    }
    const state = verifyOAuthState(stateRaw);
    if (!state || state.provider !== "notion") {
      return c.json({ error: { code: "invalid_state", message: "Invalid or expired OAuth state" } }, 400);
    }
    try {
      const tokens = await exchangeNotionAuthorizationCode(code);
      const row = await insertCloudSaasConnectorAuthorizationAsync({
        userId: state.userId,
        connector: "notion",
        provider: "notion",
        scopeLevel: "application",
        scopeValue: "notion.workspace",
        accessToken: tokens.access_token,
        refreshToken: null,
        oauthExpiresAt: null,
        oauthWorkspaceName: tokens.workspace_name ?? tokens.workspace_id ?? null,
      });
      void emitProductEventAsync({
        name: "connector.authorized",
        userId: state.userId,
        payload: { connector: "notion", authorization_id: row.id },
      });
      const success = buildConnectorOAuthSuccessRedirect("notion", row.id, state.ui_locale);
      if (success) {
        return c.redirect(success, 302);
      }
      return c.json({ data: { authorization_id: row.id, connector: "notion", status: "connected" } }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "oauth_failed";
      return c.json({ error: { code: "oauth_exchange_failed", message: msg } }, 502);
    }
  };
  app.get("/api/v1/connectors/cloud/oauth/callback/notion", handleNotionOAuthCallback);
  app.get("/api/v1/connectors/cloud/notion/callback", handleNotionOAuthCallback);

  app.post("/api/v1/connectors/cloud/google-calendar/actions/list-events", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const body = listEventsBodySchema.parse(await c.req.json());
    const correlationId = c.req.header("X-Correlation-Id")?.trim() || randomUUID();
    const auth = await getConnectorAuthorizationByIdAsync(body.authorization_id);
    if (!auth || auth.user_id !== me.userId) {
      return c.json({ error: { code: "authorization_not_found", message: "Authorization not found" } }, 404);
    }
    let calSpaceId: string | null | undefined = body.space_id ?? null;
    if (!calSpaceId && body.conversation_id) {
      const sum = await getConversationSummaryAsync(body.conversation_id);
      calSpaceId = sum?.space_id ?? undefined;
    }
    if (calSpaceId) {
      const rbacDenied = await forbiddenUnlessSpaceRbac(c, calSpaceId, me.userId, "trigger_connector");
      if (rbacDenied) return rbacDenied;
    }
    if (auth.status !== "active") {
      return c.json({ error: { code: "authorization_revoked", message: "Reconnect Google Calendar" } }, 409);
    }
    if (auth.connector !== "google_calendar" || auth.connector_type !== "cloud_saas") {
      return c.json({ error: { code: "invalid_authorization", message: "Not a Google Calendar cloud authorization" } }, 400);
    }
    if (!calendarScopeAllowsList(auth.scope_value)) {
      return c.json({ error: { code: "authorization_scope_violation", message: "Read scope required" } }, 403);
    }
    const tok = await ensureFreshGoogleAccessToken(auth);
    if ("error" in tok) {
      return c.json(
        { error: { code: "reauth_required", message: "Please complete Google Calendar OAuth again" } },
        401,
      );
    }
    const max = body.max_results ?? 10;
    let events: Awaited<ReturnType<typeof listPrimaryCalendarEvents>>;
    let status = 200;
    try {
      events = await listPrimaryCalendarEvents(tok.accessToken, max);
    } catch (e) {
      status = 502;
      events = [];
      await emitAuditEventAsync({
        eventType: "connector.cloud_action.failed",
        actorType: "user",
        actorId: me.userId,
        payload: { authorization_id: auth.id, action: "google_calendar.list_events", error: String(e) },
        correlationId,
      });
      const receipt = await insertExternalActionReceiptAsync({
        connectorAuthorizationId: auth.id,
        action: "google_calendar.list_events",
        requestHash: requestHash({ authorization_id: auth.id, max_results: max }),
        responseStatus: status,
        auditCorrelationId: correlationId,
        responseSummary: { error: String(e) },
      });
      return c.json(
        { error: { code: "provider_error", message: "Google Calendar API failed" }, meta: { receipt_id: receipt.id } },
        502,
      );
    }
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: auth.id,
      action: "google_calendar.list_events",
      requestHash: requestHash({ authorization_id: auth.id, max_results: max }),
      responseStatus: 200,
      auditCorrelationId: correlationId,
      responseSummary: { count: events.length },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.completed",
      actorType: "user",
      actorId: me.userId,
      payload: {
        authorization_id: auth.id,
        action: "google_calendar.list_events",
        receipt_id: receipt.id,
      },
      correlationId,
    });
    void emitProductEventAsync({
      name: "connector.action_executed",
      userId: me.userId,
      conversationId: body.conversation_id,
      payload: { action: "google_calendar.list_events", receipt_id: receipt.id },
      correlationId,
    });
    const lines = events.map((e) => `- ${e.summary} (${e.start ?? "?"})`);
    await appendConnectorSummaryToConversation(body.conversation_id, me.userId, "Google Calendar", lines);
    return c.json({ data: { events, receipt_id: receipt.id } }, 200);
  });

  app.post("/api/v1/connectors/cloud/google-calendar/actions/create-event", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const body = createEventBodySchema.parse(await c.req.json());
    const correlationId = c.req.header("X-Correlation-Id")?.trim() || randomUUID();
    const auth = await getConnectorAuthorizationByIdAsync(body.authorization_id);
    if (!auth || auth.user_id !== me.userId) {
      return c.json({ error: { code: "authorization_not_found", message: "Authorization not found" } }, 404);
    }
    let createCalSpaceId: string | null | undefined = body.space_id ?? null;
    if (!createCalSpaceId && body.conversation_id) {
      const sum = await getConversationSummaryAsync(body.conversation_id);
      createCalSpaceId = sum?.space_id ?? undefined;
    }
    if (createCalSpaceId) {
      const createDenied = await forbiddenUnlessSpaceRbac(c, createCalSpaceId, me.userId, "trigger_connector");
      if (createDenied) return createDenied;
    }
    if (auth.status !== "active") {
      return c.json({ error: { code: "authorization_revoked", message: "Reconnect Google Calendar" } }, 409);
    }
    if (!calendarScopeAllowsWrite(auth.scope_value)) {
      return c.json(
        { error: { code: "authorization_scope_violation", message: "Write scope (calendar.events) required" } },
        403,
      );
    }
    const tok = await ensureFreshGoogleAccessToken(auth);
    if ("error" in tok) {
      return c.json(
        { error: { code: "reauth_required", message: "Please complete Google Calendar OAuth again" } },
        401,
      );
    }
    let created: Awaited<ReturnType<typeof createPrimaryCalendarEvent>>;
    try {
      created = await createPrimaryCalendarEvent(tok.accessToken, body.summary, body.start_iso);
    } catch (e) {
      const receipt = await insertExternalActionReceiptAsync({
        connectorAuthorizationId: auth.id,
        action: "google_calendar.create_event",
        requestHash: requestHash(body),
        responseStatus: 502,
        auditCorrelationId: correlationId,
        responseSummary: { error: String(e) },
      });
      await emitAuditEventAsync({
        eventType: "connector.cloud_action.failed",
        actorType: "user",
        actorId: me.userId,
        payload: { authorization_id: auth.id, action: "google_calendar.create_event", receipt_id: receipt.id },
        correlationId,
      });
      return c.json({ error: { code: "provider_error", message: String(e) } }, 502);
    }
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: auth.id,
      action: "google_calendar.create_event",
      requestHash: requestHash(body),
      responseStatus: 200,
      auditCorrelationId: correlationId,
      responseSummary: { event_id: created.id },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.completed",
      actorType: "user",
      actorId: me.userId,
      payload: {
        authorization_id: auth.id,
        action: "google_calendar.create_event",
        receipt_id: receipt.id,
      },
      correlationId,
    });
    void emitProductEventAsync({
      name: "connector.action_executed",
      userId: me.userId,
      conversationId: body.conversation_id,
      payload: { action: "google_calendar.create_event", receipt_id: receipt.id },
      correlationId,
    });
    await appendConnectorSummaryToConversation(body.conversation_id, me.userId, "Google Calendar", [
      `Created event: ${body.summary} (id ${created.id})`,
    ]);
    return c.json({ data: { event: created, receipt_id: receipt.id } }, 200);
  });

  app.post("/api/v1/connectors/cloud/notion/actions/search", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const body = notionSearchBodySchema.parse(await c.req.json());
    const prep = await prepareNotionCloudAction(c, me, body);
    if (!prep.ok) return prep.response;
    const { auth, correlationId, accessToken } = prep;
    let result: Awaited<ReturnType<typeof notionSearch>>;
    try {
      result = await notionSearch(accessToken, body.query);
    } catch (e) {
      return onNotionAdapterFailure(c, e, {
        auth,
        me,
        correlationId,
        action: "notion.search",
        requestHash: requestHash(body),
        conversationId: body.conversation_id,
      });
    }
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: auth.id,
      action: "notion.search",
      requestHash: requestHash(body),
      responseStatus: 200,
      auditCorrelationId: correlationId,
      responseSummary: { provider: "notion", status: "ok", action: "notion.search", count: result.count },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.completed",
      actorType: "user",
      actorId: me.userId,
      payload: { authorization_id: auth.id, action: "notion.search", receipt_id: receipt.id },
      correlationId,
    });
    void emitProductEventAsync({
      name: "connector.action_executed",
      userId: me.userId,
      conversationId: body.conversation_id,
      payload: { action: "notion.search", receipt_id: receipt.id },
      correlationId,
    });
    const searchTarget =
      result.count === 0 ? "—" : (result.titles[0] ?? `${result.count} results`);
    await appendConnectorSummaryToConversation(body.conversation_id, me.userId, "Notion", [
      `Notion search: ${result.count} result(s)`,
      glNotionReceiptJson({
        receipt_id: receipt.id,
        action: "notion.search",
        status: "ok",
        target_label: searchTarget,
      }),
    ]);
    return c.json({ data: { ...result, receipt_id: receipt.id } }, 200);
  });

  app.post("/api/v1/connectors/cloud/notion/actions/list-databases", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const body = notionBaseActionBodySchema.parse(await c.req.json());
    const prep = await prepareNotionCloudAction(c, me, body);
    if (!prep.ok) return prep.response;
    const { auth, correlationId, accessToken } = prep;
    let result: Awaited<ReturnType<typeof notionListDatabases>>;
    try {
      result = await notionListDatabases(accessToken);
    } catch (e) {
      return onNotionAdapterFailure(c, e, {
        auth,
        me,
        correlationId,
        action: "notion.list_databases",
        requestHash: requestHash(body),
        conversationId: body.conversation_id,
      });
    }
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: auth.id,
      action: "notion.list_databases",
      requestHash: requestHash(body),
      responseStatus: 200,
      auditCorrelationId: correlationId,
      responseSummary: {
        provider: "notion",
        status: "ok",
        action: "notion.list_databases",
        database_count: result.raw_count,
      },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.completed",
      actorType: "user",
      actorId: me.userId,
      payload: { authorization_id: auth.id, action: "notion.list_databases", receipt_id: receipt.id },
      correlationId,
    });
    void emitProductEventAsync({
      name: "connector.action_executed",
      userId: me.userId,
      conversationId: body.conversation_id,
      payload: { action: "notion.list_databases", receipt_id: receipt.id },
      correlationId,
    });
    const listTarget =
      result.raw_count === 0
        ? "—"
        : result.raw_count === 1
          ? (result.databases[0]?.title ?? "—")
          : `${result.raw_count} databases`;
    await appendConnectorSummaryToConversation(body.conversation_id, me.userId, "Notion", [
      `Notion: listed ${result.raw_count} database(s)`,
      glNotionReceiptJson({
        receipt_id: receipt.id,
        action: "notion.list_databases",
        status: "ok",
        target_label: listTarget,
      }),
    ]);
    return c.json({ data: { ...result, receipt_id: receipt.id } }, 200);
  });

  app.post("/api/v1/connectors/cloud/notion/databases/:database_id/query", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const databaseId = c.req.param("database_id");
    if (!databaseId) {
      return c.json({ error: { code: "invalid_input", message: "Missing database_id" } }, 400);
    }
    const body = notionQueryDatabaseBodySchema.parse(await c.req.json());
    const prep = await prepareNotionCloudAction(c, me, body);
    if (!prep.ok) return prep.response;
    const { auth, correlationId, accessToken } = prep;
    let result: Awaited<ReturnType<typeof notionQueryDatabase>>;
    try {
      result = await notionQueryDatabase(accessToken, databaseId, {
        filter: body.filter,
        sorts: body.sorts,
        page_size: body.page_size,
      });
    } catch (e) {
      return onNotionAdapterFailure(c, e, {
        auth,
        me,
        correlationId,
        action: "notion.database.query",
        requestHash: requestHash({ ...body, database_id: databaseId }),
        conversationId: body.conversation_id,
      });
    }
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: auth.id,
      action: "notion.database.query",
      requestHash: requestHash({ ...body, database_id: databaseId }),
      responseStatus: 200,
      auditCorrelationId: correlationId,
      responseSummary: {
        provider: "notion",
        status: "ok",
        action: "notion.database.query",
        database_id: databaseId,
        result_count: result.result_count,
        has_more: result.has_more,
      },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.completed",
      actorType: "user",
      actorId: me.userId,
      payload: { authorization_id: auth.id, action: "notion.database.query", receipt_id: receipt.id },
      correlationId,
    });
    void emitProductEventAsync({
      name: "connector.action_executed",
      userId: me.userId,
      conversationId: body.conversation_id,
      payload: { action: "notion.database.query", receipt_id: receipt.id },
      correlationId,
    });
    let queryDbTitle: string;
    try {
      queryDbTitle = await notionGetDatabaseTitle(accessToken, databaseId);
    } catch {
      queryDbTitle = databaseId.length > 12 ? `${databaseId.slice(0, 8)}…` : databaseId;
    }
    await appendConnectorSummaryToConversation(body.conversation_id, me.userId, "Notion", [
      `Notion: queried database (${result.result_count} row(s))`,
      glNotionReceiptJson({
        receipt_id: receipt.id,
        action: "notion.database.query",
        status: "ok",
        target_label: queryDbTitle,
      }),
    ]);
    return c.json({ data: { ...result, database_id: databaseId, receipt_id: receipt.id } }, 200);
  });

  app.post("/api/v1/connectors/cloud/notion/pages", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const body = notionCreatePageBodySchema.parse(await c.req.json());
    const prep = await prepareNotionCloudAction(c, me, body);
    if (!prep.ok) return prep.response;
    const { auth, correlationId, accessToken } = prep;
    let result: Awaited<ReturnType<typeof notionCreatePage>>;
    try {
      result = await notionCreatePage(accessToken, body.database_id, body.properties);
    } catch (e) {
      return onNotionAdapterFailure(c, e, {
        auth,
        me,
        correlationId,
        action: "notion.page.create",
        requestHash: requestHash(body),
        conversationId: body.conversation_id,
      });
    }
    const receipt = await insertExternalActionReceiptAsync({
      connectorAuthorizationId: auth.id,
      action: "notion.page.create",
      requestHash: requestHash(body),
      responseStatus: 200,
      auditCorrelationId: correlationId,
      responseSummary: {
        provider: "notion",
        status: "ok",
        action: "notion.page.create",
        database_id: body.database_id,
        page_id: result.page_id,
      },
    });
    await emitAuditEventAsync({
      eventType: "connector.cloud_action.completed",
      actorType: "user",
      actorId: me.userId,
      payload: { authorization_id: auth.id, action: "notion.page.create", receipt_id: receipt.id },
      correlationId,
    });
    void emitProductEventAsync({
      name: "connector.action_executed",
      userId: me.userId,
      conversationId: body.conversation_id,
      payload: { action: "notion.page.create", receipt_id: receipt.id },
      correlationId,
    });
    let createDbTitle: string;
    try {
      createDbTitle = await notionGetDatabaseTitle(accessToken, body.database_id);
    } catch {
      createDbTitle =
        body.database_id.length > 12 ? `${body.database_id.slice(0, 8)}…` : body.database_id;
    }
    await appendConnectorSummaryToConversation(body.conversation_id, me.userId, "Notion", [
      `Notion: created page ${result.page_id}`,
      glNotionReceiptJson({
        receipt_id: receipt.id,
        action: "notion.page.create",
        status: "ok",
        target_label: createDbTitle,
      }),
    ]);
    return c.json({ data: { ...result, receipt_id: receipt.id } }, 200);
  });

  app.post("/api/v1/connectors/file-upload", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const form = await c.req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return c.json({ error: { code: "invalid_upload", message: 'Expected multipart field "file"' } }, 400);
    }
    const maxBytes = Number(process.env.CONNECTOR_UPLOAD_MAX_BYTES ?? "2000000") || 2_000_000;
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length > maxBytes) {
      return c.json({ error: { code: "file_too_large", message: "File exceeds server limit" } }, 413);
    }
    const uploadSpaceRaw = form.get("space_id");
    const uploadSpaceId =
      typeof uploadSpaceRaw === "string" && uploadSpaceRaw.length > 0 ? uploadSpaceRaw.trim() : null;
    if (uploadSpaceId) {
      const upDenied = await forbiddenUnlessSpaceRbac(c, uploadSpaceId, me.userId, "trigger_connector");
      if (upDenied) return upDenied;
    }
    const saved = await saveConnectorUploadAsync({
      userId: me.userId,
      buffer: buf,
      originalFilename: file.name || "upload.bin",
      mimeType: file.type || "application/octet-stream",
    });
    return c.json({ data: { file_ref_id: saved.id, byte_size: saved.byte_size } }, 201);
  });

  app.get("/api/v1/connectors/file-upload/:id/excerpt", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const fileId = c.req.param("id");
    if (!fileId) {
      return c.json({ error: { code: "invalid_input", message: "Missing file id" } }, 400);
    }
    const r = await buildUploadExcerptForAgentAsync(fileId, me.userId);
    if (!r.ok) {
      return c.json({ error: { code: "file_not_found", message: "Upload not found" } }, 404);
    }
    return c.json({ data: { excerpt: r.excerpt, filename: r.filename } }, 200);
  });

  app.get("/api/v1/connectors/external-action-receipts/:id", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Bearer required" } }, 401);
    const receiptId = c.req.param("id");
    if (!receiptId) {
      return c.json({ error: { code: "invalid_input", message: "Missing receipt id" } }, 400);
    }
    const receipt = await getExternalActionReceiptByIdAsync(receiptId);
    if (!receipt) {
      return c.json({ error: { code: "receipt_not_found", message: "Receipt not found" } }, 404);
    }
    let allowed = false;
    if (receipt.connector_authorization_id) {
      const auth = await getConnectorAuthorizationByIdAsync(receipt.connector_authorization_id);
      allowed = Boolean(auth && auth.user_id === me.userId);
    } else if (receipt.device_id) {
      const dev = await getDeviceByIdAsync(receipt.device_id);
      allowed = Boolean(dev && dev.user_id === me.userId);
    }
    if (!allowed) {
      return c.json({ error: { code: "forbidden", message: "Receipt access denied" } }, 403);
    }
    return c.json({ data: receipt }, 200);
  });
}
