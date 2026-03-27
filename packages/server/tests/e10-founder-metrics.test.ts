/**
 * E-10 V1.3: 产品埋点表、Founder 看板 API、注册落库事件。
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { isProductEventName, PRODUCT_EVENT_NAMES } from "../src/modules/product-events/product-events.types";
import { buildFounderSnapshotAsync } from "../src/modules/product-events/product-events.router";

async function registerAndToken(
  app: ReturnType<typeof createApp>,
  email: string,
  password: string,
): Promise<{ userId: string; token: string }> {
  const reg = await app.request("/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  expect(reg.status).toBe(201);
  const body = (await reg.json()) as { data: { access_token: string; user: { id: string } } };
  return { userId: body.data.user.id, token: body.data.access_token };
}

describe("E-10 founder metrics + product events", () => {
  it("PRODUCT_EVENT_NAMES are stable and isProductEventName guards unknown", () => {
    expect(PRODUCT_EVENT_NAMES).toContain("user.registered");
    expect(isProductEventName("user.registered")).toBe(true);
    expect(isProductEventName("not_an_event")).toBe(false);
  });

  it("registration records user.registered when DATABASE_URL is set", async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }
    const app = createApp();
    const email = `e10-founder-${Date.now()}@example.com`;
    const { userId, token } = await registerAndToken(app, email, "password123");

    const snap = await app.request("/api/v1/founder-metrics/snapshot?days=30", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(snap.status).toBe(200);
    const snapBody = (await snap.json()) as {
      data: { event_totals: Record<string, number>; funnel: { registered_users: number } };
    };
    expect(snapBody.data.event_totals["user.registered"]).toBeGreaterThanOrEqual(1);
    expect(snapBody.data.funnel.registered_users).toBeGreaterThanOrEqual(1);

    const csv = await app.request("/api/v1/founder-metrics/export.csv?days=30&limit=500", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(csv.status).toBe(200);
    const text = await csv.text();
    expect(text).toContain("user.registered");
    expect(text).toContain(userId);
  });

  it("buildFounderSnapshotAsync returns funnel shape", async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }
    const s = await buildFounderSnapshotAsync(7);
    expect(s.days).toBe(7);
    expect(typeof s.funnel.registered_users).toBe("number");
    expect(s.website_funnel.note.length).toBeGreaterThan(10);
  });
});
