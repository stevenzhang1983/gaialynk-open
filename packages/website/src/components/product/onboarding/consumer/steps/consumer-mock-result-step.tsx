"use client";

import type { ConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";
import type { Agent } from "@/lib/product/agent-types";
import type { MockInvocationReceipt } from "@/lib/product/consumer-onboarding-mock";

type Props = {
  copy: ConsumerOnboardingCopy["result"];
  agent: Agent;
  userMessage: string;
  assistantText: string;
  receipt: MockInvocationReceipt;
  onNext: () => void;
  onBack: () => void;
};

/**
 * T-4.7 首次结果：Mock 助手回复 + 收据卡片（路由 / 信任决策示意）。
 */
export function ConsumerMockResultStep({
  copy,
  agent,
  userMessage,
  assistantText,
  receipt,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.bodyBefore}
          <span className="font-medium text-foreground">{agent.name}</span>
          {copy.bodyAfter}
        </p>
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{copy.you}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{userMessage}</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">{agent.name}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{assistantText}</p>
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
      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          {copy.finish}
        </button>
      </div>
    </div>
  );
}
