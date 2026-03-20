"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Agent } from "@/lib/product/agent-types";
import { getConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";
import {
  buildMockReceipt,
  getConsumerSuggestedPrompts,
  getRecommendedAgentsForOnboarding,
  sanitizeConsumerOnboardingReturnUrl,
} from "@/lib/product/consumer-onboarding-mock";
import type { MockInvocationReceipt } from "@/lib/product/consumer-onboarding-mock";
import { ConsumerBrowseAgentsStep } from "./steps/consumer-browse-agents-step";
import { ConsumerCompleteStep } from "./steps/consumer-complete-step";
import { ConsumerFirstMessageStep } from "./steps/consumer-first-message-step";
import { ConsumerMockResultStep } from "./steps/consumer-mock-result-step";
import { ConsumerWelcomeStep } from "./steps/consumer-welcome-step";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

const STEP_COUNT = 5;

type MockBundle = { assistantText: string; receipt: MockInvocationReceipt };

type Props = {
  locale: Locale;
  /** 完成引导后的落地页（默认 Chat） */
  returnUrl: string;
};

/**
 * T-4.7 Consumer 引导主流程：欢迎 → 推荐目录 → 首条消息 → Mock 结果与收据 → 完成进入主界面。
 */
export function ConsumerOnboardingWizard({ locale, returnUrl: returnUrlProp }: Props) {
  const returnUrl = sanitizeConsumerOnboardingReturnUrl(locale, returnUrlProp);
  const copy = useMemo(() => getConsumerOnboardingCopy(locale), [locale]);
  const suggestedPrompts = useMemo(() => getConsumerSuggestedPrompts(locale), [locale]);
  const recommended = useMemo(() => getRecommendedAgentsForOnboarding(), []);
  const [step, setStep] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(() => recommended[0] ?? null);
  const [message, setMessage] = useState(() => suggestedPrompts[0] ?? "");
  const [mockBundle, setMockBundle] = useState<MockBundle | null>(null);

  const didTrackFirstConversationRef = useRef(false);
  const didTrackFirstResultRef = useRef(false);

  const goWelcome = useCallback(() => setStep(0), []);
  const goBrowse = useCallback(() => setStep(1), []);
  const goFirstMessage = useCallback(() => setStep(2), []);
  const goResult = useCallback(() => setStep(3), []);
  const goComplete = useCallback(() => setStep(4), []);

  const runMock = useCallback(() => {
    if (!selectedAgent || !message.trim()) return;
    if (!didTrackFirstConversationRef.current) {
      didTrackFirstConversationRef.current = true;
      trackEvent(
        "consumer_first_conversation",
        buildAnalyticsPayload({
          locale,
          page: "onboarding/consumer",
          referrer: "mock",
          action: "run_mock",
          outcome: "conversation_created",
        }),
      );
    }
    setMockBundle(buildMockReceipt(selectedAgent, message.trim(), locale));
    goResult();
  }, [selectedAgent, message, goResult, locale]);

  useEffect(() => {
    if (step !== 3) return;
    if (!mockBundle) return;
    if (didTrackFirstResultRef.current) return;
    didTrackFirstResultRef.current = true;
    trackEvent(
      "consumer_first_result",
      buildAnalyticsPayload({
        locale,
        page: "onboarding/consumer",
        referrer: "mock",
        action: "show_result",
        outcome: "result_rendered",
      }),
    );
  }, [step, mockBundle, locale]);

  const progressLabel = copy.stepProgress(step + 1, STEP_COUNT);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="text-2xl font-semibold text-foreground">{copy.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{progressLabel}</span>
          <Link href={returnUrl} className="text-xs text-primary underline hover:no-underline">
            {copy.skipToApp}
          </Link>
        </div>
      </header>

      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${((step + 1) / STEP_COUNT) * 100}%` }}
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEP_COUNT}
          aria-label={progressLabel}
        />
      </div>

      {step === 0 && <ConsumerWelcomeStep copy={copy.welcome} onNext={goBrowse} />}
      {step === 1 && (
        <ConsumerBrowseAgentsStep
          copy={copy.browse}
          agents={recommended}
          selected={selectedAgent}
          onSelect={setSelectedAgent}
          onNext={goFirstMessage}
          onBack={goWelcome}
        />
      )}
      {step === 2 && selectedAgent && (
        <ConsumerFirstMessageStep
          copy={copy.firstMessage}
          prompts={suggestedPrompts}
          agent={selectedAgent}
          message={message}
          onMessageChange={setMessage}
          onSimulate={runMock}
          onBack={goBrowse}
        />
      )}
      {step === 3 && selectedAgent && mockBundle && (
        <ConsumerMockResultStep
          copy={copy.result}
          agent={selectedAgent}
          userMessage={message.trim()}
          assistantText={mockBundle.assistantText}
          receipt={mockBundle.receipt}
          onNext={goComplete}
          onBack={goFirstMessage}
        />
      )}
      {step === 4 && <ConsumerCompleteStep copy={copy.complete} locale={locale} returnUrl={returnUrl} />}
    </div>
  );
}
