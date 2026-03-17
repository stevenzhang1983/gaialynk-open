import type { AnalyticsStoreRuntimeConfig } from "./store";
import type { StoredAnalyticsEvent } from "./store";

export type HealthLevel = "info" | "warn" | "critical";
export type HealthAlertCode = "NO_EVENTS_RECEIVED" | "EVENT_INGEST_IDLE_TOO_LONG" | "LOW_24H_EVENT_VOLUME";

const ALERT_LEVEL: Record<HealthAlertCode, HealthLevel> = {
  NO_EVENTS_RECEIVED: "warn",
  EVENT_INGEST_IDLE_TOO_LONG: "critical",
  LOW_24H_EVENT_VOLUME: "warn",
};

export function extractHealthAuthToken(headers: Headers): string {
  const custom = headers.get("x-analytics-health-key");
  if (custom) {
    return custom;
  }

  const authorization = headers.get("authorization");
  if (!authorization) {
    return "";
  }
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return "";
  }
  return token;
}

export function buildAnalyticsHealthSnapshot(input: {
  events: StoredAnalyticsEvent[];
  config: AnalyticsStoreRuntimeConfig;
  retentionDays: number;
  maxIdleSeconds: number;
  minEvents24h: number;
  nowMs?: number;
}) {
  const now = input.nowMs ?? Date.now();
  const latest = input.events[input.events.length - 1];
  const lastReceivedAt = latest?.receivedAt || null;
  const idleSeconds = lastReceivedAt ? Math.floor((now - new Date(lastReceivedAt).getTime()) / 1000) : null;
  const last24hEvents = input.events.filter((event) => now - new Date(event.receivedAt).getTime() <= 24 * 60 * 60 * 1000).length;
  const alerts: HealthAlertCode[] = [];

  if (!lastReceivedAt) {
    alerts.push("NO_EVENTS_RECEIVED");
  } else if (idleSeconds !== null && idleSeconds > input.maxIdleSeconds) {
    alerts.push("EVENT_INGEST_IDLE_TOO_LONG");
  }

  if (last24hEvents < input.minEvents24h) {
    alerts.push("LOW_24H_EVENT_VOLUME");
  }

  const alertDetails = alerts.map((code) => ({
    code,
    level: ALERT_LEVEL[code],
  }));

  const level: HealthLevel = alertDetails.some((item) => item.level === "critical")
    ? "critical"
    : alertDetails.some((item) => item.level === "warn")
      ? "warn"
      : "info";

  return {
    status: alerts.length ? ("degraded" as const) : ("ok" as const),
    level,
    driver: input.config.driver,
    table: input.config.tableName,
    hasDatabaseUrl: Boolean(input.config.databaseUrl),
    filePath: input.config.filePath,
    retentionDays: input.retentionDays,
    totalEvents: input.events.length,
    last24hEvents,
    lastReceivedAt,
    idleSeconds,
    maxIdleSeconds: input.maxIdleSeconds,
    minEvents24h: input.minEvents24h,
    alerts,
    alertDetails,
    generatedAt: new Date().toISOString(),
  };
}

export function buildAnalyticsReadySnapshot(input: {
  config: AnalyticsStoreRuntimeConfig;
  level: HealthLevel;
}) {
  const reasons: string[] = [];
  if (input.config.driver === "postgres" && !input.config.databaseUrl) {
    reasons.push("POSTGRES_DRIVER_WITHOUT_DATABASE_URL");
  }
  if (input.level === "critical") {
    reasons.push("HEALTH_LEVEL_CRITICAL");
  }

  return {
    ready: reasons.length === 0,
    level: input.level,
    driver: input.config.driver,
    reasons,
    generatedAt: new Date().toISOString(),
  };
}
