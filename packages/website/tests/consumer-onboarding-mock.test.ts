import { describe, expect, it } from "vitest";
import {
  CONSUMER_ONBOARDING_RECOMMENDED_AGENT_IDS,
  buildMockReceipt,
  getRecommendedAgentsForOnboarding,
  ONBOARDING_SUGGESTED_PROMPTS,
  sanitizeConsumerOnboardingReturnUrl,
} from "../src/lib/product/consumer-onboarding-mock";
import { MOCK_AGENTS } from "../src/lib/product/mock-agents";

describe("consumer onboarding mock (T-4.7)", () => {
  it("recommended ids resolve to agents in MOCK_AGENTS", () => {
    const rec = getRecommendedAgentsForOnboarding();
    expect(rec.length).toBe(CONSUMER_ONBOARDING_RECOMMENDED_AGENT_IDS.length);
    for (const a of rec) {
      expect(MOCK_AGENTS.some((m) => m.id === a.id)).toBe(true);
    }
  });

  it("buildMockReceipt returns assistant text and receipt", () => {
    const agent = MOCK_AGENTS[0]!;
    const { assistantText, receipt } = buildMockReceipt(agent, "Hello world");
    expect(assistantText).toContain(agent.name);
    expect(receipt.routedAgentId).toBe(agent.id);
    expect(receipt.trustDecision).toBe("allow");
    expect(receipt.receiptId).toMatch(/^rcpt_demo_/);
  });

  it("suggested prompts are non-empty for quick pick UX", () => {
    expect(ONBOARDING_SUGGESTED_PROMPTS.length).toBeGreaterThanOrEqual(3);
  });

  it("sanitizeConsumerOnboardingReturnUrl rejects cross-locale and protocol tricks", () => {
    expect(sanitizeConsumerOnboardingReturnUrl("en", "/en/app")).toBe("/en/app");
    expect(sanitizeConsumerOnboardingReturnUrl("en", "/zh-Hans/app")).toBe("/en/app/chat");
    expect(sanitizeConsumerOnboardingReturnUrl("en", "//evil.com")).toBe("/en/app/chat");
    expect(sanitizeConsumerOnboardingReturnUrl("en", "https://evil.com")).toBe("/en/app/chat");
  });
});
