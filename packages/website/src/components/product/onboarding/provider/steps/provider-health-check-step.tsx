"use client";

import type { ProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
import type { ProviderAgent } from "@/lib/product/provider-agent-types";

type HealthStatus = "ok" | "failed" | null;

type Props = {
  copy: ProviderOnboardingCopy["health"];
  agent: ProviderAgent;
  /** After trigger, result from GET health-check/result */
  status: HealthStatus;
  checkedAt: string | null;
  error: string | null;
  loading: boolean;
  onTrigger: () => void;
  onNext: () => void;
  onBack: () => void;
};

export function ProviderHealthCheckStep({
  copy,
  agent,
  status,
  checkedAt,
  error,
  loading,
  onTrigger,
  onNext,
  onBack,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.beforeCapabilitiesList}
          <code className="rounded bg-muted px-1">capabilities.list</code>
          {copy.afterCapabilitiesBeforeUrl}
          <span className="font-mono text-foreground">{agent.source_url}</span>
          {copy.afterUrl}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-medium text-foreground">{agent.name}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{agent.source_url}</p>
      </div>

      {status !== null && (
        <div
          className={`rounded-xl border p-4 ${
            status === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-destructive/40 bg-destructive/10"
          }`}
        >
          <p className="text-sm font-semibold">{status === "ok" ? copy.connected : copy.failed}</p>
          {checkedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              {copy.checkedAt} {checkedAt}
            </p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onTrigger}
            disabled={loading}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            {loading ? copy.checking : copy.runCheck}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={status !== "ok"}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {copy.next}
          </button>
        </div>
      </div>
    </div>
  );
}
