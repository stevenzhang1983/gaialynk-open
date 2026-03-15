import type { Agent, AgentCapability } from "../directory/agent.store";

export interface TrustDecision {
  decision: "allow" | "allow_limited" | "need_confirmation" | "deny";
  reason_codes: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  policy_version: string;
  policy_rule_id: string;
  explain_text: string;
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
      policy_version: "trust-policy-v1",
      policy_rule_id: "identity_required",
      explain_text: "Agent identity is missing or invalid.",
    };
  }

  if (!input.capability) {
    return {
      decision: "deny",
      reason_codes: ["capability_not_declared"],
      risk_level: "critical",
      policy_version: "trust-policy-v1",
      policy_rule_id: "capability_required",
      explain_text: "Requested capability is not declared.",
    };
  }

  if (input.capability.risk_level === "critical") {
    return {
      decision: "deny",
      reason_codes: ["risk_critical_denied"],
      risk_level: "critical",
      policy_version: "trust-policy-v1",
      policy_rule_id: "critical_denied",
      explain_text: "Critical risk capability is denied by policy.",
    };
  }

  if (input.capability.risk_level === "high") {
    return {
      decision: "need_confirmation",
      reason_codes: ["risk_high_requires_confirmation"],
      risk_level: "high",
      policy_version: "trust-policy-v1",
      policy_rule_id: "high_requires_confirmation",
      explain_text: "High risk capability requires explicit user confirmation.",
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
    policy_version: "trust-policy-v1",
    policy_rule_id: "risk_acceptable_allow",
    explain_text: "Capability risk is acceptable under current policy.",
  };
};
