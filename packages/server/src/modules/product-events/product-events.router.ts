import type { Hono } from "hono";
import { verifyAccessToken } from "../auth/jwt";
import {
  countDistinctUsersWithBothEventsAsync,
  countDistinctUsersWithEventAsync,
  listProductEventsForExportAsync,
  sumProductEventsByNameAsync,
  totalsRowsToRecord,
} from "./product-events.store";
import type { ProductEventName } from "./product-events.types";
import { PRODUCT_EVENT_NAMES } from "./product-events.types";

function getOptionalJwtUserIdFromRequest(c: {
  req: { header: (name: string) => string | undefined };
}): string | undefined {
  const auth = c.req.header("Authorization")?.trim();
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!bearer) return undefined;
  return verifyAccessToken(bearer)?.sub;
}

function canAccessFounderDashboard(userId: string): boolean {
  const ids = process.env.FOUNDER_DASHBOARD_USER_IDS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (ids?.length) {
    return ids.includes(userId);
  }
  return process.env.VITEST === "true" || process.env.NODE_ENV === "test";
}

function parseDays(raw: string | undefined): number {
  const n = raw != null ? parseInt(raw, 10) : 7;
  if (!Number.isFinite(n)) return 7;
  return Math.min(Math.max(n, 1), 366);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function buildFounderSnapshotAsync(days: number): Promise<{
  days: number;
  generated_at: string;
  event_totals: Record<string, number>;
  distinct_users: Partial<Record<ProductEventName, number>>;
  funnel: {
    registered_users: number;
    registered_and_first_conversation: number;
    registered_and_first_valuable_reply: number;
    registered_and_connector: number;
    registered_and_multi_agent: number;
  };
  website_funnel: {
    note: string;
    dashboard_path: string;
  };
}> {
  const totalsRows = await sumProductEventsByNameAsync(days);
  const event_totals = totalsRowsToRecord(totalsRows);
  for (const name of PRODUCT_EVENT_NAMES) {
    if (event_totals[name] === undefined) {
      event_totals[name] = 0;
    }
  }

  const distinct_users: Partial<Record<ProductEventName, number>> = {};
  const duEvents: ProductEventName[] = [
    "user.registered",
    "user.first_conversation",
    "user.first_valuable_reply",
    "connector.authorized",
    "agent.invoked_multi_step",
  ];
  for (const ev of duEvents) {
    distinct_users[ev] = await countDistinctUsersWithEventAsync(days, ev);
  }

  const funnel = {
    registered_users: distinct_users["user.registered"] ?? 0,
    registered_and_first_conversation: await countDistinctUsersWithBothEventsAsync(
      days,
      "user.registered",
      "user.first_conversation",
    ),
    registered_and_first_valuable_reply: await countDistinctUsersWithBothEventsAsync(
      days,
      "user.registered",
      "user.first_valuable_reply",
    ),
    registered_and_connector: await countDistinctUsersWithBothEventsAsync(
      days,
      "user.registered",
      "connector.authorized",
    ),
    registered_and_multi_agent: await countDistinctUsersWithBothEventsAsync(
      days,
      "user.registered",
      "agent.invoked_multi_step",
    ),
  };

  return {
    days,
    generated_at: new Date().toISOString(),
    event_totals,
    distinct_users,
    funnel,
    website_funnel: {
      note:
        "官网 CTA → 曝光漏斗（page_view、cta_click、consumer_* 等）由 packages/website 的 Analytics Dashboard 与 GET /api/analytics/funnel 承载；本快照为产品主线路（注册与会话、Trust、连接器、编排）事件。",
      dashboard_path: "/app/analytics",
    },
  };
}

export function registerProductEventsRoutes(app: Hono): void {
  app.get("/api/v1/founder-metrics/snapshot", async (c) => {
    const uid = getOptionalJwtUserIdFromRequest(c);
    if (!uid) {
      return c.json({ error: { code: "unauthorized", message: "Bearer JWT required" } }, 401);
    }
    if (!canAccessFounderDashboard(uid)) {
      return c.json(
        { error: { code: "forbidden", message: "Not authorized to view founder metrics" } },
        403,
      );
    }
    const days = parseDays(c.req.query("days"));
    const data = await buildFounderSnapshotAsync(days);
    return c.json({ data }, 200);
  });

  app.get("/api/v1/founder-metrics/export.csv", async (c) => {
    const uid = getOptionalJwtUserIdFromRequest(c);
    if (!uid) {
      return c.json({ error: { code: "unauthorized", message: "Bearer JWT required" } }, 401);
    }
    if (!canAccessFounderDashboard(uid)) {
      return c.json(
        { error: { code: "forbidden", message: "Not authorized to export founder metrics" } },
        403,
      );
    }
    const days = parseDays(c.req.query("days"));
    const limitRaw = c.req.query("limit");
    const limit = limitRaw != null ? parseInt(limitRaw, 10) : 50_000;
    const rows = await listProductEventsForExportAsync(days, Number.isFinite(limit) ? limit : 50_000);

    const header = [
      "id",
      "event_name",
      "user_id",
      "space_id",
      "conversation_id",
      "occurred_at",
      "correlation_id",
      "payload_json",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push(
        [
          escapeCsvCell(r.id),
          escapeCsvCell(r.event_name),
          escapeCsvCell(r.user_id ?? ""),
          escapeCsvCell(r.space_id ?? ""),
          escapeCsvCell(r.conversation_id ?? ""),
          escapeCsvCell(r.occurred_at),
          escapeCsvCell(r.correlation_id ?? ""),
          escapeCsvCell(JSON.stringify(r.payload)),
        ].join(","),
      );
    }
    const body = `\uFEFF${lines.join("\n")}\n`;
    c.header("Content-Type", "text/csv; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="product-events-${days}d.csv"`);
    return c.body(body, 200);
  });
}
