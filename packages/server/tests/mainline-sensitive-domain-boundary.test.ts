import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline sensitive domain and data boundary (P0-2 H)", () => {
  it("POST /ask with category medical returns risk_disclaimer and reason_code", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Medical Helper",
        description: "medical",
        agent_type: "execution",
        source_url: "mock://medical",
        capabilities: [{ name: "medical", risk_level: "low" }],
      }),
    });
    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "symptoms check",
        category: "medical",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta).toBeDefined();
    expect(body.meta.risk_disclaimer).toBeDefined();
    expect(typeof body.meta.risk_disclaimer).toBe("string");
    expect(body.meta.risk_disclaimer_reason_code).toBe("sensitive_domain_disclaimer");
  });

  it("POST /ask with category legal returns risk_disclaimer", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Legal Helper",
        description: "legal",
        agent_type: "execution",
        source_url: "mock://legal",
        capabilities: [{ name: "legal", risk_level: "low" }],
      }),
    });
    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "contract review", category: "legal" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta?.risk_disclaimer).toBeDefined();
    expect(body.meta?.risk_disclaimer_reason_code).toBe("sensitive_domain_disclaimer");
  });

  it("POST /ask with data_use_boundary not_for_retraining returns reason_code and emits audit", async () => {
    const app = createApp();
    await app.request("/api/v1/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "General Agent",
        description: "general",
        agent_type: "execution",
        source_url: "mock://general",
        capabilities: [{ name: "general", risk_level: "low" }],
      }),
    });
    const res = await app.request("/api/v1/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: "summarize",
        data_use_boundary: "not_for_retraining",
      }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.meta?.data_use_boundary_reason_code).toBe("not_for_retraining_boundary");

    const auditRes = await app.request(
      "/api/v1/audit-events?event_type=ask.data_use_boundary&limit=5",
    );
    expect(auditRes.status).toBe(200);
    const auditBody = await auditRes.json();
    const events = auditBody.data ?? [];
    const boundaryEvent = events.find(
      (e: { event_type: string }) => e.event_type === "ask.data_use_boundary",
    );
    expect(boundaryEvent).toBeDefined();
    expect(boundaryEvent.payload?.boundary).toBe("not_for_retraining");
    expect(boundaryEvent.payload?.reason_code).toBe("not_for_retraining_boundary");
  });
});
