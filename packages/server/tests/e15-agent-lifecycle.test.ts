/**
 * E-15 V1.3.1: Agent listing lifecycle (maintenance / delisted) + shared reason_codes.
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import { REASON_CODE_USER_FACING } from "@gaialynk/shared";
import type { Agent } from "../src/modules/directory/agent.store";
import * as agentStore from "../src/modules/directory/agent.store";
import {
  AgentDelistedGatewayError,
  AgentMaintenanceGatewayError,
  requestAgent,
} from "../src/modules/gateway/a2a.gateway";
import { sessionInvocationContext } from "../src/modules/gateway/invocation-context";

const mockAgent = (): Agent => ({
  id: "e15-agent-1",
  name: "E15 Mock",
  description: "test",
  agent_type: "execution",
  source_url: "mock://e15",
  capabilities: [{ name: "summarize", risk_level: "low" }],
  created_at: new Date().toISOString(),
  max_concurrent: 1,
  queue_behavior: "queue",
  timeout_ms: null,
  supports_scheduled: false,
  memory_tier: "none",
  listing_status: "listed",
});

describe("E-15 reason_codes shared package", () => {
  it("includes gateway lifecycle codes with non-empty i18n", () => {
    expect(REASON_CODE_USER_FACING.agent_maintenance?.zh.length).toBeGreaterThan(0);
    expect(REASON_CODE_USER_FACING.agent_maintenance?.en.length).toBeGreaterThan(0);
    expect(REASON_CODE_USER_FACING.agent_maintenance?.ja.length).toBeGreaterThan(0);
    expect(REASON_CODE_USER_FACING.agent_delisted?.zh.length).toBeGreaterThan(0);
  });
});

describe("E-15 requestAgent listing gate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws AgentMaintenanceGatewayError when listing is maintenance (pre-gate)", async () => {
    vi.spyOn(agentStore, "getAgentListingStatusForGatewayAsync").mockResolvedValue("maintenance");
    await expect(
      requestAgent({
        agent: mockAgent(),
        userText: "hi",
        context: sessionInvocationContext({
          gaiaUserId: "u1",
          conversationId: "c1",
          runId: "r1",
          traceId: "t1",
        }),
      }),
    ).rejects.toBeInstanceOf(AgentMaintenanceGatewayError);
  });

  it("throws AgentDelistedGatewayError when listing is delisted (pre-gate)", async () => {
    vi.spyOn(agentStore, "getAgentListingStatusForGatewayAsync").mockResolvedValue("delisted");
    await expect(
      requestAgent({
        agent: mockAgent(),
        userText: "hi",
        context: sessionInvocationContext({
          gaiaUserId: "u1",
          conversationId: "c1",
          runId: "r1",
          traceId: "t1",
        }),
      }),
    ).rejects.toBeInstanceOf(AgentDelistedGatewayError);
  });

  it("throws AgentMaintenanceGatewayError when gate flips to maintenance before slot work", async () => {
    let n = 0;
    vi.spyOn(agentStore, "getAgentListingStatusForGatewayAsync").mockImplementation(async () => {
      n += 1;
      return n === 1 ? "listed" : "maintenance";
    });
    await expect(
      requestAgent({
        agent: mockAgent(),
        userText: "hi",
        context: sessionInvocationContext({
          gaiaUserId: "u1",
          conversationId: "c1",
          runId: "r1",
          traceId: "t1",
        }),
      }),
    ).rejects.toBeInstanceOf(AgentMaintenanceGatewayError);
  });

  it("exposes user_facing_message on gateway errors", async () => {
    vi.spyOn(agentStore, "getAgentListingStatusForGatewayAsync").mockResolvedValue("delisted");
    try {
      await requestAgent({
        agent: mockAgent(),
        userText: "hi",
        context: sessionInvocationContext({
          gaiaUserId: "u1",
          conversationId: "c1",
          runId: "r1",
          traceId: "t1",
        }),
      });
      expect.fail("expected throw");
    } catch (e) {
      expect(e).toBeInstanceOf(AgentDelistedGatewayError);
      const err = e as AgentDelistedGatewayError;
      expect(err.user_facing_message.zh).toContain("下架");
    }
  });
});

describe("E-15 parseAgentChangelog", () => {
  it("parses valid changelog array", async () => {
    const { parseAgentChangelog } = await import("../src/modules/directory/agent.store");
    const raw = [
      { version: "1.1.0", summary: "Fixes", breaking: false, created_at: "2026-01-01T00:00:00.000Z" },
    ];
    const parsed = parseAgentChangelog(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]!.version).toBe("1.1.0");
  });
});
