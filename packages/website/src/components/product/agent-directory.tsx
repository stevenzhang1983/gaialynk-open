"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentCard } from "./agent-card";
import { useAgentDirectory } from "./agent-directory-context";
import { usePanelFocus } from "./context-panel/panel-focus-context";
import type { Agent, AgentCategory, TrustBadge } from "@/lib/product/agent-types";
import { AGENT_CATEGORIES, MOCK_AGENTS } from "@/lib/product/mock-agents";
import { useParams } from "next/navigation";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";
import { getW4AgentUxCopy, getW18AgentLifecycleCopy, type W18AgentLifecycleCopy } from "@/content/i18n/product-experience";

type ApiAgent = {
  id: string;
  name: string;
  description: string;
  capabilities: { name: string; risk_level: string }[];
  status?: string;
  source_origin?: string;
  trust_badge?: string;
  max_concurrent?: number;
  queue_behavior?: string;
  listing_status?: string;
};

type DiscoverySlots = {
  hot: ApiAgent[];
  beginner_friendly: ApiAgent[];
  low_latency: ApiAgent[];
};

function parseTrustBadge(raw: string | undefined): TrustBadge | undefined {
  if (raw === "unverified" || raw === "consumer_ready" || raw === "high_sensitivity_enhanced") {
    return raw;
  }
  return undefined;
}

function inferCategory(a: ApiAgent): AgentCategory {
  const blob = `${a.name} ${a.description} ${(a.capabilities ?? []).map((c) => c.name).join(" ")}`.toLowerCase();
  if (blob.includes("govern") || blob.includes("policy") || blob.includes("compliance")) return "governance";
  if (blob.includes("code") || blob.includes("review") || blob.includes("repo")) return "code";
  if (blob.includes("research") || blob.includes("search") || blob.includes("citation")) return "research";
  if (blob.includes("summar") || blob.includes("task") || blob.includes("workflow")) return "productivity";
  return "other";
}

function parseListingStatus(raw: string | undefined): Agent["listingStatus"] | undefined {
  if (raw === "maintenance" || raw === "delisted" || raw === "listed") return raw;
  return undefined;
}

function mapApiAgent(a: ApiAgent): Agent {
  const maxRisk =
    a.capabilities?.reduce(
      (max, c) => {
        const order = { critical: 3, high: 2, medium: 1, low: 0 } as Record<string, number>;
        return (order[c.risk_level] ?? 0) > (order[max] ?? 0) ? c.risk_level : max;
      },
      "low",
    ) ?? "low";

  const mc =
    typeof a.max_concurrent === "number" && Number.isFinite(a.max_concurrent) && a.max_concurrent >= 1
      ? a.max_concurrent
      : 1;
  const qb = a.queue_behavior === "fast_fail" ? "fast_fail" : "queue";

  return {
    id: a.id,
    name: a.name,
    capabilitySummary: a.description || a.capabilities?.map((c) => c.name).join(", ") || "",
    reputationScore: 80,
    verificationStatus: a.status === "active" ? "verified" : a.status === "pending_review" ? "pending" : "unverified",
    trustBadge: parseTrustBadge(a.trust_badge),
    maxConcurrent: mc,
    queueBehavior: qb,
    category: inferCategory(a),
    identityVerificationStatus: a.status === "active" ? "Verified" : "Pending review",
    capabilityStatement: a.capabilities?.map((c) => `${c.name} (${c.risk_level})`).join("; ") || "",
    historySuccessRate: 85,
    riskLevel: (maxRisk === "critical" ? "high" : maxRisk) as Agent["riskLevel"],
    sourceOrigin: a.source_origin,
    listingStatus: parseListingStatus(a.listing_status),
  };
}

function DiscoveryRow({
  title,
  agents,
  onSelect,
  rankingFallback,
  fallbackNote,
  lifecycleCopy,
}: {
  title: string;
  agents: Agent[];
  onSelect: (a: Agent) => void;
  rankingFallback: boolean;
  fallbackNote: string;
  lifecycleCopy: W18AgentLifecycleCopy;
}) {
  if (agents.length === 0) return null;
  return (
    <section className="space-y-2" aria-label={title}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {rankingFallback ? (
          <p className="max-w-prose text-[0.6875rem] leading-snug text-muted-foreground">{fallbackNote}</p>
        ) : null}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
        {agents.map((agent) => (
          <div key={agent.id} className="w-[min(100%,280px)] shrink-0">
            <AgentCard agent={agent} onSelect={onSelect} lifecycleCopy={lifecycleCopy} />
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * W-4：智能体中心增强（trust_badge、容量信号、discovery 运营位）+ T-4.1 搜索与分类。
 */
export function AgentDirectory() {
  const { setSelectedAgent } = useAgentDirectory();
  const { setFocus } = usePanelFocus();
  const params = useParams();
  const resolvedLocale = useMemo(() => {
    const raw = typeof params?.locale === "string" ? params.locale : "en";
    return isSupportedLocale(raw) ? (raw as Locale) : ("en" as Locale);
  }, [params?.locale]);
  const ux = getW4AgentUxCopy(resolvedLocale);
  const d = ux.directory;
  const w18 = getW18AgentLifecycleCopy(resolvedLocale);

  const didTrackRef = useRef(false);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AgentCategory | "">("");
  const [discovery, setDiscovery] = useState<DiscoverySlots | null>(null);
  const [discoveryFallback, setDiscoveryFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mainline/agents?limit=50&status=active", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        if (data.length > 0 && !cancelled) {
          setAgents(data.map(mapApiAgent));
        }
      } catch {
        /* keep mock data */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mainline/agents/discovery", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const slots = json.data?.slots as DiscoverySlots | undefined;
        if (!slots || cancelled) return;
        setDiscovery(slots);
        setDiscoveryFallback(Boolean(json.data?.meta?.ranking_fallback));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (didTrackRef.current) return;
    if (typeof window === "undefined") return;
    const key = `gl_consumer_browse_agents_tracked_${resolvedLocale}`;
    if (window.sessionStorage.getItem(key) === "1") {
      didTrackRef.current = true;
      return;
    }
    didTrackRef.current = true;
    window.sessionStorage.setItem(key, "1");
    trackEvent("consumer_browse_agents", buildAnalyticsPayload({ locale: resolvedLocale, page: "agent_directory", referrer: "agent_directory" }));
  }, [resolvedLocale]);

  const onSelectAgent = useCallback(
    (agent: Agent) => {
      setSelectedAgent(agent);
      setFocus({ type: "agent", agent });
    },
    [setSelectedAgent, setFocus],
  );

  const filtered = useMemo(() => {
    let list = agents;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) => a.name.toLowerCase().includes(q) || a.capabilitySummary.toLowerCase().includes(q),
      );
    }
    if (category) {
      list = list.filter((a) => a.category === category);
    }
    return list;
  }, [agents, search, category]);

  const discoveryMapped = useMemo(() => {
    if (!discovery) return null;
    return {
      hot: discovery.hot.map(mapApiAgent),
      beginner_friendly: discovery.beginner_friendly.map(mapApiAgent),
      low_latency: discovery.low_latency.map(mapApiAgent),
    };
  }, [discovery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder={d.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-md border border-border bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={d.searchPlaceholder}
        />
        <select
          value={category}
          onChange={(e) => setCategory((e.target.value || "") as AgentCategory | "")}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label={d.filterAria}
        >
          <option value="">{d.allCategories}</option>
          {AGENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {discoveryMapped ? (
        <div className="space-y-5 rounded-lg border border-dashed border-border/70 bg-muted/20 p-4">
          <DiscoveryRow
            title={d.discoveryHot}
            agents={discoveryMapped.hot}
            onSelect={onSelectAgent}
            rankingFallback={discoveryFallback}
            fallbackNote={d.rankingFallbackNote}
            lifecycleCopy={w18}
          />
          <DiscoveryRow
            title={d.discoveryBeginner}
            agents={discoveryMapped.beginner_friendly}
            onSelect={onSelectAgent}
            rankingFallback={discoveryFallback}
            fallbackNote={d.rankingFallbackNote}
            lifecycleCopy={w18}
          />
          <DiscoveryRow
            title={d.discoveryLowLatency}
            agents={discoveryMapped.low_latency}
            onSelect={onSelectAgent}
            rankingFallback={discoveryFallback}
            fallbackNote={d.rankingFallbackNote}
            lifecycleCopy={w18}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={onSelectAgent} lifecycleCopy={w18} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
          <p>{d.noResults}</p>
          <p className="text-xs">{d.tryDiscoveryHint}</p>
        </div>
      )}
    </div>
  );
}
