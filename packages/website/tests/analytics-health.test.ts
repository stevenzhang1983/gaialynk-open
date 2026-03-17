import { describe, expect, test } from "vitest";
import { buildAnalyticsHealthSnapshot, buildAnalyticsReadySnapshot, extractHealthAuthToken } from "../src/lib/analytics/health";

describe("analytics health helpers", () => {
  test("extracts token from custom header first", () => {
    const headers = new Headers();
    headers.set("x-analytics-health-key", "secret-key");
    headers.set("authorization", "Bearer other-token");

    expect(extractHealthAuthToken(headers)).toBe("secret-key");
  });

  test("extracts token from bearer authorization header", () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer secret-key");
    expect(extractHealthAuthToken(headers)).toBe("secret-key");
  });

  test("builds health snapshot with latest event timestamp", () => {
    const snapshot = buildAnalyticsHealthSnapshot({
      events: [
        {
          name: "page_view",
          payload: {
            locale: "en",
            page: "/en",
            referrer: "direct",
            timestamp: "2026-03-15T00:00:00.000Z",
            device_type: "desktop",
          },
          receivedAt: "2026-03-15T00:00:01.000Z",
        },
      ],
      config: {
        driver: "memory",
        filePath: ".data/analytics-events.json",
        databaseUrl: "",
        tableName: "website_analytics_events",
      },
      retentionDays: 30,
      maxIdleSeconds: Number.MAX_SAFE_INTEGER,
      minEvents24h: 1,
      nowMs: new Date("2026-03-15T00:10:00.000Z").getTime(),
    });

    expect(snapshot.driver).toBe("memory");
    expect(snapshot.totalEvents).toBe(1);
    expect(snapshot.lastReceivedAt).toBe("2026-03-15T00:00:01.000Z");
    expect(snapshot.level).toBe("info");
  });

  test("marks health as degraded when there are no events", () => {
    const snapshot = buildAnalyticsHealthSnapshot({
      events: [],
      config: {
        driver: "memory",
        filePath: ".data/analytics-events.json",
        databaseUrl: "",
        tableName: "website_analytics_events",
      },
      retentionDays: 30,
      maxIdleSeconds: 900,
      minEvents24h: 1,
    });

    expect(snapshot.status).toBe("degraded");
    expect(snapshot.alerts).toContain("NO_EVENTS_RECEIVED");
    expect(snapshot.level).toBe("warn");
  });

  test("marks critical level for ingest idle alert", () => {
    const snapshot = buildAnalyticsHealthSnapshot({
      events: [
        {
          name: "page_view",
          payload: {
            locale: "en",
            page: "/en",
            referrer: "direct",
            timestamp: "2026-03-15T00:00:00.000Z",
            device_type: "desktop",
          },
          receivedAt: "2024-03-15T00:00:01.000Z",
        },
      ],
      config: {
        driver: "memory",
        filePath: ".data/analytics-events.json",
        databaseUrl: "",
        tableName: "website_analytics_events",
      },
      retentionDays: 30,
      maxIdleSeconds: 60,
      minEvents24h: 1,
    });

    expect(snapshot.level).toBe("critical");
    expect(snapshot.alerts).toContain("EVENT_INGEST_IDLE_TOO_LONG");
  });

  test("readiness fails when level is critical", () => {
    const ready = buildAnalyticsReadySnapshot({
      config: {
        driver: "memory",
        filePath: ".data/analytics-events.json",
        databaseUrl: "",
        tableName: "website_analytics_events",
      },
      level: "critical",
    });
    expect(ready.ready).toBe(false);
    expect(ready.reasons).toContain("HEALTH_LEVEL_CRITICAL");
  });
});
