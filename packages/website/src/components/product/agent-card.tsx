"use client";

import type { Agent, AgentVerificationStatus } from "@/lib/product/agent-types";

const VERIFICATION_LABEL: Record<AgentVerificationStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  unverified: "Unverified",
};

const VERIFICATION_CLASS: Record<AgentVerificationStatus, string> = {
  verified: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  unverified: "border-zinc-400/40 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

type AgentCardProps = {
  agent: Agent;
  onSelect: (agent: Agent) => void;
};

/**
 * T-4.1 Agent 卡片：名称、能力摘要、信誉评分、验证状态 Badge。点击触发 onSelect。
 */
export function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(agent)}
      className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-card transition hover:border-primary/30 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground">{agent.name}</h3>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${VERIFICATION_CLASS[agent.verificationStatus]}`}
        >
          {VERIFICATION_LABEL[agent.verificationStatus]}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{agent.capabilitySummary}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Reputation: {agent.reputationScore}</span>
      </div>
    </button>
  );
}
