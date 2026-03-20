"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentCard } from "./agent-card";
import { useAgentDirectory } from "./agent-directory-context";
import { usePanelFocus } from "./context-panel/panel-focus-context";
import type { Agent, AgentCategory } from "@/lib/product/agent-types";
import { AGENT_CATEGORIES, MOCK_AGENTS } from "@/lib/product/mock-agents";
import { useParams } from "next/navigation";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

type ApiAgent = {
  id: string;
  name: string;
  description: string;
  capabilities: { name: string; risk_level: string }[];
  status?: string;
  source_origin?: string;
};

function mapApiAgent(a: ApiAgent): Agent {
  const maxRisk = a.capabilities?.reduce(
    (max, c) => {
      const order = { critical: 3, high: 2, medium: 1, low: 0 } as Record<string, number>;
      return (order[c.risk_level] ?? 0) > (order[max] ?? 0) ? c.risk_level : max;
    },
    "low",
  ) ?? "low";

  return {
    id: a.id,
    name: a.name,
    capabilitySummary: a.description || a.capabilities?.map((c) => c.name).join(", ") || "",
    reputationScore: 80,
    verificationStatus: a.status === "active" ? "verified" : a.status === "pending_review" ? "pending" : "unverified",
    category: "other",
    identityVerificationStatus: a.status === "active" ? "Verified" : "Pending review",
    capabilityStatement: a.capabilities?.map((c) => `${c.name} (${c.risk_level})`).join("; ") || "",
    historySuccessRate: 85,
    riskLevel: (maxRisk === "critical" ? "high" : maxRisk) as Agent["riskLevel"],
  };
}

/**
 * T-4.1 Agent 目录浏览视图：搜索框 + 分类筛选 + Agent 卡片网格。
 * 优先从真实 API 加载，失败时回退到 Mock 数据。未登录可访问。
 */
export function AgentDirectory() {
  const { setSelectedAgent } = useAgentDirectory();
  const { setFocus } = usePanelFocus();
  const params = useParams();
  const resolvedLocale = useMemo(() => {
    const raw = typeof params?.locale === "string" ? params.locale : "en";
    return isSupportedLocale(raw) ? (raw as Locale) : ("en" as Locale);
  }, [params?.locale]);

  const didTrackRef = useRef(false);
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AgentCategory | "">("");

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
    return () => { cancelled = true; };
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
        (a) =>
          a.name.toLowerCase().includes(q) || a.capabilitySummary.toLowerCase().includes(q)
      );
    }
    if (category) {
      list = list.filter((a) => a.category === category);
    }
    return list;
  }, [agents, search, category]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search agents"
        />
        <select
          value={category}
          onChange={(e) => setCategory((e.target.value || "") as AgentCategory | "")}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {AGENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onSelect={onSelectAgent} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No agents match your search or filter.</p>
      )}
    </div>
  );
}
