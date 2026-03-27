"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Agent, AgentRiskLevel, TrustBadge } from "@/lib/product/agent-types";
import {
  getW18AgentLifecycleCopy,
  getW20ScheduledTasksCopy,
  getW4AgentUxCopy,
} from "@/content/i18n/product-experience";
import { AgentLifecyclePanel } from "@/components/product/agent-detail-enhanced";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

const RISK_LABEL: Record<AgentRiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const RISK_CLASS: Record<AgentRiskLevel, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-600",
};

type TabId = "overview" | "capabilities" | "privacy" | "reviews" | "developer";

type AgentDetailApi = {
  id: string;
  name: string;
  description: string;
  capabilities: { name: string; risk_level: string }[];
  source_origin?: string;
  agent_type?: string;
  source_url?: string;
  node_id?: string;
  trust_badge?: string;
  identity_verified?: boolean;
  reputation_score?: number;
  reputation_grade?: string;
  success_rate?: number;
  risk_level?: string;
  feedback_summary?: {
    quality_avg: number;
    speed_avg: number;
    stability_avg: number;
    valid_feedback_count: number;
  };
  max_concurrent?: number;
  queue_behavior?: string;
  timeout_ms?: number | null;
  supports_scheduled?: boolean;
  memory_tier?: string;
  current_version?: string | null;
  changelog?: Array<{ version: string; summary: string; breaking?: boolean; created_at?: string }>;
  listing_status?: string | null;
};

type AgentContextProps = {
  agent: Agent;
};

function parseTrust(raw: string | undefined): TrustBadge | undefined {
  if (raw === "unverified" || raw === "consumer_ready" || raw === "high_sensitivity_enhanced") return raw;
  return undefined;
}

/**
 * W-4：Agent 详情 Tab（概览 / 能力与限制 / 隐私与数据 / 评价 / 开发者）+ 主线 GET /agents/:id。
 */
export function AgentContext({ agent }: AgentContextProps) {
  const params = useParams();
  const raw = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(raw) ? raw : "en";
  const ux = getW4AgentUxCopy(locale);
  const det = ux.agentDetail;
  const w18 = getW18AgentLifecycleCopy(locale);
  const w20 = getW20ScheduledTasksCopy(locale);

  const [tab, setTab] = useState<TabId>("overview");
  const [detail, setDetail] = useState<AgentDetailApi | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch(`/api/mainline/agents/${encodeURIComponent(agent.id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.data) {
        setLoadError(true);
        return;
      }
      setDetail(json.data as AgentDetailApi);
    } catch {
      setLoadError(true);
    }
  }, [agent.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const trust = parseTrust(detail?.trust_badge) ?? agent.trustBadge;
  const trustLabel = trust ? ux.trustBadge[trust] : "—";

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: det.tabOverview },
    { id: "capabilities", label: det.tabCapabilities },
    { id: "privacy", label: det.tabPrivacy },
    { id: "reviews", label: det.tabReviews },
    { id: "developer", label: det.tabDeveloper },
  ];

  const rep = detail?.reputation_score ?? agent.reputationScore;
  const successPct =
    detail?.success_rate != null ? Math.round(Number(detail.success_rate) * 100) : agent.historySuccessRate;
  const risk = (detail?.risk_level as AgentRiskLevel | undefined) ?? agent.riskLevel;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold leading-snug text-foreground">{agent.name}</h3>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">ID: {agent.id}</p>
      </div>

      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-border pb-1"
        aria-label={det.tabOverview}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-t px-2 py-1 text-[0.6875rem] font-medium ${
              tab === t.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loadError && <p className="text-xs text-amber-800 dark:text-amber-200">{det.loadError}</p>}

      {tab === "overview" && (
        <div className="space-y-3 text-sm leading-relaxed">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.trustHeading}</h4>
            <p className="mt-1 font-medium text-foreground">{trustLabel}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.identitySection}</h4>
            <p className="mt-1 text-foreground">
              {detail?.identity_verified ? det.identityVerified : det.identityUnverified}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">{det.reputationSection}</h4>
              <p className="mt-1 font-medium tabular-nums text-foreground">{rep}</p>
              {detail?.reputation_grade ? (
                <p className="text-[0.6875rem] text-muted-foreground">Grade {detail.reputation_grade}</p>
              ) : null}
            </div>
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">{det.successRateSection}</h4>
              <p className="mt-1 font-medium tabular-nums text-foreground">{successPct}%</p>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.riskSection}</h4>
            <p className={`mt-1 font-medium ${RISK_CLASS[risk]}`}>{RISK_LABEL[risk]}</p>
          </div>
          <p className="text-sm text-muted-foreground">{detail?.description ?? agent.capabilitySummary}</p>
          <AgentLifecyclePanel
            detail={
              detail
                ? {
                    current_version: detail.current_version,
                    changelog: detail.changelog,
                    listing_status: detail.listing_status,
                  }
                : null
            }
            copy={w18}
          />
        </div>
      )}

      {tab === "capabilities" && (
        <div className="space-y-3 text-sm leading-relaxed">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.tabCapabilities}</h4>
            <ul className="mt-1 list-inside list-disc text-foreground">
              {(detail?.capabilities ?? []).map((c) => (
                <li key={c.name}>
                  {c.name} <span className="text-muted-foreground">({c.risk_level})</span>
                </li>
              ))}
            </ul>
            {!detail?.capabilities?.length ? (
              <p className="mt-1 text-muted-foreground">{agent.capabilityStatement}</p>
            ) : null}
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.timeoutSuggest}</h4>
            <p className="mt-1 tabular-nums text-foreground">
              {detail?.timeout_ms != null && detail.timeout_ms > 0
                ? `${detail.timeout_ms} ms`
                : agent.timeoutMs != null && agent.timeoutMs > 0
                  ? `${agent.timeoutMs} ms`
                  : "—"}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">Concurrency</h4>
            <p className="mt-1 text-foreground">
              {detail?.max_concurrent ?? agent.maxConcurrent ?? 1} · {detail?.queue_behavior ?? agent.queueBehavior ?? "queue"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {detail?.supports_scheduled ?? agent.supportsScheduled ? det.supportsScheduledYes : det.supportsScheduledNo}
          </p>
          {(detail?.supports_scheduled ?? agent.supportsScheduled) ? (
            <div className="rounded-md border border-border/60 bg-muted/20 px-2.5 py-2">
              <p className="text-[0.6875rem] font-medium text-foreground">{w20.agentDetailCta}</p>
              <p className="mt-0.5 text-[0.625rem] leading-relaxed text-muted-foreground">{w20.agentDetailCtaLead}</p>
              <Link
                href={`/${locale}/app/settings/scheduled-tasks`}
                className="mt-1 inline-block text-[0.6875rem] font-medium text-primary hover:underline"
              >
                {w20.agentDetailLink}
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {tab === "privacy" && (
        <div className="space-y-2 text-sm leading-relaxed">
          <p className="text-muted-foreground">{det.privacyLead}</p>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.memoryTier}</h4>
            <p className="mt-1 text-foreground">{detail?.memory_tier ?? agent.memoryTier ?? "—"}</p>
          </div>
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-2 text-sm">
          <h4 className="text-xs font-medium text-muted-foreground">{det.reviewsHeading}</h4>
          {detail?.feedback_summary && detail.feedback_summary.valid_feedback_count > 0 ? (
            <ul className="space-y-1 text-foreground">
              <li className="flex justify-between gap-2">
                <span>{det.quality}</span>
                <span className="tabular-nums">{detail.feedback_summary.quality_avg.toFixed(2)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>{det.speed}</span>
                <span className="tabular-nums">{detail.feedback_summary.speed_avg.toFixed(2)}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span>{det.stability}</span>
                <span className="tabular-nums">{detail.feedback_summary.stability_avg.toFixed(2)}</span>
              </li>
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">—</p>
          )}
        </div>
      )}

      {tab === "developer" && (
        <div className="space-y-2 text-sm leading-relaxed">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.developerType}</h4>
            <p className="mt-1 text-foreground">{detail?.agent_type ?? agent.agentType ?? "—"}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.developerOrigin}</h4>
            <p className="mt-1 text-foreground">{detail?.source_origin ?? agent.sourceOrigin ?? "—"}</p>
          </div>
          {detail?.node_id || agent.nodeId ? (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">{det.developerNode}</h4>
              <p className="mt-1 font-mono text-xs text-foreground">{detail?.node_id ?? agent.nodeId}</p>
            </div>
          ) : null}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">{det.developerUrl}</h4>
            <p className="mt-1 break-all font-mono text-[0.6875rem] text-foreground">
              {detail?.source_url ?? agent.sourceUrl ?? "—"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
