import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { scheduleNotificationEmailAsync } from "./notification-email-dispatch";

export type NotificationChannel = "in_app" | "email";
export type NotificationStrategy = "only_exceptions" | "all_runs";

/** E-8 产品内通知类型（与 `notification_events.notification_type` 一致）。 */
export type NotificationAppType =
  | "task_completed"
  | "review_required"
  | "connector_expiring"
  | "quota_warning"
  | "agent_status_change"
  | "space_invitation"
  | "legacy_event";

export interface NotificationPreference {
  user_id: string;
  channels: NotificationChannel[];
  strategy: NotificationStrategy;
  updated_at: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string | null;
}

export interface NotificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  /** API 对外字段名 `type`，对应库列 `notification_type`。 */
  type: NotificationAppType;
  deep_link: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

const preferencesMap = new Map<string, NotificationPreference>();
const eventsList: NotificationEvent[] = [];

const nowIso = (): string => new Date().toISOString();

const defaultPreference = (userId: string): NotificationPreference => ({
  user_id: userId,
  channels: ["in_app"],
  strategy: "only_exceptions",
  updated_at: nowIso(),
  quiet_hours_start: null,
  quiet_hours_end: null,
  quiet_hours_timezone: null,
});

function inferNotificationType(eventType: string): NotificationAppType {
  if (eventType === "trust.agent_report.upheld") return "agent_status_change";
  if (eventType.startsWith("agent.lifecycle.")) return "agent_status_change";
  if (eventType === "scheduler_run_failed") return "task_completed";
  return "legacy_event";
}

async function channelsAllowInApp(userId: string): Promise<boolean> {
  const prefs = await getNotificationPreferencesAsync(userId);
  const ch = prefs?.channels ?? ["in_app"];
  return ch.includes("in_app");
}

export const getNotificationPreferencesAsync = async (
  userId: string,
): Promise<NotificationPreference | null> => {
  if (!isPostgresEnabled()) {
    return preferencesMap.get(userId) ?? null;
  }
  const rows = await query<
    NotificationPreference & { updated_at: string; channels: string[] }
  >(
    `SELECT user_id, channels, strategy,
            quiet_hours_start, quiet_hours_end, quiet_hours_timezone,
            updated_at::text
     FROM notification_preferences
     WHERE user_id = $1`,
    [userId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    user_id: r.user_id,
    channels: r.channels as NotificationChannel[],
    strategy: r.strategy as NotificationStrategy,
    updated_at: r.updated_at,
    quiet_hours_start: r.quiet_hours_start ?? null,
    quiet_hours_end: r.quiet_hours_end ?? null,
    quiet_hours_timezone: r.quiet_hours_timezone ?? null,
  };
};

export const setNotificationPreferencesAsync = async (
  userId: string,
  input: {
    channels?: NotificationChannel[];
    strategy?: NotificationStrategy;
    quiet_hours_start?: string | null;
    quiet_hours_end?: string | null;
    quiet_hours_timezone?: string | null;
  },
): Promise<NotificationPreference> => {
  const existing = (await getNotificationPreferencesAsync(userId)) ?? defaultPreference(userId);
  const now = nowIso();
  const pref: NotificationPreference = {
    user_id: userId,
    channels: input.channels ?? existing.channels,
    strategy: input.strategy ?? existing.strategy,
    updated_at: now,
    quiet_hours_start:
      input.quiet_hours_start !== undefined ? input.quiet_hours_start : existing.quiet_hours_start,
    quiet_hours_end:
      input.quiet_hours_end !== undefined ? input.quiet_hours_end : existing.quiet_hours_end,
    quiet_hours_timezone:
      input.quiet_hours_timezone !== undefined
        ? input.quiet_hours_timezone
        : existing.quiet_hours_timezone,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO notification_preferences
         (user_id, channels, strategy, quiet_hours_start, quiet_hours_end, quiet_hours_timezone, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         channels = EXCLUDED.channels,
         strategy = EXCLUDED.strategy,
         quiet_hours_start = EXCLUDED.quiet_hours_start,
         quiet_hours_end = EXCLUDED.quiet_hours_end,
         quiet_hours_timezone = EXCLUDED.quiet_hours_timezone,
         updated_at = EXCLUDED.updated_at`,
      [
        userId,
        pref.channels,
        pref.strategy,
        pref.quiet_hours_start,
        pref.quiet_hours_end,
        pref.quiet_hours_timezone,
        now,
      ],
    );
    return pref;
  }
  preferencesMap.set(userId, pref);
  return pref;
};

export const recordNotificationEventAsync = async (input: {
  user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  notification_type?: NotificationAppType;
  deep_link?: string | null;
}): Promise<NotificationEvent | null> => {
  if (!(await channelsAllowInApp(input.user_id))) {
    return null;
  }
  const notificationType = input.notification_type ?? inferNotificationType(input.event_type);
  const deepLink = input.deep_link ?? null;
  const event: NotificationEvent = {
    id: randomUUID(),
    user_id: input.user_id,
    event_type: input.event_type,
    type: notificationType,
    deep_link: deepLink,
    payload: input.payload,
    created_at: nowIso(),
    read_at: null,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO notification_events
         (id, user_id, event_type, notification_type, deep_link, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        event.id,
        event.user_id,
        event.event_type,
        event.type,
        event.deep_link,
        JSON.stringify(event.payload),
        event.created_at,
      ],
    );
    scheduleNotificationEmailAsync(event);
    return event;
  }
  eventsList.push(event);
  scheduleNotificationEmailAsync(event);
  return event;
};

type CursorPayload = { t: string; i: string };

function encodeCursor(c: CursorPayload): string {
  return Buffer.from(JSON.stringify(c), "utf8").toString("base64url");
}

function decodeCursor(raw: string | undefined): CursorPayload | null {
  if (!raw?.trim()) return null;
  try {
    const j = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as CursorPayload;
    if (typeof j?.t === "string" && typeof j?.i === "string") return j;
    return null;
  } catch {
    return null;
  }
}

export const listNotificationsPagedAsync = async (input: {
  userId: string;
  limit: number;
  unreadOnly: boolean;
  cursor: string | undefined;
}): Promise<{ items: NotificationEvent[]; next_cursor: string | null }> => {
  const limit = Math.min(100, Math.max(1, input.limit));
  const cur = decodeCursor(input.cursor);

  if (!isPostgresEnabled()) {
    let rows = eventsList.filter((e) => e.user_id === input.userId);
    if (input.unreadOnly) rows = rows.filter((e) => e.read_at == null);
    rows.sort((a, b) => {
      const ct = b.created_at.localeCompare(a.created_at);
      if (ct !== 0) return ct;
      return b.id.localeCompare(a.id);
    });
    if (cur) {
      rows = rows.filter(
        (e) => e.created_at < cur.t || (e.created_at === cur.t && e.id < cur.i),
      );
    }
    const page = rows.slice(0, limit + 1);
    const hasMore = page.length > limit;
    const items = hasMore ? page.slice(0, limit) : page;
    const last = items[items.length - 1];
    const next_cursor =
      hasMore && last ? encodeCursor({ t: last.created_at, i: last.id }) : null;
    return { items, next_cursor };
  }

  const params: unknown[] = [input.userId];
  let p = 2;
  let where = "WHERE user_id = $1";
  if (input.unreadOnly) {
    where += " AND read_at IS NULL";
  }
  if (cur) {
    where += ` AND (created_at, id) < ($${p}::timestamptz, $${p + 1}::uuid)`;
    params.push(cur.t, cur.i);
    p += 2;
  }
  params.push(limit + 1);
  const limParam = `$${p}`;
  const sql = `
    SELECT id, user_id, event_type, notification_type AS type, deep_link, payload,
           created_at::text, read_at::text
    FROM notification_events
    ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT ${limParam}
  `;
  const rawRows = await query<
    NotificationEvent & { payload: string | Record<string, unknown>; type: string }
  >(sql, params);
  const mapped: NotificationEvent[] = rawRows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    event_type: r.event_type,
    type: r.type as NotificationAppType,
    deep_link: r.deep_link ?? null,
    payload:
      typeof r.payload === "string" ? (JSON.parse(r.payload) as Record<string, unknown>) : r.payload,
    created_at: r.created_at,
    read_at: r.read_at ?? null,
  }));
  const hasMore = mapped.length > limit;
  const items = hasMore ? mapped.slice(0, limit) : mapped;
  const last = items[items.length - 1];
  const next_cursor =
    hasMore && last ? encodeCursor({ t: last.created_at, i: last.id }) : null;
  return { items, next_cursor };
};

export const countUnreadNotificationsAsync = async (userId: string): Promise<number> => {
  if (!isPostgresEnabled()) {
    return eventsList.filter((e) => e.user_id === userId && e.read_at == null).length;
  }
  const rows = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM notification_events WHERE user_id = $1 AND read_at IS NULL`,
    [userId],
  );
  return Number(rows[0]?.c ?? 0);
};

export const markNotificationReadAsync = async (
  userId: string,
  notificationId: string,
): Promise<NotificationEvent | null> => {
  const readAt = nowIso();
  if (!isPostgresEnabled()) {
    const e = eventsList.find((x) => x.id === notificationId && x.user_id === userId);
    if (!e) return null;
    e.read_at = readAt;
    return e;
  }
  const rows = await query<
    NotificationEvent & { payload: string | Record<string, unknown>; type: string }
  >(
    `UPDATE notification_events
     SET read_at = $3::timestamptz
     WHERE id = $1::uuid AND user_id = $2
     RETURNING id, user_id, event_type, notification_type AS type, deep_link, payload,
               created_at::text, read_at::text`,
    [notificationId, userId, readAt],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    user_id: r.user_id,
    event_type: r.event_type,
    type: r.type as NotificationAppType,
    deep_link: r.deep_link ?? null,
    payload:
      typeof r.payload === "string" ? (JSON.parse(r.payload) as Record<string, unknown>) : r.payload,
    created_at: r.created_at,
    read_at: r.read_at ?? null,
  };
};

export const markAllNotificationsReadAsync = async (userId: string): Promise<number> => {
  const readAt = nowIso();
  if (!isPostgresEnabled()) {
    let n = 0;
    for (const e of eventsList) {
      if (e.user_id === userId && e.read_at == null) {
        e.read_at = readAt;
        n += 1;
      }
    }
    return n;
  }
  const rows = await query<{ c: string }>(
    `WITH u AS (
       UPDATE notification_events SET read_at = $2::timestamptz
       WHERE user_id = $1 AND read_at IS NULL
       RETURNING 1
     ) SELECT COUNT(*)::text AS c FROM u`,
    [userId, readAt],
  );
  return Number(rows[0]?.c ?? 0);
};

/** 兼容旧 GET `/api/v1/users/:id/notifications`。 */
export const listNotificationEventsAsync = async (
  userId: string,
  limit: number = 50,
): Promise<NotificationEvent[]> => {
  const { items } = await listNotificationsPagedAsync({
    userId,
    limit,
    unreadOnly: false,
    cursor: undefined,
  });
  return items;
};

export const resetNotificationStore = (): void => {
  if (isPostgresEnabled()) return;
  preferencesMap.clear();
  eventsList.length = 0;
};
