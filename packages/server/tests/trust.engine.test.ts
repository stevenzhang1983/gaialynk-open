import { describe, expect, it } from "vitest";
import type { Agent } from "../src/modules/directory/agent.store";
import { evaluateTrustDecision } from "../src/modules/trust/trust.engine";

const baseAgent: Agent = {
  id: "agent-1",
  name: "Agent",
  description: "desc",
  agent_type: "logical",
  source_url: "https://example.com/agent",
  capabilities: [{ name: "task", risk_level: "low" }],
  created_at: new Date().toISOString(),
};

describe("trust.engine", () => {
  it("returns deny when identity is invalid", () => {
    const decision = evaluateTrustDecision({
      agent: { ...baseAgent, id: "" },
      capability: baseAgent.capabilities[0],
      context: { conversationId: "c1", actorId: "u1" },
    });

    expect(decision.decision).toBe("deny");
    expect(decision.reason_codes).toContain("identity_unverified");
    expect(decision.policy_version).toBe("trust-policy-v1");
    expect(decision.policy_rule_id).toBe("identity_required");
  });

  it("returns deny when capability is missing", () => {
    const decision = evaluateTrustDecision({
      agent: baseAgent,
      capability: undefined,
      context: { conversationId: "c1", actorId: "u1" },
    });

    expect(decision.decision).toBe("deny");
    expect(decision.reason_codes).toContain("capability_not_declared");
    expect(decision.policy_rule_id).toBe("capability_required");
  });

  it("returns deny for critical risk", () => {
    const decision = evaluateTrustDecision({
      agent: baseAgent,
      capability: { name: "critical", risk_level: "critical" },
      context: { conversationId: "c1", actorId: "u1" },
    });

    expect(decision.decision).toBe("deny");
    expect(decision.reason_codes).toContain("risk_critical_denied");
    expect(decision.policy_rule_id).toBe("critical_denied");
  });

  it("returns need_confirmation for high risk", () => {
    const decision = evaluateTrustDecision({
      agent: baseAgent,
      capability: { name: "high", risk_level: "high" },
      context: { conversationId: "c1", actorId: "u1" },
    });

    expect(decision.decision).toBe("need_confirmation");
    expect(decision.required_actions).toContain("user_confirmation");
    expect(decision.policy_rule_id).toBe("high_requires_confirmation");
  });

  it("returns allow for low risk", () => {
    const decision = evaluateTrustDecision({
      agent: baseAgent,
      capability: { name: "low", risk_level: "low" },
      context: { conversationId: "c1", actorId: "u1" },
    });

    expect(decision.decision).toBe("allow");
    expect(decision.reason_codes).toContain("risk_acceptable");
    expect(decision.policy_rule_id).toBe("risk_acceptable_allow");
  });
});
