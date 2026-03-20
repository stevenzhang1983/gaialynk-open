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

/**
 * T-4.1 Agent 目录浏览视图：搜索框 + 分类筛选 + Agent 卡片网格。
 * 未登录可访问；点击卡片在右侧面板展示详情。
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
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<AgentCategory | "">("");

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
    let list: Agent[] = MOCK_AGENTS;
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
  }, [search, category]);

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
