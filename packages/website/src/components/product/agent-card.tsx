"use client";

import type { Agent, AgentVerificationStatus, TrustBadge } from "@/lib/product/agent-types";
import { useParams } from "next/navigation";
import { getW4AgentUxCopy, type W18AgentLifecycleCopy } from "@/content/i18n/product-experience";
import { AgentListingBadges } from "@/components/product/agent-detail-enhanced";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

const VERIFICATION_LABEL: Record<AgentVerificationStatus, string> = {
  verified: "Verified",
  pending: "Pending",
  unverified: "Unverified",
};

const VERIFICATION_CLASS: Record<AgentVerificationStatus, string> = {
  verified: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
  pending: "border-amber-500/40 bg-amber-500/10 text-amber-700",
  unverified: "border-zinc-400/40 bg-zinc-500/10 text-zinc-600",
};

const TRUST_BADGE_CLASS: Record<TrustBadge, string> = {
  unverified: "border-zinc-400/40 bg-zinc-500/10 text-zinc-700",
  consumer_ready: "border-emerald-500/45 bg-emerald-500/10 text-emerald-800",
  high_sensitivity_enhanced: "border-amber-500/50 bg-amber-500/12 text-amber-900",
};

type AgentCardProps = {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  lifecycleCopy: W18AgentLifecycleCopy;
};

function capacityLine(agent: Agent, d: ReturnType<typeof getW4AgentUxCopy>["directory"]): string {
  const mc = agent.maxConcurrent ?? 1;
  const parallel = d.parallelSlots.replace("{{n}}", String(Math.max(1, mc)));
  if (mc <= 1) {
    return `${d.lowConcurrency} · ${agent.queueBehavior === "fast_fail" ? d.fastFail : d.queueLikely}`;
  }
  return `${parallel} · ${agent.queueBehavior === "fast_fail" ? d.fastFail : d.queueLikely}`;
}

/**
 * W-4：信任徽章（trust_badge）+ 容量/排队信号；回退时沿用验证状态 Badge。
 */
export function AgentCard({ agent, onSelect, lifecycleCopy }: AgentCardProps) {
  const params = useParams();
  const raw = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(raw) ? raw : "en";
  const ux = getW4AgentUxCopy(locale);
  const tb = agent.trustBadge;
  const badgeLabel = tb ? ux.trustBadge[tb] : VERIFICATION_LABEL[agent.verificationStatus];
  const badgeClass = tb ? TRUST_BADGE_CLASS[tb] : VERIFICATION_CLASS[agent.verificationStatus];

  const delisted = agent.listingStatus === "delisted";

  return (
    <button
      type="button"
      onClick={() => onSelect(agent)}
      className={`w-full rounded-xl border border-border bg-card p-4 text-left shadow-card transition hover:border-primary/30 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        delisted ? "opacity-60 grayscale-[0.35]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-snug text-foreground">{agent.name}</h3>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <AgentListingBadges listingStatus={agent.listingStatus} copy={lifecycleCopy} />
          <span
            className={`rounded-md border px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {badgeLabel}
          </span>
        </div>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{agent.capabilitySummary}</p>
      <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="tabular-nums">Reputation: {agent.reputationScore}</span>
        </div>
        <p className="text-[0.6875rem] leading-snug text-muted-foreground/90">{capacityLine(agent, ux.directory)}</p>
      </div>
    </button>
  );
}
