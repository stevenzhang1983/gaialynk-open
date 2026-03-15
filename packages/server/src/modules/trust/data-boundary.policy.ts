export interface DataBoundaryDecision {
  decision: "allow" | "deny";
  reason_codes: string[];
  risk_level: "low" | "medium" | "high";
  sanitized_text?: string;
}

interface EvaluateDataBoundaryInput {
  text: string;
}

const INJECTION_PATTERNS: Array<{ regex: RegExp; reasonCode: string }> = [
  { regex: /\bignore\s+previous\s+instructions?\b/i, reasonCode: "prompt_injection_ignore_previous" },
  { regex: /\bsystem\s+prompt\b/i, reasonCode: "prompt_injection_system_prompt_exfiltration" },
  { regex: /<\s*system\s*>/i, reasonCode: "prompt_injection_system_tag" },
  { regex: /\b(api[\s_-]?key|secret|token)\b/i, reasonCode: "sensitive_data_exfiltration_attempt" },
];

export const evaluateDataBoundaryPolicy = (input: EvaluateDataBoundaryInput): DataBoundaryDecision => {
  const text = input.text.trim();
  for (const rule of INJECTION_PATTERNS) {
    if (rule.regex.test(text)) {
      return {
        decision: "deny",
        reason_codes: [rule.reasonCode],
        risk_level: "high",
      };
    }
  }

  return {
    decision: "allow",
    reason_codes: ["boundary_pass"],
    risk_level: "low",
    sanitized_text: text,
  };
};
