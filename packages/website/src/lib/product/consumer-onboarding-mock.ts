import {
  formatConsumerMockAssistant,
  getConsumerSuggestedPrompts,
} from "@/content/onboarding/consumer-onboarding-copy";
import type { Locale } from "@/lib/i18n/locales";
import type { Agent } from "./agent-types";
import { MOCK_AGENTS } from "./mock-agents";

/** T-4.7 引导中「推荐 Agent」固定为 Mock 目录中的若干 id（与 MOCK_AGENTS 对齐）。 */
export const CONSUMER_ONBOARDING_RECOMMENDED_AGENT_IDS = ["agent-1", "agent-3", "agent-2"] as const;

export function getRecommendedAgentsForOnboarding(): Agent[] {
  return CONSUMER_ONBOARDING_RECOMMENDED_AGENT_IDS.map((id) => MOCK_AGENTS.find((a) => a.id === id)).filter(
    (a): a is Agent => Boolean(a),
  );
}

export const DEFAULT_ONBOARDING_AGENT_ID = CONSUMER_ONBOARDING_RECOMMENDED_AGENT_IDS[0];

/** @deprecated 使用 `getConsumerSuggestedPrompts(locale)`（T-6.5 三语） */
export const ONBOARDING_SUGGESTED_PROMPTS: string[] = getConsumerSuggestedPrompts("en");

export { getConsumerSuggestedPrompts };

export type MockInvocationReceipt = {
  receiptId: string;
  invocationId: string;
  trustDecision: "allow" | "allow_limited" | "need_confirmation" | "deny";
  routedAgentId: string;
  routedAgentName: string;
  completedAt: string;
};

/** 防止开放重定向：仅允许同 locale 站内相对路径。 */
export function sanitizeConsumerOnboardingReturnUrl(locale: Locale, raw: string): string {
  const fallback = `/${locale}/app/chat`;
  if (!raw.startsWith("/")) return fallback;
  if (!raw.startsWith(`/${locale}/`)) return fallback;
  if (raw.includes("//") || raw.includes("://")) return fallback;
  return raw;
}

export function buildMockReceipt(
  agent: Agent,
  userMessage: string,
  locale: Locale = "en",
): { assistantText: string; receipt: MockInvocationReceipt } {
  const assistantText = formatConsumerMockAssistant(agent, userMessage, locale);
  const receipt: MockInvocationReceipt = {
    receiptId: `rcpt_demo_${Date.now().toString(36)}`,
    invocationId: `inv_demo_${Math.random().toString(36).slice(2, 10)}`,
    trustDecision: "allow",
    routedAgentId: agent.id,
    routedAgentName: agent.name,
    completedAt: new Date().toISOString(),
  };
  return { assistantText, receipt };
}
