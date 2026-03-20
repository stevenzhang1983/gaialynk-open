"use client";

import type { ConsumerOnboardingCopy } from "@/content/onboarding/consumer-onboarding-copy";
import type { Agent } from "@/lib/product/agent-types";

type Props = {
  copy: ConsumerOnboardingCopy["browse"];
  agents: Agent[];
  selected: Agent | null;
  onSelect: (agent: Agent) => void;
  onNext: () => void;
  onBack: () => void;
};

/**
 * T-4.7 引导浏览目录：仅展示推荐 Agent，高亮选中项与「Recommended」标签。
 */
export function ConsumerBrowseAgentsStep({ copy, agents, selected, onSelect, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const isSelected = selected?.id === agent.id;
          return (
            <li key={agent.id}>
              <button
                type="button"
                onClick={() => onSelect(agent)}
                className={`w-full rounded-xl border bg-card p-4 text-left shadow-card transition focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                  isSelected ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{agent.name}</h3>
                  <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {copy.recommended}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{agent.capabilitySummary}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {copy.reputation} {agent.reputationScore}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={onNext}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {copy.next}
        </button>
      </div>
    </div>
  );
}
