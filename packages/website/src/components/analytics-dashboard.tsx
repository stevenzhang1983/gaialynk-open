"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { FunnelSnapshot } from "@/lib/analytics/funnel";
import { buildWeeklyReviewMarkdown } from "@/lib/analytics/weekly-review";

type DashboardResponse = {
  ok: boolean;
  snapshot?: FunnelSnapshot;
  generatedAt?: string;
};

type AnalyticsDashboardProps = {
  initialLocale: Locale;
};

const LOCALE_OPTIONS: Array<Locale | "all"> = ["all", "en", "zh-Hant", "zh-Hans"];

export function AnalyticsDashboard({ initialLocale }: AnalyticsDashboardProps) {
  const [locale, setLocale] = useState<Locale | "all">(initialLocale);
  const [snapshot, setSnapshot] = useState<FunnelSnapshot | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const response = await fetch(`/api/analytics/funnel?locale=${locale}`, { cache: "no-store" });
      const data = (await response.json()) as DashboardResponse;
      if (!cancelled && data.ok && data.snapshot) {
        setSnapshot(data.snapshot);
        setGeneratedAt(data.generatedAt || "");
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), 6000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [locale]);

  const metricCards = useMemo(
    () => [
      { label: "Home Views", value: snapshot?.counts.homeViews ?? 0 },
      { label: "Start Building Clicks", value: snapshot?.counts.startBuildingClicks ?? 0 },
      { label: "Docs Clicks", value: snapshot?.counts.docsClicks ?? 0 },
      { label: "Activation Events", value: snapshot?.counts.activationEvents ?? 0 },
      { label: "Demo Submits", value: snapshot?.counts.demoSubmits ?? 0 },
      { label: "Waitlist Submits", value: snapshot?.counts.waitlistSubmits ?? 0 },
      { label: "Events (24h)", value: snapshot?.last24hEvents ?? 0 },
      { label: "Suspected Events", value: snapshot?.suspectedEvents ?? 0 },
    ],
    [snapshot],
  );

  const weeklyReviewMarkdown = useMemo(() => {
    if (!snapshot) {
      return "";
    }
    return buildWeeklyReviewMarkdown({
      locale,
      generatedAt,
      snapshot,
    });
  }, [generatedAt, locale, snapshot]);

  async function copyWeeklyReview() {
    if (!weeklyReviewMarkdown) {
      return;
    }
    try {
      await navigator.clipboard.writeText(weeklyReviewMarkdown);
      setCopyStatus("Copied weekly snapshot.");
    } catch {
      setCopyStatus("Copy failed. Please copy manually.");
    }
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live website funnel snapshot for entry conversion decisions.</p>
        </div>
        <label className="space-y-2 text-sm">
          <span className="text-muted-foreground">Locale</span>
          <select
            className="rounded-md border border-border bg-card px-3 py-2"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale | "all")}
          >
            {LOCALE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map((item) => (
          <div key={item.label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Conversion Rates</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Start Building CTR: {snapshot?.rates.startBuildingCtr ?? 0}%</li>
            <li>Docs Activation Rate: {snapshot?.rates.docsActivationRate ?? 0}%</li>
            <li>Activation Completion Rate: {snapshot?.rates.activationCompletionRate ?? 0}%</li>
            <li>Demo Conversion Rate: {snapshot?.rates.demoConversionRate ?? 0}%</li>
            <li>Waitlist Conversion Rate: {snapshot?.rates.waitlistConversionRate ?? 0}%</li>
            <li>Suspected Traffic Share: {snapshot?.suspectedTrafficSharePct ?? 0}%</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Consumer Funnel</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Open App Clicks: {snapshot?.consumerFunnel.openAppClicks ?? 0}</li>
            <li>Browse Agent Directory: {snapshot?.consumerFunnel.browseAgentsViews ?? 0}</li>
            <li>Login Trigger: {snapshot?.consumerFunnel.loginTriggers ?? 0}</li>
            <li>First Conversation: {snapshot?.consumerFunnel.firstConversations ?? 0}</li>
            <li>First Result: {snapshot?.consumerFunnel.firstResults ?? 0}</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Open App → Browse Directory: {snapshot?.consumerFunnel.rates.openAppToBrowseAgents ?? 0}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Provider Funnel</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Start Building Clicks: {snapshot?.providerFunnel.startBuildingClicks ?? 0}</li>
            <li>Read Quickstart Docs: {snapshot?.providerFunnel.readDocsClicks ?? 0}</li>
            <li>Login Trigger: {snapshot?.providerFunnel.loginTriggers ?? 0}</li>
            <li>Agent Info Filled: {snapshot?.providerFunnel.agentInfoFilled ?? 0}</li>
            <li>First Test Call Success: {snapshot?.providerFunnel.firstTestCalls ?? 0}</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Start Building → Read Docs: {snapshot?.providerFunnel.rates.startBuildingToReadDocs ?? 0}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Top CTA IDs</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {(snapshot?.topCtas ?? []).map((item) => (
              <li key={item.key}>
                {item.key}: {item.count}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Top Pages by Events</h2>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          {(snapshot?.topPages ?? []).map((item) => (
            <div key={item.key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span>{item.key}</span>
              <span>{item.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Entry Path Funnel (Home to Ask to Recovery to Subscriptions to Waitlist)</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>Home Views: {snapshot?.pathFunnel.homeViews ?? 0}</li>
          <li>Ask Views: {snapshot?.pathFunnel.askViews ?? 0}</li>
          <li>Recovery Views: {snapshot?.pathFunnel.recoveryViews ?? 0}</li>
          <li>Subscriptions Views: {snapshot?.pathFunnel.subscriptionsViews ?? 0}</li>
          <li>Waitlist Submits: {snapshot?.pathFunnel.waitlistSubmits ?? 0}</li>
        </ul>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>Home to Ask: {snapshot?.pathFunnel.rates.homeToAsk ?? 0}%</li>
          <li>Ask to Recovery: {snapshot?.pathFunnel.rates.askToRecovery ?? 0}%</li>
          <li>Recovery to Subscriptions: {snapshot?.pathFunnel.rates.recoveryToSubscriptions ?? 0}%</li>
          <li>Subscriptions to Waitlist: {snapshot?.pathFunnel.rates.subscriptionsToWaitlist ?? 0}%</li>
        </ul>
        <div className="mt-3 space-y-2 text-xs">
          {(snapshot?.pathFunnel.alerts ?? []).map((alert) => (
            <div key={alert.code} className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-200">
              <p className="font-semibold">
                {alert.code}: {alert.currentPct}% (threshold {alert.thresholdPct}%)
              </p>
              <p>{alert.message}</p>
            </div>
          ))}
          {!snapshot?.pathFunnel.alerts?.length ? <p className="text-muted-foreground">No entry path alerts triggered.</p> : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Suspected Traffic Trend (24h)</h2>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          {(snapshot?.suspectedByHour24h ?? []).map((item) => (
            <div key={item.hourOffset} className="grid grid-cols-[70px_1fr_64px] items-center gap-3">
              <span>H-{item.hourOffset}</span>
              <div className="h-2 overflow-hidden rounded bg-border">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${Math.min(100, item.suspectedSharePct)}%` }}
                />
              </div>
              <span>{item.suspectedSharePct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Funnel Alerts</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Thresholds: CTR ≥ {snapshot?.thresholds.minStartBuildingCtrPct ?? 0}% / Submit ≥{" "}
          {snapshot?.thresholds.minSubmitRatePct ?? 0}% / Suspected ≤ {snapshot?.thresholds.maxSuspectedTrafficSharePct ?? 0}%
        </p>
        <div className="mt-3 space-y-2 text-xs">
          {(snapshot?.alerts ?? []).map((alert) => (
            <div
              key={alert.code}
              className={`rounded-md border px-3 py-2 ${
                alert.level === "critical" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-amber-500/40 bg-amber-500/10 text-amber-200"
              }`}
            >
              <p className="font-semibold">
                {alert.code}: {alert.currentPct}% (threshold {alert.thresholdPct}%)
              </p>
              <p>{alert.message}</p>
            </div>
          ))}
          {!snapshot?.alerts?.length ? <p className="text-muted-foreground">No funnel alerts triggered.</p> : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Locale Diagnostics</h2>
        <p className="mt-1 text-xs text-muted-foreground">Compare locale-level CTR, submit rate, and suspected traffic share.</p>
        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
          {(snapshot?.localeDiagnostics ?? []).map((item) => (
            <div key={item.locale} className="grid grid-cols-[80px_1fr_1fr_1fr] gap-3 rounded-md border border-border px-3 py-2">
              <span>{item.locale}</span>
              <span>CTR {item.startBuildingCtr}%</span>
              <span>Submit {item.submitRate}%</span>
              <span>Suspected {item.suspectedTrafficSharePct}%</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-2 text-xs">
          {(snapshot?.localeGapAlerts ?? []).map((alert) => (
            <div key={alert.code} className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-200">
              <p className="font-semibold">
                {alert.code}: {alert.gapPct}% (threshold {alert.thresholdPct}%)
              </p>
              <p>
                Best {alert.bestLocale} / Worst {alert.worstLocale}
              </p>
            </div>
          ))}
          {!snapshot?.localeGapAlerts?.length ? <p className="text-muted-foreground">No locale gap alert triggered.</p> : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Weekly Review Snapshot</h2>
          <button
            type="button"
            onClick={() => void copyWeeklyReview()}
            className="rounded-md border border-border px-3 py-1 text-xs font-semibold"
          >
            Copy Markdown
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Paste into weekly review doc. Includes funnel alerts, locale diagnostics, and Alert → Hypothesis → Change → Recovery template for at least one experiment per week.
        </p>
        <pre className="mt-3 overflow-auto rounded-md border border-border bg-background p-3 text-xs text-muted-foreground">
          {weeklyReviewMarkdown || "Loading snapshot..."}
        </pre>
        {copyStatus ? <p className="mt-2 text-xs text-muted-foreground">{copyStatus}</p> : null}
      </div>

      <p className="text-xs text-muted-foreground">Updated at: {generatedAt || "N/A"}</p>
    </section>
  );
}
