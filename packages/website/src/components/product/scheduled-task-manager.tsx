"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useState } from "react";
import type { W20ScheduledTasksCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

type ScheduledRun = {
  id: string;
  conversation_id: string;
  status: string;
  schedule_cron: string | null;
  next_run_at: string | null;
  user_message?: string;
};

type StepRow = {
  step_index: number;
  agent_id: string;
  status: string;
  error_message: string | null;
  output_json: Record<string, unknown> | null;
};

type Props = {
  locale: Locale;
  localePrefix: string;
  copy: W20ScheduledTasksCopy;
};

function formatNextRun(iso: string | null, locale: Locale): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "zh-Hant" ? "zh-TW" : "zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(d) + " UTC";
  } catch {
    return iso;
  }
}

function statusLabel(run: ScheduledRun, c: W20ScheduledTasksCopy): string {
  if (run.status === "scheduled") return c.statusScheduled;
  if (run.status === "schedule_paused") return c.statusSchedulePaused;
  if (run.status === "running") return c.statusRunning;
  return c.statusOther;
}

export function ScheduledTaskManager({ locale, localePrefix, copy }: Props) {
  const [runs, setRuns] = useState<ScheduledRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailSteps, setDetailSteps] = useState<Record<string, StepRow[]>>({});

  const load = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const res = await fetch("/api/mainline/orchestrations/scheduled", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !Array.isArray(json.data?.runs)) {
        setError(true);
        setRuns([]);
        return;
      }
      setRuns(json.data.runs as ScheduledRun[]);
    } catch {
      setError(true);
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleExpand = async (runId: string) => {
    const next = !expanded[runId];
    setExpanded((e) => ({ ...e, [runId]: next }));
    if (next && !detailSteps[runId]) {
      try {
        const res = await fetch(`/api/mainline/orchestrations/${encodeURIComponent(runId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(json.data?.steps)) {
          setDetailSteps((d) => ({ ...d, [runId]: json.data.steps as StepRow[] }));
        }
      } catch {
        /* ignore */
      }
    }
  };

  const patchAction = async (runId: string, action: "pause" | "resume") => {
    setBusyId(runId);
    try {
      const res = await fetch(`/api/mainline/orchestrations/scheduled/${encodeURIComponent(runId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{copy.pageTitle}</h1>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{copy.pageLead}</p>
      </header>

      {loading && <p className="text-sm text-muted-foreground">{copy.loading}</p>}
      {error && !loading && <p className="text-sm text-amber-800 dark:text-amber-200">{copy.loadError}</p>}

      {!loading && !error && runs.length === 0 && (
        <p className="rounded-lg border border-border bg-card/40 px-4 py-6 text-sm text-muted-foreground">{copy.noTasks}</p>
      )}

      {!loading && runs.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 font-medium">{copy.colStatus}</th>
                <th className="px-3 py-2 font-medium">{copy.colCron}</th>
                <th className="px-3 py-2 font-medium">{copy.colNextRun}</th>
                <th className="px-3 py-2 font-medium">{copy.colConversation}</th>
                <th className="px-3 py-2 font-medium">{copy.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <Fragment key={run.id}>
                  <tr className="border-b border-border/70">
                    <td className="px-3 py-2 align-top text-foreground">{statusLabel(run, copy)}</td>
                    <td className="px-3 py-2 align-top font-mono text-xs text-muted-foreground">
                      {run.schedule_cron ?? "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                      {formatNextRun(run.next_run_at, locale)}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <Link
                        href={`${localePrefix}/app/chat/${run.conversation_id}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        {copy.openChat}
                      </Link>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="flex flex-wrap gap-2">
                        {run.status === "scheduled" && (
                          <button
                            type="button"
                            disabled={busyId === run.id}
                            onClick={() => void patchAction(run.id, "pause")}
                            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
                          >
                            {copy.pause}
                          </button>
                        )}
                        {run.status === "schedule_paused" && (
                          <button
                            type="button"
                            disabled={busyId === run.id}
                            onClick={() => void patchAction(run.id, "resume")}
                            className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {copy.resume}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void toggleExpand(run.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {expanded[run.id] ? copy.collapseHistory : copy.expandHistory}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded[run.id] && (
                    <tr className="border-b border-border bg-muted/20">
                      <td colSpan={5} className="px-3 py-3">
                        <p className="text-xs font-semibold text-foreground">{copy.historyTitle}</p>
                        <p className="mt-1 text-[0.6875rem] text-muted-foreground">{copy.historyNote}</p>
                        <ul className="mt-2 space-y-1">
                          {(detailSteps[run.id] ?? []).map((s) => (
                            <li key={s.step_index} className="rounded border border-border/60 bg-background/80 px-2 py-1 text-xs">
                              <span className="font-medium">#{s.step_index + 1}</span> · {s.status}
                              {s.error_message ? (
                                <span className="ml-2 text-red-600 dark:text-red-400">{s.error_message.slice(0, 120)}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                        {!detailSteps[run.id] && <p className="mt-2 text-xs text-muted-foreground">…</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
