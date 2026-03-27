"use client";

import type { ConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";

type Props = {
  copy: ConsumerOnboardingCopy["hub"];
  goalText: string;
  onGoalChange: (v: string) => void;
  onStartChat: () => void;
  onBrowseAgents: () => void;
  browseAgentsDisabled?: boolean;
};

/**
 * W-9：S1 可选一句话目标 + S2「开始对话 / 浏览 Agent」同屏（算作首启第 1 屏）。
 */
export function ConsumerHubStep({
  copy,
  goalText,
  onGoalChange,
  onStartChat,
  onBrowseAgents,
  browseAgentsDisabled = false,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{copy.heading}</h2>
        <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground">{copy.body}</p>
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor="consumer-onboarding-goal" className="text-sm font-medium text-foreground">
            {copy.goalLabel}
          </label>
          <span className="text-xs text-muted-foreground">{copy.goalOptional}</span>
        </div>
        <textarea
          id="consumer-onboarding-goal"
          value={goalText}
          onChange={(e) => onGoalChange(e.target.value)}
          rows={3}
          placeholder={copy.goalPlaceholder}
          className="w-full max-w-[65ch] resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onStartChat}
          className="rounded-lg bg-primary px-5 py-3 text-base font-semibold text-primary-foreground hover:brightness-110"
        >
          {copy.startChat}
        </button>
        <button
          type="button"
          onClick={onBrowseAgents}
          disabled={browseAgentsDisabled}
          className="rounded-lg border border-border bg-card px-5 py-3 text-base font-semibold text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {copy.browseAgents}
        </button>
      </div>
    </div>
  );
}
