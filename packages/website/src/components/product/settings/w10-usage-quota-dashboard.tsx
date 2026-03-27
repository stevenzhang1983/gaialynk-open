"use client";

import { useEffect, useState } from "react";
import type { W10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";

const QUOTA_FEATURES = ["agent_deployments", "subscription_task_runs"] as const;

type QuotaRow = {
  feature: string;
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  upgrade_hint?: string;
};

function interpolateUsedOf(template: string, used: number, limit: number): string {
  return template.replace("{{used}}", String(used)).replace("{{limit}}", String(limit));
}

function QuotaMeter({
  row,
  label,
  copy,
  highlighted,
}: {
  row: QuotaRow;
  label: string;
  copy: W10SettingsSuiteCopy;
  highlighted?: boolean;
}) {
  const { used, limit, upgrade_hint: hint } = row;
  const ratio = limit > 0 ? used / limit : 0;
  const pct = Math.min(100, ratio * 100);
  const alert =
    limit > 0 ? (ratio >= 1 ? "full" : ratio >= 0.8 ? "warn" : "ok") : "ok";
  const barColor =
    alert === "full" ? "bg-destructive" : alert === "warn" ? "bg-amber-500" : "bg-primary";

  return (
    <div
      className={[
        "rounded-xl border bg-card p-4",
        highlighted ? "border-primary ring-2 ring-primary/30" : "border-border",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{label}</h3>
        <p className="font-mono text-sm tabular-nums text-muted-foreground">
          {interpolateUsedOf(copy.quotaUsedOf, used, limit)}
        </p>
      </div>
      {limit > 0 && (
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-label={label}
          />
        </div>
      )}
      {alert === "warn" && limit > 0 && (
        <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">{copy.quotaAlert80}</p>
      )}
      {alert === "full" && limit > 0 && (
        <p className="mt-2 text-sm font-medium text-destructive">{copy.quotaAlert100}</p>
      )}
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      {!hint && alert === "full" && <p className="mt-2 text-sm text-muted-foreground">{copy.quotaUpgradeHint}</p>}
    </div>
  );
}

export function W10UsageQuotaDashboard({
  copy,
  highlightFeature,
}: {
  copy: W10SettingsSuiteCopy;
  highlightFeature?: string;
}) {
  const { userId, isAuthenticated, isLoading } = useIdentity();
  const [quotas, setQuotas] = useState<QuotaRow[]>([]);
  const [counters, setCounters] = useState<{
    window_days: number;
    invocation_events_total: number;
    audit_events_total: number;
    event_type_counts: Record<string, number>;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || !isAuthenticated) return;
    let cancelled = false;
    setError("");

    void (async () => {
      try {
        const limitResults = await Promise.all(
          QUOTA_FEATURES.map(async (feature) => {
            const q = new URLSearchParams({ actor_id: userId, feature });
            const res = await fetch(`/api/mainline/usage/limits?${q}`, { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json?.error?.message ?? copy.usageLoadError);
            return json.data as QuotaRow;
          }),
        );

        const cRes = await fetch(
          `/api/mainline/usage/counters?actor_id=${encodeURIComponent(userId)}&window_days=30`,
          { cache: "no-store" },
        );
        const cJson = await cRes.json().catch(() => ({}));
        if (!cRes.ok) throw new Error(cJson?.error?.message ?? copy.usageLoadError);

        if (!cancelled) {
          setQuotas(limitResults);
          setCounters(cJson.data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : copy.usageLoadError);
          setQuotas([]);
          setCounters(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, isAuthenticated, copy.usageLoadError]);

  if (isLoading) {
    return <p className="text-base text-muted-foreground">{copy.loadingIdentity}</p>;
  }

  if (!isAuthenticated) {
    return <p className="text-base text-muted-foreground">{copy.pleaseSignIn}</p>;
  }

  const counts = counters?.event_type_counts ?? {};
  const cloudCompleted = counts["connector.cloud_action.completed"] ?? 0;
  const cloudFailed = counts["connector.cloud_action.failed"] ?? 0;
  const cloudSum = cloudCompleted + cloudFailed;

  return (
    <div className="space-y-8">
      <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{copy.usageWindowNote}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.quotaSection}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quotas[0] && (
            <QuotaMeter
              row={quotas[0]}
              label={copy.quotaDeployments}
              copy={copy}
              highlighted={highlightFeature === quotas[0].feature}
            />
          )}
          {quotas[1] && (
            <QuotaMeter
              row={quotas[1]}
              label={copy.quotaTaskRuns}
              copy={copy}
              highlighted={highlightFeature === quotas[1].feature}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.activitySection}</h2>
        <p className="text-sm text-muted-foreground">{copy.activityNoLimitBar}</p>
        <ul className="space-y-2 rounded-xl border border-border bg-card p-4 text-base">
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">{copy.activityInvocations}</span>
            <span className="font-mono tabular-nums font-medium text-foreground">
              {counters?.invocation_events_total ?? "—"}
            </span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">{copy.activityConnectorCloud}</span>
            <span className="font-mono tabular-nums font-medium text-foreground">{cloudSum}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">{copy.activityAuditTotal}</span>
            <span className="font-mono tabular-nums font-medium text-foreground">
              {counters?.audit_events_total ?? "—"}
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
