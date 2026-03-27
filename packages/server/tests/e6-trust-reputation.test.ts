/**
 * E-6 V1.3: Trust user-facing copy, review-queue summary, trust_badge, feedback→retest, report uphold.
 */
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("E-6 trust policy user surface + reputation loop", () => {
  it("high-risk message exposes trilingual user_facing_message and review-queue user_facing_summary", async () => {
    const app = createApp();

    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E6 Trust" }),
    });
    expect(conversationRes.status).toBe(201);
    const conversationId = ((await conversationRes.json()) as { data: { id: string } }).data.id;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E6 High",
        description: "high",
        agent_type: "execution",
        source_url: "mock://e6-high",
        capabilities: [{ name: "danger", risk_level: "high" }],
      }),
    });
    expect(agentRes.status).toBe(201);
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "e6-user", text: "do risky thing" }),
    });
    expect(msgRes.status).toBe(202);
    const msgBody = (await msgRes.json()) as {
      meta: { trust_decision: { user_facing_message: { zh: string; en: string; ja: string } } };
    };
    expect(msgBody.meta.trust_decision.user_facing_message.zh).toContain("风险");

    const qRes = await app.request("/api/v1/review-queue?actor_id=e6-reviewer");
    expect(qRes.status).toBe(200);
    const qBody = (await qRes.json()) as {
      data: Array<{ user_facing_summary: { zh: string; en: string; ja: string } }>;
    };
    expect(qBody.data.length).toBeGreaterThanOrEqual(1);
    const row = qBody.data.find((x) => true);
    expect(row?.user_facing_summary.zh.length).toBeGreaterThan(3);
    expect(row?.user_facing_summary.en.length).toBeGreaterThan(3);
    expect(row?.user_facing_summary.ja.length).toBeGreaterThan(3);
  });

  it("GET /api/v1/agents/:id returns trust_badge", async () => {
    const app = createApp();
    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E6 Badge",
        description: "x",
        agent_type: "execution",
        source_url: "mock://e6-badge",
        capabilities: [{ name: "t", risk_level: "low" }],
        source_origin: "official",
      }),
    });
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;
    const getRes = await app.request(`/api/v1/agents/${agentId}`);
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { data: { trust_badge: string } };
    expect(["unverified", "consumer_ready", "high_sensitivity_enhanced"]).toContain(body.data.trust_badge);
  });

  it("three not_helpful feedbacks with same reason enqueue retest (memory or PG)", async () => {
    const app = createApp();
    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E6 Feedback",
        description: "x",
        agent_type: "execution",
        source_url: "mock://e6-fb",
        capabilities: [{ name: "t", risk_level: "low" }],
      }),
    });
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;
    const fakeAsk = "00000000-0000-4000-8000-000000000099";
    let lastRetest = false;
    for (let i = 0; i < 3; i++) {
      const fr = await app.request("/api/v1/feedback/agent-runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ask_run_id: fakeAsk,
          agent_id: agentId,
          quality: 2,
          speed: 2,
          stability: 2,
          meets_expectation: 1,
          usefulness: "not_helpful",
          reason_code: "output_incorrect",
        }),
      });
      expect(fr.status).toBeGreaterThanOrEqual(200);
      const b = (await fr.json()) as { data: { retest_enqueued?: boolean } };
      lastRetest = Boolean(b.data.retest_enqueued);
    }
    expect(lastRetest).toBe(true);

    const rq = await app.request("/api/v1/trust/retest-queue?actor_id=e6-ops");
    expect(rq.status).toBe(200);
    const rqBody = (await rq.json()) as { data: Array<{ agent_id: string; reason_code: string }> };
    expect(rqBody.data.some((r) => r.agent_id === agentId && r.reason_code === "output_incorrect")).toBe(
      true,
    );
  });

  it("agent report upheld deprecates agent and notifies historical users", async () => {
    const app = createApp();

    const convRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E6 Report" }),
    });
    const conversationId = ((await convRes.json()) as { data: { id: string } }).data.id;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E6 Report Agent",
        description: "x",
        agent_type: "execution",
        source_url: "mock://e6-report",
        capabilities: [{ name: "h", risk_level: "high" }],
      }),
    });
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "hist-user-1", text: "trigger review" }),
    });

    const reportRes = await app.request(`/api/v1/agents/${agentId}/user-reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reporter_id: "hist-user-1",
        reason_code: "malicious_behavior",
        detail: "test",
      }),
    });
    expect(reportRes.status).toBe(201);
    const reportId = ((await reportRes.json()) as { data: { id: string } }).data.id;

    const upRes = await app.request(`/api/v1/agent-user-reports/${reportId}/uphold`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ arbitrator_id: "reviewer-e6" }),
    });
    expect(upRes.status).toBe(200);
    const upBody = (await upRes.json()) as { data: { notified_user_count: number } };
    expect(upBody.data.notified_user_count).toBeGreaterThanOrEqual(1);

    const agRes = await app.request(`/api/v1/agents/${agentId}`);
    const agBody = (await agRes.json()) as { data: { status: string; trust_badge: string } };
    expect(agBody.data.status).toBe("deprecated");
    expect(agBody.data.trust_badge).toBe("unverified");

    const notifRes = await app.request("/api/v1/users/hist-user-1/notifications?limit=20");
    expect(notifRes.status).toBe(200);
    const notifBody = (await notifRes.json()) as {
      data: Array<{ event_type: string }>;
    };
    expect(notifBody.data.some((n) => n.event_type === "trust.agent_report.upheld")).toBe(true);
  });

  it("invocation confirm accepts optional user_decision_reason", async () => {
    const app = createApp();
    const conversationRes = await app.request("/api/v1/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "E6 Confirm reason" }),
    });
    const conversationId = ((await conversationRes.json()) as { data: { id: string } }).data.id;

    const agentRes = await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "E6 Confirm",
        description: "x",
        agent_type: "execution",
        source_url: "mock://e6-confirm",
        capabilities: [{ name: "h", risk_level: "high" }],
      }),
    });
    const agentId = ((await agentRes.json()) as { data: { id: string } }).data.id;

    await app.request(`/api/v1/conversations/${conversationId}/agents`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId }),
    });

    const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sender_id: "e6-approver", text: "go" }),
    });
    const invId = ((await msgRes.json()) as { meta: { invocation_id: string } }).meta.invocation_id;

    const confRes = await app.request(`/api/v1/invocations/${invId}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        approver_id: "e6-approver",
        user_decision_reason: "业务已评估可执行",
      }),
    });
    expect(confRes.status).toBe(200);
  });
});
