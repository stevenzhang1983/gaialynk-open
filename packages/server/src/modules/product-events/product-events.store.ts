import { isPostgresEnabled, query } from "../../infra/db/client";
import type { ProductEventName } from "./product-events.types";
import { isProductEventName } from "./product-events.types";

export interface InsertProductEventInput {
  eventName: ProductEventName;
  userId?: string | null;
  spaceId?: string | null;
  conversationId?: string | null;
  payload?: Record<string, unknown>;
  correlationId?: string | null;
}

export async function insertProductEventAsync(input: InsertProductEventInput): Promise<void> {
  if (!isPostgresEnabled()) {
    return;
  }
  try {
    await query(
      `INSERT INTO product_events (event_name, user_id, space_id, conversation_id, payload, correlation_id)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        input.eventName,
        input.userId ?? null,
        input.spaceId ?? null,
        input.conversationId ?? null,
        JSON.stringify(input.payload ?? {}),
        input.correlationId ?? null,
      ],
    );
  } catch {
    // 迁移未应用或 PG 瞬断时不阻断主业务；上线应保证 db:migrate 已执行。
  }
}

export async function userHasProductEventAsync(userId: string, eventName: ProductEventName): Promise<boolean> {
  if (!isPostgresEnabled()) {
    return false;
  }
  try {
    const rows = await query<{ ok: string }>(
      `SELECT 1::text AS ok FROM product_events WHERE user_id = $1 AND event_name = $2 LIMIT 1`,
      [userId, eventName],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}

export type EventTotalsRow = { event_name: string; event_count: number };

export async function sumProductEventsByNameAsync(days: number): Promise<EventTotalsRow[]> {
  if (!isPostgresEnabled()) {
    return [];
  }
  const d = Math.min(Math.max(Math.floor(days), 1), 366);
  return query<EventTotalsRow>(
    `SELECT event_name, COUNT(*)::int AS event_count
     FROM product_events
     WHERE occurred_at >= NOW() - ($1::int * INTERVAL '1 day')
     GROUP BY event_name
     ORDER BY event_count DESC`,
    [d],
  );
}

export async function countDistinctUsersWithEventAsync(
  days: number,
  eventName: ProductEventName,
): Promise<number> {
  if (!isPostgresEnabled()) {
    return 0;
  }
  const d = Math.min(Math.max(Math.floor(days), 1), 366);
  const rows = await query<{ n: string }>(
    `SELECT COUNT(DISTINCT user_id)::text AS n
     FROM product_events
     WHERE occurred_at >= NOW() - ($1::int * INTERVAL '1 day')
       AND event_name = $2
       AND user_id IS NOT NULL`,
    [d, eventName],
  );
  return Number(rows[0]?.n ?? "0");
}

export async function countDistinctUsersWithBothEventsAsync(
  days: number,
  a: ProductEventName,
  b: ProductEventName,
): Promise<number> {
  if (!isPostgresEnabled()) {
    return 0;
  }
  const d = Math.min(Math.max(Math.floor(days), 1), 366);
  const rows = await query<{ n: string }>(
    `SELECT COUNT(DISTINCT e1.user_id)::text AS n
     FROM product_events e1
     INNER JOIN product_events e2
       ON e1.user_id = e2.user_id
      AND e2.event_name = $3
      AND e2.user_id IS NOT NULL
      AND e2.occurred_at >= NOW() - ($1::int * INTERVAL '1 day')
     WHERE e1.event_name = $2
       AND e1.user_id IS NOT NULL
       AND e1.occurred_at >= NOW() - ($1::int * INTERVAL '1 day')`,
    [d, a, b],
  );
  return Number(rows[0]?.n ?? "0");
}

export interface CsvExportRow {
  id: string;
  event_name: string;
  user_id: string | null;
  space_id: string | null;
  conversation_id: string | null;
  occurred_at: string;
  correlation_id: string | null;
  payload: Record<string, unknown>;
}

export async function listProductEventsForExportAsync(
  days: number,
  limit: number,
): Promise<CsvExportRow[]> {
  if (!isPostgresEnabled()) {
    return [];
  }
  const d = Math.min(Math.max(Math.floor(days), 1), 366);
  const lim = Math.min(Math.max(limit, 1), 100_000);
  const rows = await query<{
    id: string;
    event_name: string;
    user_id: string | null;
    space_id: string | null;
    conversation_id: string | null;
    occurred_at: string;
    correlation_id: string | null;
    payload: Record<string, unknown>;
  }>(
    `SELECT id::text, event_name, user_id::text, space_id::text, conversation_id::text,
            occurred_at::text, correlation_id, payload
     FROM product_events
     WHERE occurred_at >= NOW() - ($1::int * INTERVAL '1 day')
     ORDER BY occurred_at ASC
     LIMIT $2`,
    [d, lim],
  );
  return rows.map((r) => ({
    ...r,
    payload: typeof r.payload === "object" && r.payload !== null ? r.payload : {},
  }));
}

export function totalsRowsToRecord(rows: EventTotalsRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (isProductEventName(r.event_name)) {
      out[r.event_name] = r.event_count;
    }
  }
  return out;
}
