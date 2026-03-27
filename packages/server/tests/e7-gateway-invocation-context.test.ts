/**
 * E-7 V1.3: Invocation Context header shape, per-agent concurrency gate, pool failover order.
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  INVOCATION_CONTEXT_HEADER,
  buildInvocationContextHeaderValue,
  parseInvocationContextHeaderValue,
  sessionInvocationContext,
} from "../src/modules/gateway/invocation-context";
import {
  InvocationCapacityFastFailError,
  resetInvocationCapacityForTests,
  withPerAgentConcurrency,
} from "../src/modules/gateway/invocation-capacity";
import { resetPoolRouterForTests, tryEndpointsWithFailover } from "../src/modules/gateway/pool-router";

describe("E-7 invocation context", () => {
  it("serializes session context for X-GaiaLynk-Invocation-Context", () => {
    const ctx = sessionInvocationContext({
      gaiaUserId: "user-1",
      conversationId: "conv-1",
      runId: "run-1",
      traceId: "trace-1",
    });
    const raw = buildInvocationContextHeaderValue(ctx);
    expect(JSON.parse(raw)).toEqual({
      gaia_user_id: "user-1",
      conversation_id: "conv-1",
      run_id: "run-1",
      invocation_source: "session",
      trace_id: "trace-1",
    });
    expect(parseInvocationContextHeaderValue(raw)).toEqual(ctx);
  });

  it("includes optional subscription_id", () => {
    const ctx = sessionInvocationContext({
      gaiaUserId: "u",
      conversationId: "c",
      runId: "r",
      traceId: "t",
      subscriptionId: "sub-9",
    });
    const parsed = parseInvocationContextHeaderValue(buildInvocationContextHeaderValue(ctx));
    expect(parsed.subscription_id).toBe("sub-9");
  });

  it("exposes stable header name constant", () => {
    expect(INVOCATION_CONTEXT_HEADER).toBe("X-GaiaLynk-Invocation-Context");
  });
});

describe("E-7 per-agent concurrency", () => {
  beforeEach(() => {
    resetInvocationCapacityForTests();
  });

  it("allows up to max_concurrent parallel executions", async () => {
    const agentId = "agent-cap-1";
    const delays: number[] = [];
    const p1 = withPerAgentConcurrency(agentId, 2, "queue", undefined, async () => {
      delays.push(1);
      await new Promise((r) => setTimeout(r, 20));
      return "a";
    });
    const p2 = withPerAgentConcurrency(agentId, 2, "queue", undefined, async () => {
      delays.push(2);
      await new Promise((r) => setTimeout(r, 20));
      return "b";
    });
    const out = await Promise.all([p1, p2]);
    expect(out.sort()).toEqual(["a", "b"]);
    expect(delays.length).toBe(2);
  });

  it("queues third call when max_concurrent=2", async () => {
    const agentId = "agent-cap-2";
    const order: string[] = [];
    const slow = async (tag: string) => {
      order.push(`${tag}-enter`);
      await new Promise((r) => setTimeout(r, 40));
      order.push(`${tag}-exit`);
      return tag;
    };
    const p1 = withPerAgentConcurrency(agentId, 2, "queue", undefined, () => slow("1"));
    const p2 = withPerAgentConcurrency(agentId, 2, "queue", undefined, () => slow("2"));
    const p3 = withPerAgentConcurrency(agentId, 2, "queue", undefined, async () => {
      order.push("3-enter");
      return "3";
    });
    await Promise.all([p1, p2, p3]);
    const firstExit = Math.min(order.indexOf("1-exit"), order.indexOf("2-exit"));
    expect(order.indexOf("3-enter")).toBeGreaterThan(firstExit);
  });

  it("fast_fail rejects when at capacity", async () => {
    const agentId = "agent-cap-3";
    const p1 = withPerAgentConcurrency(agentId, 1, "queue", undefined, async () => {
      await new Promise((r) => setTimeout(r, 40));
      return "held";
    });
    await new Promise((r) => setTimeout(r, 5));
    await expect(
      withPerAgentConcurrency(agentId, 1, "fast_fail", undefined, async () => "x"),
    ).rejects.toBeInstanceOf(InvocationCapacityFastFailError);
    await p1;
  });
});

describe("E-7 pool router failover", () => {
  beforeEach(() => {
    resetPoolRouterForTests();
  });

  it("rotates starting URL and tries next on failure", async () => {
    const agentId = "pool-1";
    let calls: string[] = [];
    await tryEndpointsWithFailover(agentId, ["http://bad", "http://good"], async (url) => {
      calls.push(url);
      if (url === "http://bad") throw new Error("down");
      return "ok";
    });
    expect(calls).toEqual(["http://bad", "http://good"]);
    calls = [];
    await tryEndpointsWithFailover(agentId, ["http://bad", "http://good"], async (url) => {
      calls.push(url);
      if (url === "http://bad") throw new Error("down");
      return "ok";
    });
    expect(calls).toEqual(["http://good"]);
  });
});
