import type { Agent, AgentCapability } from "../directory/agent.store";
import {
  buildUserFacingMessageFromReasonCodes,
  type UserFacingLocaleBundle,
} from "@gaialynk/shared";

export interface TrustDecision {
  decision: "allow" | "allow_limited" | "need_confirmation" | "deny";
  reason_codes: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  policy_version: string;
  policy_rule_id: string;
  explain_text: string;
  /** Trilingual copy derived from `reason_codes` for session cards and review UI */
  user_facing_message: UserFacingLocaleBundle;
  required_actions?: string[];
  constraints?: Record<string, unknown>;
  evidence_refs?: string[];
  expires_at?: string;
}

const withUserFacing = <T extends Omit<TrustDecision, "user_facing_message">>(d: T): TrustDecision => ({
  ...d,
  user_facing_message: buildUserFacingMessageFromReasonCodes(d.reason_codes),
});

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
    return withUserFacing({
      decision: "deny",
      reason_codes: ["identity_unverified"],
      risk_level: "critical",
      policy_version: "trust-policy-v1",
      policy_rule_id: "identity_required",
      explain_text: "Agent identity is missing or invalid.",
    });
  }

  if (!input.capability) {
    return withUserFacing({
      decision: "deny",
      reason_codes: ["capability_not_declared"],
      risk_level: "critical",
      policy_version: "trust-policy-v1",
      policy_rule_id: "capability_required",
      explain_text: "Requested capability is not declared.",
    });
  }

  if (input.capability.risk_level === "critical") {
    return withUserFacing({
      decision: "deny",
      reason_codes: ["risk_critical_denied"],
      risk_level: "critical",
      policy_version: "trust-policy-v1",
      policy_rule_id: "critical_denied",
      explain_text: "Critical risk capability is denied by policy.",
    });
  }

  if (input.capability.risk_level === "high") {
    return withUserFacing({
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
    });
  }

  return withUserFacing({
    decision: "allow",
    reason_codes: ["identity_verified", "capability_declared", "risk_acceptable"],
    risk_level: input.capability.risk_level,
    policy_version: "trust-policy-v1",
    policy_rule_id: "risk_acceptable_allow",
    explain_text: "Capability risk is acceptable under current policy.",
  });
};

/** E-20: desktop Connector file operations (Web-proxied → device). */
export const evaluateDesktopConnectorFileTrust = (input: {
  action: "file_list" | "file_read" | "file_write";
  /** When true, treat as first write under a new path prefix → high / need_confirmation. */
  write_targets_new_path_prefix: boolean;
}): TrustDecision => {
  if (input.action === "file_list" || input.action === "file_read") {
    return withUserFacing({
      decision: "allow",
      reason_codes: ["desktop_file_read_allow"],
      risk_level: "medium",
      policy_version: "trust-policy-v1",
      policy_rule_id: "desktop_read_list_medium",
      explain_text: "Desktop file list/read is allowed with medium risk labeling.",
    });
  }

  if (input.write_targets_new_path_prefix) {
    return withUserFacing({
      decision: "need_confirmation",
      reason_codes: ["desktop_write_new_prefix_requires_confirmation"],
      risk_level: "high",
      policy_version: "trust-policy-v1",
      policy_rule_id: "desktop_write_high",
      explain_text: "First write under a new directory prefix requires user confirmation.",
      required_actions: ["user_confirmation"],
    });
  }

  return withUserFacing({
    decision: "allow",
    reason_codes: ["desktop_write_known_prefix_allow"],
    risk_level: "medium",
    policy_version: "trust-policy-v1",
    policy_rule_id: "desktop_write_medium",
    explain_text: "Write within an already-used path prefix is allowed with medium risk.",
  });
};
