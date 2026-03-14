import type { Agent, AgentCapability } from "../directory/agent.store";

export interface TrustDecision {
  decision: "allow" | "allow_limited" | "need_confirmation" | "deny";
  reason_codes: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  required_actions?: string[];
  constraints?: Record<string, unknown>;
  evidence_refs?: string[];
  expires_at?: string;
}

interface EvaluateTrustDecisionInput {
  agent: Agent;
  capability?: AgentCapability;
  context: {
    conversationId: string;
    actorId: string;
  };
}

export const evaluateTrustDecision = (input: EvaluateTrustDecisionInput): TrustDecision => {
  if (!input.agent.id.trim()) {
    return {
      decision: "deny",
      reason_codes: ["identity_unverified"],
      risk_level: "critical",
    };
  }

  if (!input.capability) {
    return {
      decision: "deny",
      reason_codes: ["capability_not_declared"],
      risk_level: "critical",
    };
  }

  if (input.capability.risk_level === "critical") {
    return {
      decision: "deny",
      reason_codes: ["risk_critical_denied"],
      risk_level: "critical",
    };
  }

  if (input.capability.risk_level === "high") {
    return {
      decision: "need_confirmation",
      reason_codes: ["risk_high_requires_confirmation"],
      risk_level: "high",
      required_actions: ["user_confirmation"],
      constraints: {
        conversation_id: input.context.conversationId,
        actor_id: input.context.actorId,
      },
    };
  }

  return {
    decision: "allow",
    reason_codes: ["identity_verified", "capability_declared", "risk_acceptable"],
    risk_level: input.capability.risk_level,
  };
};
