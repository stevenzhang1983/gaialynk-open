import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type NotificationChannel = "in_app" | "email";
export type NotificationStrategy = "only_exceptions" | "all_runs";

export interface NotificationPreference {
  user_id: string;
  channels: NotificationChannel[];
  strategy: NotificationStrategy;
  updated_at: string;
}

export interface NotificationEvent {
  id: string;
  user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}

const preferencesMap = new Map<string, NotificationPreference>();
const eventsList: NotificationEvent[] = [];

const nowIso = (): string => new Date().toISOString();

export const getNotificationPreferencesAsync = async (
  userId: string,
): Promise<NotificationPreference | null> => {
  if (!isPostgresEnabled()) {
    return preferencesMap.get(userId) ?? null;
  }
  const rows = await query<NotificationPreference & { updated_at: string }>(
    `SELECT user_id, channels, strategy, updated_at::text
     FROM notification_preferences
     WHERE user_id = $1`,
    [userId],
  );
  return rows[0] ?? null;
};

export const setNotificationPreferencesAsync = async (
  userId: string,
  input: { channels?: NotificationChannel[]; strategy?: NotificationStrategy },
): Promise<NotificationPreference> => {
  const now = nowIso();
  const channels = input.channels ?? ["in_app"];
  const strategy = input.strategy ?? "only_exceptions";
  const pref: NotificationPreference = {
    user_id: userId,
    channels,
    strategy,
    updated_at: now,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO notification_preferences (user_id, channels, strategy, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         channels = EXCLUDED.channels,
         strategy = EXCLUDED.strategy,
         updated_at = EXCLUDED.updated_at`,
      [userId, channels, strategy, now],
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
}): Promise<NotificationEvent> => {
  const event: NotificationEvent = {
    id: randomUUID(),
    user_id: input.user_id,
    event_type: input.event_type,
    payload: input.payload,
    created_at: nowIso(),
    read_at: null,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO notification_events (id, user_id, event_type, payload, created_at)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [event.id, event.user_id, event.event_type, JSON.stringify(event.payload), event.created_at],
    );
    return event;
  }
  eventsList.push(event);
  return event;
};

export const listNotificationEventsAsync = async (
  userId: string,
  limit: number = 50,
): Promise<NotificationEvent[]> => {
  if (!isPostgresEnabled()) {
    return eventsList
      .filter((e) => e.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  const rows = await query<NotificationEvent & { payload: string; read_at: string | null }>(
    `SELECT id, user_id, event_type, payload, created_at::text, read_at::text
     FROM notification_events
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map((r) => ({
    ...r,
    payload: typeof r.payload === "string" ? (JSON.parse(r.payload) as Record<string, unknown>) : r.payload,
    read_at: r.read_at,
  }));
};

export const resetNotificationStore = (): void => {
  if (isPostgresEnabled()) return;
  preferencesMap.clear();
  eventsList.length = 0;
};
