import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("a2a visualization reporting", () => {
  it("serves stable mock contract for L1 and L2", async () => {
    const app = createApp();

    const l1Res = await app.request("/api/v1/a2a/visualization/l1?mode=mock&window_days=7");
    expect(l1Res.status).toBe(200);
    const l1Body = await l1Res.json();
    expect(l1Body.data.source_mode).toBe("mock");
    expect(l1Body.data.level).toBe("l1");
    expect(l1Body.data.data_version).toBe("a2a-vis-v1-mock-w7");
    expect(typeof l1Body.data.replay_anchor_ts).toBe("string");
    expect(l1Body.data.summary).toHaveProperty("total_invocations");
    expect(l1Body.data.summary).toHaveProperty("avg_duration_ms");

    const l2Res = await app.request("/api/v1/a2a/visualization/l2?mode=mock&window_days=7&limit=2");
    expect(l2Res.status).toBe(200);
    const l2Body = await l2Res.json();
    expect(l2Body.data.source_mode).toBe("mock");
    expect(l2Body.data.level).toBe("l2");
    expect(l2Body.data.data_version).toBe("a2a-vis-v1-mock-w7");
    expect(l2Body.data.replay_anchor_ts).toBe(l1Body.data.replay_anchor_ts);
    expect(Array.isArray(l2Body.data.timeline)).toBe(true);
    expect(l2Body.data.timeline.length).toBe(2);
    expect(l2Body.meta.next_cursor).toBeTypeOf("string");
    expect(l2Body.meta.has_more).toBe(true);
    expect(l2Body.meta.page_size).toBe(2);
    expect(l2Body.meta.returned_count).toBe(2);
    expect(l2Body.meta.remaining_items).toBeGreaterThanOrEqual(1);

    const nextRes = await app.request(
      `/api/v1/a2a/visualization/l2?mode=mock&window_days=7&limit=2&cursor=${l2Body.meta.next_cursor}`,
    );
    expect(nextRes.status).toBe(200);
    const nextBody = await nextRes.json();
    expect(Array.isArray(nextBody.data.timeline)).toBe(true);
    expect(nextBody.data.timeline.length).toBeGreaterThanOrEqual(1);
    expect(nextBody.meta.has_more).toBe(false);
    expect(nextBody.meta.next_cursor).toBeUndefined();
    expect(nextBody.meta.remaining_items).toBe(0);
  });

  it("aggregates real invocation events for L1 and L2", async () => {
    const app = createApp();
    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "A2A Visualization Conversation" }),
    });
    const conversationId = (await convRes.json()).data.id as string;

    const lowAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "A2A Low Agent",
        description: "summary",
        agent_type: "execution",
        source_url: "mock://a2a-low",
        capabilities: [{ name: "summarize", risk_level: "low" }],
      }),
    });
    const lowAgentId = (await lowAgentRes.json()).data.id as string;

    const criticalAgentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "A2A Critical Agent",
        description: "dangerous",
        agent_type: "execution",
        source_url: "mock://a2a-critical",
        capabilities: [{ name: "delete", risk_level: "critical" }],
      }),
    });
    const criticalAgentId = (await criticalAgentRes.json()).data.id as string;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: lowAgentId }),
    });
    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: criticalAgentId }),
    });

    await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "a2a-user",
        text: "run summary",
        target_agent_ids: [lowAgentId],
      }),
    });
    await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "a2a-user",
        text: "run critical",
        target_agent_ids: [criticalAgentId],
      }),
    });

    const l1Res = await app.request("/api/v1/a2a/visualization/l1?mode=real&window_days=7");
    expect(l1Res.status).toBe(200);
    const l1Body = await l1Res.json();
    expect(l1Body.data.source_mode).toBe("real");
    expect(l1Body.data.data_version).toBe("a2a-vis-v1-real-w7");
    expect(typeof l1Body.data.replay_anchor_ts).toBe("string");
    expect(l1Body.data.summary.total_invocations).toBeGreaterThanOrEqual(2);
    expect(l1Body.data.summary.completed_invocations).toBeGreaterThanOrEqual(1);
    expect(l1Body.data.summary.denied_invocations).toBeGreaterThanOrEqual(1);

    const l2Res = await app.request("/api/v1/a2a/visualization/l2?mode=real&window_days=7&limit=1");
    expect(l2Res.status).toBe(200);
    const l2Body = await l2Res.json();
    expect(Array.isArray(l2Body.data.timeline)).toBe(true);
    expect(l2Body.data.timeline.length).toBe(1);
    expect(typeof l2Body.data.replay_anchor_ts).toBe("string");
    expect(l2Body.meta.page_size).toBe(1);
    expect(l2Body.meta.returned_count).toBe(1);
    expect(l2Body.meta.remaining_items).toBeGreaterThanOrEqual(0);
    expect(typeof l2Body.meta.has_more).toBe("boolean");
    const firstTimelineFirstPage = JSON.stringify(l2Body.data.timeline);
    const replayAnchorTs = l2Body.data.replay_anchor_ts as string;

    await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sender_id: "a2a-user",
        text: "run another summary after anchor",
        target_agent_ids: [lowAgentId],
      }),
    });

    const anchoredRes = await app.request(
      `/api/v1/a2a/visualization/l2?mode=real&window_days=7&limit=1&replay_anchor_ts=${encodeURIComponent(
        replayAnchorTs,
      )}`,
    );
    expect(anchoredRes.status).toBe(200);
    const anchoredBody = await anchoredRes.json();
    expect(anchoredBody.data.replay_anchor_ts).toBe(replayAnchorTs);
    expect(JSON.stringify(anchoredBody.data.timeline)).toBe(firstTimelineFirstPage);

    const collectedEventTypes: string[] = l2Body.data.timeline.map(
      (item: { event_type: string }) => item.event_type,
    );
    if (typeof l2Body.meta.next_cursor === "string") {
      const nextRes = await app.request(
        `/api/v1/a2a/visualization/l2?mode=real&window_days=7&limit=1&cursor=${l2Body.meta.next_cursor}`,
      );
      expect(nextRes.status).toBe(200);
      const nextBody = await nextRes.json();
      for (const item of nextBody.data.timeline as Array<{ event_type: string }>) {
        collectedEventTypes.push(item.event_type);
      }
    }
    expect(collectedEventTypes.includes("invocation.completed")).toBe(true);
  });

  it("returns explicit cursor error semantics for invalid or mismatched cursor", async () => {
    const app = createApp();

    const invalidCursorRes = await app.request(
      "/api/v1/a2a/visualization/l2?mode=mock&window_days=7&cursor=not-a-valid-cursor",
    );
    expect(invalidCursorRes.status).toBe(400);
    const invalidCursorBody = await invalidCursorRes.json();
    expect(invalidCursorBody.error.code).toBe("invalid_a2a_cursor");
    expect(invalidCursorBody.meta.recoverable).toBe(true);
    expect(typeof invalidCursorBody.meta.recovery_hint).toBe("string");

    const firstPageRes = await app.request("/api/v1/a2a/visualization/l2?mode=mock&window_days=7&limit=1");
    expect(firstPageRes.status).toBe(200);
    const firstPageBody = await firstPageRes.json();
    expect(typeof firstPageBody.meta.next_cursor).toBe("string");

    const mismatchRes = await app.request(
      `/api/v1/a2a/visualization/l2?mode=real&window_days=7&cursor=${firstPageBody.meta.next_cursor}`,
    );
    expect(mismatchRes.status).toBe(400);
    const mismatchBody = await mismatchRes.json();
    expect(mismatchBody.error.code).toBe("a2a_cursor_context_mismatch");
    expect(mismatchBody.meta.recoverable).toBe(true);
  });
});
