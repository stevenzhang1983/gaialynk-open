"use client";

import Link from "next/link";
import type { ConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";
import type { Agent } from "@/lib/product/agent-types";
import type { MockInvocationReceipt } from "@/lib/product/consumer-onboarding-mock";
import { writePendingAgentId } from "@/lib/product/first-run-storage";
import type { Locale } from "@/lib/i18n/locales";

type Props = {
  copy: ConsumerOnboardingCopy["result"];
  locale: Locale;
  agent: Agent;
  userMessage: string;
  assistantText: string;
  receipt: MockInvocationReceipt;
  returnUrl: string;
  onBack: () => void;
};

/**
 * W-9：Mock 结果 + 收据 + 进入主路径（合并原「完成」屏，满足 ≤4 屏）。
 */
export function ConsumerMockResultStep({
  copy,
  locale,
  agent,
  userMessage,
  assistantText,
  receipt,
  returnUrl,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{copy.heading}</h2>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">
          {copy.bodyBefore}
          <span className="font-medium text-foreground">{agent.name}</span>
          {copy.bodyAfter}
        </p>
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy.you}</p>
          <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground">{userMessage}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{agent.name}</p>
          <p className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-foreground">{assistantText}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-semibold text-foreground">{copy.receiptTitle}</h3>
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">{copy.receiptId}</dt>
            <dd className="font-mono text-foreground">{receipt.receiptId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.invocationId}</dt>
            <dd className="font-mono text-foreground">{receipt.invocationId}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.trustDecision}</dt>
            <dd className="font-medium text-emerald-600">{receipt.trustDecision}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.routedAgent}</dt>
            <dd className="text-foreground">{receipt.routedAgentName}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">{copy.completedAt}</dt>
            <dd className="text-foreground">{receipt.completedAt}</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <h3 className="text-lg font-semibold text-foreground">{copy.doneHeading}</h3>
        <p className="mt-2 max-w-[65ch] text-base leading-relaxed text-muted-foreground">{copy.doneBody}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href={returnUrl}
            onClick={() => writePendingAgentId(agent.id)}
            className="inline-flex justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            {copy.continueApp}
          </Link>
          <Link
            href={`/${locale}/app/agents`}
            className="inline-flex justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            {copy.browseAll}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap justify-start gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
      </div>
    </div>
  );
}
