"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { W13ProviderPortalCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";
import type {
  AgentDetailApiData,
  AgentEndpointsApiData,
  AgentStatsApiData,
  MemoryTier,
  ProviderAgent,
  QueueBehavior,
} from "@/lib/product/provider-agent-types";

type Props = {
  locale: Locale;
  copy: W13ProviderPortalCopy;
};

function statusBadgeClass(status: string | undefined): string {
  if (status === "active") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (status === "pending_review") return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
  if (status === "deprecated") return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400";
  return "bg-muted text-muted-foreground";
}

export function ProviderPortalConsole({ locale, copy }: Props) {
  const router = useRouter();
  const { isAuthenticated, role, isLoading: identityLoading } = useIdentity();

  const [agents, setAgents] = useState<ProviderAgent[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<"forbidden" | "generic" | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgentDetailApiData | null>(null);
  const [endpointsPayload, setEndpointsPayload] = useState<AgentEndpointsApiData | null>(null);
  const [stats, setStats] = useState<AgentStatsApiData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [maxConcurrent, setMaxConcurrent] = useState(1);
  const [queueBehavior, setQueueBehavior] = useState<QueueBehavior>("queue");
  const [timeoutMs, setTimeoutMs] = useState("");
  const [supportsScheduled, setSupportsScheduled] = useState(false);
  const [memoryTier, setMemoryTier] = useState<MemoryTier>("none");

  const [listingSaving, setListingSaving] = useState(false);
  const [listingMessage, setListingMessage] = useState<string | null>(null);

  const [newEndpointUrl, setNewEndpointUrl] = useState("");
  const [endpointBusy, setEndpointBusy] = useState(false);

  const [healthBusy, setHealthBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitFlash, setSubmitFlash] = useState<string | null>(null);

  const blockNonProvider = Boolean(role && role !== "provider");

  const loadAgents = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/mainline/agents/mine", { cache: "no-store" });
      if (res.status === 403) {
        setListError("forbidden");
        setAgents([]);
        return;
      }
      if (!res.ok) {
        setListError("generic");
        setAgents([]);
        return;
      }
      const json = await res.json().catch(() => ({}));
      const rows = Array.isArray(json.data) ? (json.data as ProviderAgent[]) : [];
      setAgents(rows);
      setSelectedId((prev) => {
        if (prev && rows.some((a) => a.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
    } catch {
      setListError("generic");
      setAgents([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || blockNonProvider) {
      setListLoading(false);
      return;
    }
    void loadAgents();
  }, [isAuthenticated, blockNonProvider, loadAgents]);

  const loadDetailBundle = useCallback(async (agentId: string) => {
    setDetailLoading(true);
    setListingMessage(null);
    setSubmitFlash(null);
    setTestOutput(null);
    setTestError(null);
    try {
      const [dRes, eRes, sRes] = await Promise.all([
        fetch(`/api/mainline/agents/${encodeURIComponent(agentId)}`, { cache: "no-store" }),
        fetch(`/api/mainline/agents/${encodeURIComponent(agentId)}/endpoints`, { cache: "no-store" }),
        fetch(`/api/mainline/agents/${encodeURIComponent(agentId)}/stats`, { cache: "no-store" }),
      ]);

      if (dRes.ok) {
        const dj = await dRes.json().catch(() => ({}));
        const row = dj?.data as AgentDetailApiData | undefined;
        if (row) {
          setDetail(row);
          setMaxConcurrent(row.max_concurrent ?? 1);
          setQueueBehavior((row.queue_behavior as QueueBehavior) ?? "queue");
          setTimeoutMs(row.timeout_ms != null ? String(row.timeout_ms) : "");
          setSupportsScheduled(Boolean(row.supports_scheduled));
          setMemoryTier((row.memory_tier as MemoryTier) ?? "none");
        } else {
          setDetail(null);
        }
      } else {
        setDetail(null);
      }

      if (eRes.ok) {
        const ej = await eRes.json().catch(() => ({}));
        const ed = ej?.data as AgentEndpointsApiData | undefined;
        setEndpointsPayload(ed ?? null);
      } else {
        setEndpointsPayload(null);
      }

      if (sRes.ok) {
        const sj = await sRes.json().catch(() => ({}));
        const st = sj?.data as AgentStatsApiData | undefined;
        setStats(st ?? null);
      } else {
        setStats(null);
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId || blockNonProvider) {
      setDetail(null);
      setEndpointsPayload(null);
      setStats(null);
      return;
    }
    void loadDetailBundle(selectedId);
  }, [selectedId, blockNonProvider, loadDetailBundle]);

  const saveListing = useCallback(async () => {
    if (!selectedId) return;
    setListingSaving(true);
    setListingMessage(null);
    try {
      const timeoutParsed = timeoutMs.trim() === "" ? null : Number(timeoutMs);
      const body: Record<string, unknown> = {
        max_concurrent: maxConcurrent,
        queue_behavior: queueBehavior,
        supports_scheduled: supportsScheduled,
        memory_tier: memoryTier,
      };
      if (timeoutParsed !== null && Number.isFinite(timeoutParsed)) {
        body.timeout_ms = timeoutParsed;
      } else {
        body.timeout_ms = null;
      }
      const res = await fetch(`/api/mainline/agents/${encodeURIComponent(selectedId)}/gateway-listing`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setListingMessage(data?.error?.message ?? copy.listingSaveFailed);
        return;
      }
      const next = data?.data as AgentDetailApiData | undefined;
      if (next) setDetail(next);
      setListingMessage(copy.listingSaved);
    } finally {
      setListingSaving(false);
    }
  }, [
    selectedId,
    maxConcurrent,
    queueBehavior,
    timeoutMs,
    supportsScheduled,
    memoryTier,
    copy.listingSaveFailed,
    copy.listingSaved,
  ]);

  const addEndpoint = useCallback(async () => {
    if (!selectedId || !newEndpointUrl.trim()) return;
    setEndpointBusy(true);
    try {
      const res = await fetch(`/api/mainline/agents/${encodeURIComponent(selectedId)}/endpoints`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint_url: newEndpointUrl.trim() }),
      });
      if (res.ok) {
        setNewEndpointUrl("");
        await loadDetailBundle(selectedId);
      }
    } finally {
      setEndpointBusy(false);
    }
  }, [selectedId, newEndpointUrl, loadDetailBundle]);

  const removeEndpoint = useCallback(
    async (endpointId: string) => {
      if (!selectedId) return;
      setEndpointBusy(true);
      try {
        const res = await fetch(
          `/api/mainline/agents/${encodeURIComponent(selectedId)}/endpoints/${encodeURIComponent(endpointId)}`,
          { method: "DELETE" },
        );
        if (res.ok) await loadDetailBundle(selectedId);
      } finally {
        setEndpointBusy(false);
      }
    },
    [selectedId, loadDetailBundle],
  );

  const runHealth = useCallback(async () => {
    if (!selectedId) return;
    setHealthBusy(true);
    try {
      await fetch(`/api/mainline/agents/${encodeURIComponent(selectedId)}/health-check`, { method: "POST" });
      await loadDetailBundle(selectedId);
    } finally {
      setHealthBusy(false);
    }
  }, [selectedId, loadDetailBundle]);

  const runTestCall = useCallback(async () => {
    if (!selectedId) return;
    setTestBusy(true);
    setTestError(null);
    setTestOutput(null);
    try {
      const payload =
        testMessage.trim() === "" ? {} : { message: testMessage.trim() };
      const res = await fetch(`/api/mainline/agents/${encodeURIComponent(selectedId)}/test-call`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setTestError(data?.error?.message ?? "Error");
        return;
      }
      setTestOutput(String(data?.data?.output_text ?? ""));
    } finally {
      setTestBusy(false);
    }
  }, [selectedId, testMessage]);

  const runSubmitReview = useCallback(async () => {
    if (!selectedId) return;
    setSubmitBusy(true);
    setSubmitFlash(null);
    try {
      const res = await fetch(`/api/mainline/agents/${encodeURIComponent(selectedId)}/submit-review`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitFlash(data?.error?.message ?? copy.submitting);
        return;
      }
      setSubmitFlash(copy.submitSuccess);
      await loadAgents();
      await loadDetailBundle(selectedId);
    } finally {
      setSubmitBusy(false);
    }
  }, [selectedId, loadAgents, loadDetailBundle, copy.submitSuccess, copy.submitting]);

  const reviewLabel = useMemo(() => {
    const st = detail?.status;
    if (st === "active") return copy.statusActive;
    if (st === "deprecated") return copy.statusDeprecated;
    if (st === "pending_review") return copy.statusPending;
    return "—";
  }, [detail?.status, copy]);

  const statsTotal = useMemo(() => {
    if (!stats) return 0;
    const c = stats.event_counts;
    return c.completed + c.failed + c.denied + c.need_confirmation;
  }, [stats]);

  if (!isAuthenticated) {
    return null;
  }

  if (identityLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-base text-muted-foreground">{copy.loading}</p>
      </div>
    );
  }

  if (blockNonProvider) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-card p-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">{copy.providerRoleRequired}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.becomeProviderHint}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href={`/${locale}/app/onboarding/provider?return_url=${encodeURIComponent(`/${locale}/app/my-agents`)}`}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
          >
            {copy.openOnboarding}
          </Link>
          <Link
            href={`/${locale}/developers/minimal-onboarding`}
            className="inline-flex rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            {copy.docsMinimalLinkLabel}
          </Link>
        </div>
      </div>
    );
  }

  if (listLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-base text-muted-foreground">{copy.loading}</p>
      </div>
    );
  }

  if (listError === "forbidden") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
        <p className="text-base text-foreground">{copy.forbidden}</p>
      </div>
    );
  }

  if (listError === "generic") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-base text-foreground">{copy.loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            <Link href={`/${locale}/developers/minimal-onboarding`} className="font-medium text-primary underline-offset-4 hover:underline">
              {copy.docsMinimalLinkLabel}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/app/onboarding/provider?return_url=${encodeURIComponent(`/${locale}/app/my-agents`)}`)}
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          + {copy.newAgent}
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-base text-muted-foreground">{copy.empty}</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="space-y-2" role="navigation" aria-label={copy.selectAgent}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.selectAgent}</h2>
            <ul className="space-y-2">
              {agents.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      selectedId === a.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-primary/25"
                    }`}
                  >
                    <p className="font-medium text-foreground">{a.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{a.description}</p>
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(a.status)}`}
                    >
                      {a.status === "active"
                        ? copy.statusActive
                        : a.status === "deprecated"
                          ? copy.statusDeprecated
                          : a.status === "pending_review"
                            ? copy.statusPending
                            : a.status ?? "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 space-y-6">
            {detailLoading && (
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {copy.loading}
              </p>
            )}

            {!detailLoading && selectedId && !detail ? (
              <p className="text-sm text-muted-foreground">{copy.loadError}</p>
            ) : null}

            {detail && !detailLoading && (
              <>
                <section
                  className="rounded-xl border border-border bg-card p-5 shadow-sm"
                  aria-labelledby="w13-review-heading"
                >
                  <h2 id="w13-review-heading" className="text-lg font-semibold text-foreground">
                    {copy.statusLabel}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.reviewWorkflowNote}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass(detail.status)}`}
                    >
                      {reviewLabel}
                    </span>
                  </div>
                  {detail.health_check_error ? (
                    <p className="mt-3 text-sm text-destructive">
                      <span className="font-medium">{copy.healthErrorHint}: </span>
                      {detail.health_check_error}
                    </p>
                  ) : null}
                </section>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="w13-listing-heading">
                  <h2 id="w13-listing-heading" className="text-lg font-semibold text-foreground">
                    {copy.sectionListing}
                  </h2>
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{copy.sectionListingLead}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="w13-mc" className="mb-1 block text-sm font-medium text-foreground">
                        {copy.maxConcurrent}
                      </label>
                      <input
                        id="w13-mc"
                        type="number"
                        min={1}
                        max={1000}
                        value={maxConcurrent}
                        onChange={(e) => setMaxConcurrent(Number(e.target.value) || 1)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label htmlFor="w13-qb" className="mb-1 block text-sm font-medium text-foreground">
                        {copy.queueBehavior}
                      </label>
                      <select
                        id="w13-qb"
                        value={queueBehavior}
                        onChange={(e) => setQueueBehavior(e.target.value as QueueBehavior)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="queue">{copy.queue}</option>
                        <option value="fast_fail">{copy.fastFail}</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="w13-to" className="mb-1 block text-sm font-medium text-foreground">
                        {copy.timeoutMs}
                      </label>
                      <input
                        id="w13-to"
                        type="number"
                        min={1000}
                        placeholder={copy.timeoutHint}
                        value={timeoutMs}
                        onChange={(e) => setTimeoutMs(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">{copy.timeoutHint}</p>
                    </div>
                    <div>
                      <label htmlFor="w13-mt" className="mb-1 block text-sm font-medium text-foreground">
                        {copy.memoryTier}
                      </label>
                      <select
                        id="w13-mt"
                        value={memoryTier}
                        onChange={(e) => setMemoryTier(e.target.value as MemoryTier)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="none">{copy.memoryNone}</option>
                        <option value="session">{copy.memorySession}</option>
                        <option value="user_isolated">{copy.memoryUserIsolated}</option>
                      </select>
                    </div>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={supportsScheduled}
                      onChange={(e) => setSupportsScheduled(e.target.checked)}
                      className="h-4 w-4 rounded border-border"
                    />
                    {copy.supportsScheduled}
                  </label>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void saveListing()}
                      disabled={listingSaving}
                      className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
                    >
                      {listingSaving ? copy.savingListing : copy.saveListing}
                    </button>
                    {listingMessage ? (
                      <span className="text-sm text-muted-foreground" aria-live="polite">
                        {listingMessage}
                      </span>
                    ) : null}
                  </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="w13-ep-heading">
                  <h2 id="w13-ep-heading" className="text-lg font-semibold text-foreground">
                    {copy.sectionEndpoints}
                  </h2>
                  <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">{copy.sectionEndpointsLead}</p>
                  <p className="mt-3 text-sm">
                    <span className="font-medium text-foreground">{copy.primaryUrl}: </span>
                    <span className="break-all text-muted-foreground">{endpointsPayload?.primary_source_url ?? detail.source_url}</span>
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="url"
                      value={newEndpointUrl}
                      onChange={(e) => setNewEndpointUrl(e.target.value)}
                      placeholder={copy.endpointUrlPlaceholder}
                      aria-label={copy.endpointUrlLabel}
                      className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      disabled={endpointBusy || !newEndpointUrl.trim()}
                      onClick={() => void addEndpoint()}
                      className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                    >
                      {copy.addEndpoint}
                    </button>
                  </div>
                  {!endpointsPayload?.endpoints?.length ? (
                    <p className="mt-3 text-sm text-muted-foreground">{copy.endpointEmpty}</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {endpointsPayload.endpoints.map((ep) => (
                        <li
                          key={ep.id}
                          className="flex flex-col gap-2 rounded-md border border-border bg-background/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="break-all text-sm text-foreground">{ep.endpoint_url}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs tabular-nums text-muted-foreground">{ep.status}</span>
                            <button
                              type="button"
                              disabled={endpointBusy}
                              onClick={() => void removeEndpoint(ep.id)}
                              className="text-sm font-medium text-destructive hover:underline disabled:opacity-50"
                            >
                              {copy.removeEndpoint}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="w13-ops-heading">
                  <h2 id="w13-ops-heading" className="text-lg font-semibold text-foreground">
                    {copy.sectionOps}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={healthBusy}
                      onClick={() => void runHealth()}
                      className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60"
                    >
                      {healthBusy ? copy.healthChecking : copy.runHealthCheck}
                    </button>
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <label htmlFor="w13-test-msg" className="mb-1 block text-sm font-medium text-foreground">
                      {copy.testCall}
                    </label>
                    <textarea
                      id="w13-test-msg"
                      rows={2}
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder={copy.testMessagePlaceholder}
                      className="w-full max-w-prose rounded-md border border-border bg-background px-3 py-2 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      disabled={testBusy}
                      onClick={() => void runTestCall()}
                      className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60"
                    >
                      {testBusy ? copy.testCalling : copy.testCall}
                    </button>
                    {testError ? <p className="mt-2 text-sm text-destructive">{testError}</p> : null}
                    {testOutput !== null && !testError ? (
                      <pre className="mt-3 max-h-48 max-w-prose overflow-auto rounded-md bg-muted p-3 text-sm leading-relaxed">{testOutput}</pre>
                    ) : null}
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <button
                      type="button"
                      disabled={submitBusy}
                      onClick={() => void runSubmitReview()}
                      className="rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-60"
                    >
                      {submitBusy ? copy.submitting : copy.submitReview}
                    </button>
                    {submitFlash ? (
                      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                        {submitFlash}
                      </p>
                    ) : null}
                  </div>
                </section>

                {stats ? (
                  <section className="rounded-xl border border-border bg-card p-5 shadow-sm" aria-labelledby="w13-stats-heading">
                    <h2 id="w13-stats-heading" className="text-lg font-semibold text-foreground">
                      {copy.sectionStats}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{copy.sectionStatsLead}</p>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsCompleted}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{stats.event_counts.completed}</dd>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsFailed}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{stats.event_counts.failed}</dd>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsDenied}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{stats.event_counts.denied}</dd>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsNeedConfirmation}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{stats.event_counts.need_confirmation}</dd>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2 sm:col-span-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsTotalInvocations}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{statsTotal}</dd>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsSuccessRate}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">
                          {(stats.success_rate * 100).toFixed(1)}%
                        </dd>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2">
                        <dt className="text-xs font-medium text-muted-foreground">{copy.statsReputation}</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{stats.reputation_grade}</dd>
                      </div>
                    </dl>
                  </section>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
