"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { Agent } from "@/lib/product/agent-types";
import { getConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";
import {
  buildMockReceipt,
  getConsumerSuggestedPrompts,
  sanitizeConsumerOnboardingReturnUrl,
} from "@/lib/product/consumer-onboarding-mock";
import type { MockInvocationReceipt } from "@/lib/product/consumer-onboarding-mock";
import { fetchFirstRunAgentPicks } from "@/lib/product/first-run-agents";
import { writeFirstRunDraft } from "@/lib/product/first-run-storage";
import { ConsumerBrowseAgentsStep } from "./steps/consumer-browse-agents-step";
import { ConsumerFirstMessageStep } from "./steps/consumer-first-message-step";
import { ConsumerHubStep } from "./steps/consumer-hub-step";
import { ConsumerMockResultStep } from "./steps/consumer-mock-result-step";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

const BROWSE_PATH_TOTAL = 4;

type MockBundle = { assistantText: string; receipt: MockInvocationReceipt };

type Phase = "hub" | "browse" | "message" | "result";

type Props = {
  locale: Locale;
  /** 完成引导后的落地页（默认 Chat） */
  returnUrl: string;
};

/**
 * W-9：首启 ≤4 屏、无强制 OAuth。
 * - Hub：可选目标 +「开始对话」直去 Chat（预填首条）/「浏览 Agent」进入推荐 → 首条 Mock → 结果与主路径合一屏。
 */
export function ConsumerOnboardingWizard({ locale, returnUrl: returnUrlProp }: Props) {
  const router = useRouter();
  const returnUrl = sanitizeConsumerOnboardingReturnUrl(locale, returnUrlProp);
  const copy = useMemo(() => getConsumerOnboardingCopy(locale), [locale]);
  const suggestedPrompts = useMemo(() => getConsumerSuggestedPrompts(locale), [locale]);
  const [phase, setPhase] = useState<Phase>("hub");
  const [recommended, setRecommended] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [goalText, setGoalText] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [message, setMessage] = useState(() => suggestedPrompts[0] ?? "");
  const [mockBundle, setMockBundle] = useState<MockBundle | null>(null);

  const didTrackFirstConversationRef = useRef(false);
  const didTrackFirstResultRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAgentsLoading(true);
      const list = await fetchFirstRunAgentPicks(5);
      if (!cancelled) {
        setRecommended(list);
        setSelectedAgent((prev) => prev ?? list[0] ?? null);
        setAgentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goHub = useCallback(() => setPhase("hub"), []);
  const goBrowse = useCallback(() => setPhase("browse"), []);
  const goMessage = useCallback(() => setPhase("message"), []);
  const goResult = useCallback(() => setPhase("result"), []);

  const handleStartChat = useCallback(() => {
    const g = goalText.trim();
    if (g) writeFirstRunDraft(g);
    trackEvent(
      "consumer_onboarding_fast_path",
      buildAnalyticsPayload({
        locale,
        page: "onboarding/consumer",
        referrer: "hub",
        action: "start_chat",
        outcome: g ? "with_goal" : "no_goal",
      }),
    );
    router.push(returnUrl);
  }, [goalText, locale, returnUrl, router]);

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
    if (phase !== "result") return;
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
  }, [phase, mockBundle, locale]);

  const stepIndex =
    phase === "hub" ? 1 : phase === "browse" ? 2 : phase === "message" ? 3 : phase === "result" ? 4 : 1;
  const progressLabel = copy.stepProgress(stepIndex, BROWSE_PATH_TOTAL);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{progressLabel}</span>
          <Link href={returnUrl} className="text-xs font-medium text-primary underline hover:no-underline">
            {copy.skipToApp}
          </Link>
        </div>
      </header>

      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${(stepIndex / BROWSE_PATH_TOTAL) * 100}%` }}
          role="progressbar"
          aria-valuenow={stepIndex}
          aria-valuemin={1}
          aria-valuemax={BROWSE_PATH_TOTAL}
          aria-label={progressLabel}
        />
      </div>

      {phase === "hub" && (
        <ConsumerHubStep
          copy={copy.hub}
          goalText={goalText}
          onGoalChange={setGoalText}
          onStartChat={handleStartChat}
          browseAgentsDisabled={agentsLoading}
          onBrowseAgents={() => {
            if (agentsLoading) return;
            if (recommended.length === 0) {
              router.push(`/${locale}/app/agents`);
              return;
            }
            if (goalText.trim()) setMessage(goalText.trim());
            goBrowse();
          }}
        />
      )}

      {phase === "browse" && (
        <ConsumerBrowseAgentsStep
          copy={copy.browse}
          agents={recommended}
          selected={selectedAgent}
          onSelect={setSelectedAgent}
          onNext={goMessage}
          onBack={goHub}
        />
      )}

      {phase === "message" && selectedAgent && (
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

      {phase === "result" && selectedAgent && mockBundle && (
        <ConsumerMockResultStep
          copy={copy.result}
          locale={locale}
          agent={selectedAgent}
          userMessage={message.trim()}
          assistantText={mockBundle.assistantText}
          receipt={mockBundle.receipt}
          returnUrl={returnUrl}
          onBack={goMessage}
        />
      )}
    </div>
  );
}
