"use client";

import { useState, type FormEvent } from "react";
import type { Locale } from "@/lib/i18n/locales";

type AskResult = {
  ask_id: string;
  route: { selected_agent_ids?: string[] };
  result: {
    summary: string;
    evidence: string[];
    cost_estimate_tokens: number;
    duration_ms: number;
  };
};

type VisualizationData = {
  level: "l1" | "l2";
  route_summary: string;
  timeline?: Array<{ step: string; status: string; detail: string }>;
};

const LABELS: Record<Locale, { inputPlaceholder: string; submit: string; runAgain: string; summary: string; cost: string; duration: string; route: string; l1: string; l2: string; retry: string; alternative: string; degraded: string; error: string }> = {
  en: {
    inputPlaceholder: "Describe what you need in one sentence…",
    submit: "Run Ask",
    runAgain: "Run again",
    summary: "Result summary",
    cost: "Cost (tokens)",
    duration: "Duration (ms)",
    route: "Route",
    l1: "L1",
    l2: "L2",
    retry: "Retry",
    alternative: "Alternative agent",
    degraded: "Degraded result",
    error: "Error",
  },
  "zh-Hant": {
    inputPlaceholder: "用一句話描述你的需求…",
    submit: "執行 Ask",
    runAgain: "再跑一次",
    summary: "結果摘要",
    cost: "成本（tokens）",
    duration: "耗時（ms）",
    route: "路由",
    l1: "L1",
    l2: "L2",
    retry: "重試",
    alternative: "替代 Agent",
    degraded: "降級結果",
    error: "錯誤",
  },
  "zh-Hans": {
    inputPlaceholder: "用一句话描述你的需求…",
    submit: "执行 Ask",
    runAgain: "再跑一次",
    summary: "结果摘要",
    cost: "成本（tokens）",
    duration: "耗时（ms）",
    route: "路由",
    l1: "L1",
    l2: "L2",
    retry: "重试",
    alternative: "替代 Agent",
    degraded: "降级结果",
    error: "错误",
  },
};

export function AskDemo({ locale }: { locale: Locale }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [askResult, setAskResult] = useState<AskResult | null>(null);
  const [visualization, setVisualization] = useState<VisualizationData | null>(null);
  const [vizLevel, setVizLevel] = useState<"l1" | "l2">("l1");
  const [errorMessage, setErrorMessage] = useState("");
  const [fallbackStatus, setFallbackStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});

  const t = LABELS[locale];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("loading");
    setErrorMessage("");
    setAskResult(null);
    setVisualization(null);
    try {
      const res = await fetch("/api/mainline/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(json?.error?.message ?? "Request failed");
        return;
      }
      const result = json?.data;
      if (result?.ask_id) {
        setAskResult(result);
        setStatus("success");
        const vizRes = await fetch(`/api/mainline/ask/${result.ask_id}/visualization?level=l1`);
        const vizJson = await vizRes.json();
        if (vizJson?.data) setVisualization(vizJson.data);
      } else {
        setStatus("error");
        setErrorMessage("Invalid response");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error");
    }
  }

  async function loadVisualization(level: "l1" | "l2") {
    if (!askResult?.ask_id) return;
    setVizLevel(level);
    const res = await fetch(`/api/mainline/ask/${askResult.ask_id}/visualization?level=${level}`);
    const json = await res.json();
    if (json?.data) setVisualization(json.data);
  }

  async function runFallback(action: "retry" | "alternative" | "degraded") {
    if (!askResult?.ask_id) return;
    setFallbackStatus((s) => ({ ...s, [action]: "loading" }));
    try {
      const res = await fetch(`/api/mainline/ask/${askResult.ask_id}/fallback/${action}`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json?.data?.result) {
        setAskResult({ ...askResult, result: json.data.result });
        setVisualization(null);
        const vizRes = await fetch(`/api/mainline/ask/${askResult.ask_id}/visualization?level=l1`);
        const vizJson = await vizRes.json();
        if (vizJson?.data) setVisualization(vizJson.data);
        setFallbackStatus((s) => ({ ...s, [action]: "done" }));
      } else {
        setFallbackStatus((s) => ({ ...s, [action]: "error" }));
      }
    } catch {
      setFallbackStatus((s) => ({ ...s, [action]: "error" }));
    }
  }

  function runAgain() {
    setAskResult(null);
    setVisualization(null);
    setStatus("idle");
    setFallbackStatus({});
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6">
        <label className="block text-sm font-medium text-foreground">
          <span className="sr-only">Ask</span>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.inputPlaceholder}
            className="mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground"
            disabled={status === "loading"}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={status === "loading" || !text.trim()}
            className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {status === "loading" ? "…" : t.submit}
          </button>
          {askResult && (
            <button
              type="button"
              onClick={runAgain}
              className="rounded-md border border-border px-5 py-2 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {t.runAgain}
            </button>
          )}
        </div>
      </form>

      {status === "error" && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
          {t.error}: {errorMessage}
        </div>
      )}

      {askResult && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">{t.summary}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{askResult.result.summary || "—"}</p>
            <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <li>{t.cost}: {askResult.result.cost_estimate_tokens}</li>
              <li>{t.duration}: {askResult.result.duration_ms}</li>
            </ul>
            {visualization && (
              <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{t.route}</p>
                <p>{visualization.route_summary}</p>
                {visualization.timeline && visualization.timeline.length > 0 && (
                  <ul className="mt-2 list-inside list-disc">
                    {visualization.timeline.map((item, i) => (
                      <li key={i}>{item.step}: {item.detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadVisualization("l1")}
                className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                {t.l1}
              </button>
              <button
                type="button"
                onClick={() => loadVisualization("l2")}
                className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                {t.l2}
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">Fallback</h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => runFallback("retry")}
                disabled={fallbackStatus.retry === "loading"}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {fallbackStatus.retry === "loading" ? "…" : t.retry}
              </button>
              <button
                type="button"
                onClick={() => runFallback("alternative")}
                disabled={fallbackStatus.alternative === "loading"}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {fallbackStatus.alternative === "loading" ? "…" : t.alternative}
              </button>
              <button
                type="button"
                onClick={() => runFallback("degraded")}
                disabled={fallbackStatus.degraded === "loading"}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {fallbackStatus.degraded === "loading" ? "…" : t.degraded}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
