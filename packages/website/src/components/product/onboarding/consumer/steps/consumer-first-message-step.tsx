"use client";

import type { ConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";
import type { Agent } from "@/lib/product/agent-types";

type Props = {
  copy: ConsumerOnboardingCopy["firstMessage"];
  prompts: string[];
  agent: Agent;
  message: string;
  onMessageChange: (value: string) => void;
  onSimulate: () => void;
  onBack: () => void;
};

/**
 * T-4.7 首次对话：建议话术 chips + 可编辑输入，模拟发送（Mock 路由）。
 */
export function ConsumerFirstMessageStep({
  copy,
  prompts,
  agent,
  message,
  onMessageChange,
  onSimulate,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.intro}
          <span className="font-medium text-foreground">{agent.name}</span>
          {copy.outro}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onMessageChange(p)}
            className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-left text-xs text-foreground hover:border-primary/40 hover:bg-muted"
          >
            {p}
          </button>
        ))}
      </div>
      <textarea
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        rows={5}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder={copy.placeholder}
        aria-label={copy.messageAria}
      />
      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <button
          type="button"
          disabled={!message.trim()}
          onClick={onSimulate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {copy.runDemo}
        </button>
      </div>
    </div>
  );
}
