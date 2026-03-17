import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline feedback and anti-abuse (P0-2 F)", () => {
  it("POST /api/v1/feedback/agent-runs accepts feedback tied to real ask run", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Feedback Agent",
        description: "for feedback",
        agent_type: "execution",
        source_url: "mock://feedback-agent",
        capabilities: [{ name: "feedback", risk_level: "low" }],
      }),
    });
    const askRes = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "feedback test" }),
    });
    expect(askRes.status).toBe(201);
    const askBody = await askRes.json();
    const runId = askBody.data.run_id as string;
    const agentId = askBody.data.route.selected_agent_ids[0] as string;
    expect(runId).toBeTypeOf("string");
    expect(agentId).toBeTypeOf("string");
    const feedbackRes = await app.request("/api/v1/feedback/agent-runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ask_run_id: runId,
        agent_id: agentId,
        quality: 5,
        speed: 4,
        stability: 5,
        meets_expectation: 5,
      }),
    });
    expect(feedbackRes.status).toBe(201);
    const feedbackBody = await feedbackRes.json();
    expect(feedbackBody.data.feedback_id).toBeTypeOf("string");
    expect(feedbackBody.data.accepted).toBe(true);
  });

  it("feedback without valid run is not counted in reputation (accepted: false)", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Rep Agent",
        description: "reputation",
        agent_type: "execution",
        source_url: "mock://rep-agent",
        capabilities: [{ name: "rep", risk_level: "low" }],
      }),
    });
    const agentsRes = await app.request("/api/v1/agents");
    const agentsBody = await agentsRes.json();
    const agents = agentsBody.data as Array<{ id: string }>;
    const agentId = agents[0]?.id ?? "";
    const fakeRunId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
    const feedbackRes = await app.request("/api/v1/feedback/agent-runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ask_run_id: fakeRunId,
        agent_id: agentId,
        quality: 5,
        speed: 5,
        stability: 5,
        meets_expectation: 5,
      }),
    });
    expect(feedbackRes.status).toBe(200);
    const feedbackBody = await feedbackRes.json();
    expect(feedbackBody.data.accepted).toBe(false);

    const repRes = await app.request(`/api/v1/reputation/agents/${agentId}`);
    expect(repRes.status).toBe(200);
    const repBody = await repRes.json();
    expect(repBody.data.structured_feedback_summary).toBeDefined();
    expect(repBody.data.structured_feedback_summary.valid_feedback_count).toBe(0);
    expect(repBody.data.structured_feedback_summary.abuse_flagged_count).toBeGreaterThanOrEqual(0);
  });

  it("GET /api/v1/reputation/agents/:id returns structured_feedback_summary", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Summary Agent",
        description: "summary",
        agent_type: "execution",
        source_url: "mock://summary",
        capabilities: [{ name: "sum", risk_level: "low" }],
      }),
    });
    const agentsRes = await app.request("/api/v1/agents");
    const agentId = (await agentsRes.json()).data[0].id;
    const repRes = await app.request(`/api/v1/reputation/agents/${agentId}`);
    expect(repRes.status).toBe(200);
    const rep = (await repRes.json()).data;
    expect(rep.structured_feedback_summary).toBeDefined();
    expect(typeof rep.structured_feedback_summary.valid_feedback_count).toBe("number");
    expect(typeof rep.structured_feedback_summary.quality_avg).toBe("number");
    expect(typeof rep.structured_feedback_summary.speed_avg).toBe("number");
    expect(typeof rep.structured_feedback_summary.stability_avg).toBe("number");
    expect(typeof rep.structured_feedback_summary.meets_expectation_avg).toBe("number");
    expect(typeof rep.structured_feedback_summary.abuse_flagged_count).toBe("number");
  });
});
