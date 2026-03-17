import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline A2A L3 evidence (P0-1 D)", () => {
  it("GET /api/v1/a2a/visualization/l3 returns evidence layer with policy_hit, reason_codes, receipt_refs, signature_digest", async () => {
    const app = createApp();
    const res = await app.request(
      "/api/v1/a2a/visualization/l3?mode=mock&window_days=7&limit=5",
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.level).toBe("l3");
    expect(body.data.source_mode).toBe("mock");
    expect(Array.isArray(body.data.items)).toBe(true);
    if (body.data.items.length > 0) {
      const item = body.data.items[0];
      expect(item.audit_event_id).toBeTypeOf("string");
      expect(item.timestamp).toBeTypeOf("string");
      expect(item.event_type).toBeTypeOf("string");
      expect(item.policy_hit).toBeTypeOf("string");
      expect(Array.isArray(item.reason_codes)).toBe(true);
      expect(Array.isArray(item.receipt_refs)).toBe(true);
      expect(item.signature_digest).toBeTypeOf("string");
    }
    expect(body.data.replay_anchor_ts).toBeTypeOf("string");
    expect(body.data.window_start_ts).toBeTypeOf("string");
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.has_more).toBe("boolean");
    expect(body.meta.page_size).toBe(5);
  });

  it("L3 supports replay_anchor_ts and cursor pagination (same error semantics as L2)", async () => {
    const app = createApp();
    const first = await app.request(
      "/api/v1/a2a/visualization/l3?mode=mock&window_days=7&limit=1",
    );
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    const cursor = firstBody.meta?.next_cursor;
    if (cursor) {
      const second = await app.request(
        `/api/v1/a2a/visualization/l3?mode=mock&window_days=7&limit=1&cursor=${cursor}`,
      );
      expect(second.status).toBe(200);
    }
    const badCursor = await app.request(
      "/api/v1/a2a/visualization/l3?mode=mock&window_days=7&cursor=invalid-base64!!!",
    );
    expect(badCursor.status).toBe(400);
    const badBody = await badCursor.json();
    expect(badBody.error?.code).toBeDefined();
    expect(badBody.meta?.recoverable).toBe(true);
    expect(badBody.meta?.recovery_hint).toBeTypeOf("string");
  });

  it("GET /api/v1/a2a/visualization/l3/export returns audit package", async () => {
    const app = createApp();
    const res = await app.request(
      "/api/v1/a2a/visualization/l3/export?mode=mock&window_days=7",
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.export_type).toBe("a2a_l3_evidence_audit");
    expect(body.data.replay_anchor_ts).toBeTypeOf("string");
    expect(body.data.window_start_ts).toBeTypeOf("string");
    expect(Array.isArray(body.data.items)).toBe(true);
    if (body.data.items.length > 0) {
      const item = body.data.items[0];
      expect(item.audit_event_id).toBeDefined();
      expect(item.reason_codes).toBeDefined();
      expect(item.receipt_refs).toBeDefined();
    }
  });
});
