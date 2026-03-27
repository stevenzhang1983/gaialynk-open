"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { W4AgentUxCopy } from "@/content/i18n/product-experience";
import { CronPicker } from "@/components/product/cron-picker";
import {
  cronExpressionFromPicker,
  summarizeOrchestrationOutput,
  type CronPreset,
} from "@/lib/product/orchestration-ui-helpers";

export type ConversationAgentOption = {
  id: string;
  name: string;
  capabilities: { name: string; risk_level?: string }[];
};

export type TopologyStepDraft = {
  agent_id: string;
  capability_name?: string;
  expected_input: { template: string; description?: string };
  expected_output: { required_fields: string[] };
  field_mapping?: Record<string, string>;
};

type OrchestrationRun = {
  id: string;
  status: string;
  current_step: number;
  steps_json: TopologyStepDraft[];
  schedule_cron?: string | null;
  next_run_at?: string | null;
};

type OrchestrationStepRow = {
  step_index: number;
  agent_id: string;
  status: string;
  error_message: string | null;
  output_json: Record<string, unknown> | null;
};

type Props = {
  conversationId: string;
  userId: string | null;
  localePrefix: string;
  ux: W4AgentUxCopy;
  conversationAgents: ConversationAgentOption[];
  trigger: { text: string; key: number } | null;
  onConsumeTrigger: () => void;
  partialSummaryCopy?: { title: string; leadTemplate: string };
};

function stepLabel(ux: W4AgentUxCopy["orchestration"], idx: number): string {
  return `${ux.stepPrefix} ${idx + 1}`;
}

function statusLabel(ux: W4AgentUxCopy["orchestration"], s: string): string {
  const m: Record<string, string> = {
    pending: ux.statusPending,
    running: ux.statusRunning,
    completed: ux.statusCompleted,
    completed_with_warnings: ux.statusCompletedWarnings,
    failed: ux.statusFailed,
    awaiting_user: ux.statusAwaitingUser,
    awaiting_human_review: ux.statusAwaitingReview,
    lease_expired: ux.statusLeaseExpired,
    scheduled: ux.statusScheduled,
    schedule_paused: ux.statusSchedulePaused,
  };
  return m[s] ?? s.replace(/_/g, " ");
}

function replaceAgentOnStep(
  step: TopologyStepDraft,
  opt: ConversationAgentOption,
  stepIndex: number,
): TopologyStepDraft {
  const capName = opt.capabilities[0]?.name ?? step.capability_name ?? "general";
  return {
    ...step,
    agent_id: opt.id,
    capability_name: capName,
    expected_input: {
      template:
        stepIndex === 0
          ? "{{user_message}}"
          : "Prior agent structured output:\n{{prev}}\n\nOriginal user message:\n{{user_message}}",
      description: step.expected_input.description,
    },
    expected_output: step.expected_output,
    field_mapping: stepIndex > 0 ? { prev: "prev" } : undefined,
  };
}

function stepAccentClass(status: string): string {
  if (status === "failed") return "border-l-4 border-l-red-500/80 bg-red-500/5";
  if (status === "lease_expired") return "border-l-4 border-l-amber-500/80 bg-amber-500/5";
  if (status === "completed" || status === "completed_with_warnings") {
    return "border-l-4 border-l-emerald-500/80 bg-emerald-500/5";
  }
  return "border-l-4 border-l-transparent bg-card/50";
}

/**
 * W-4 / E-5 / W-20：推荐方案、即时与定时执行、数据流预览、租约超时操作。
 */
export function OrchestrationPlanBar({
  conversationId,
  userId,
  localePrefix,
  ux,
  conversationAgents,
  trigger,
  onConsumeTrigger,
  partialSummaryCopy,
}: Props) {
  const o = ux.orchestration;
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "recommending" | "draft" | "running" | "done">("idle");
  const [userMessage, setUserMessage] = useState("");
  const [draftSteps, setDraftSteps] = useState<TopologyStepDraft[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<OrchestrationRun | null>(null);
  const [stepRows, setStepRows] = useState<OrchestrationStepRow[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [cronPicker, setCronPicker] = useState<{ preset: CronPreset; customCron: string }>({
    preset: "daily9",
    customCron: "0 9 * * *",
  });
  const [scheduling, setScheduling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchRun = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/mainline/orchestrations/${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.data?.run) return;
      const r = json.data.run as OrchestrationRun;
      setRun(r);
      setStepRows(Array.isArray(json.data.steps) ? json.data.steps : []);
      const st = r.status;
      const bScheduledIdle = st === "scheduled" && Boolean(r.schedule_cron?.trim());
      if (["completed", "failed", "partial_completed", "canceled"].includes(st) || bScheduledIdle) {
        stopPoll();
        setPhase("done");
        setCollapsed(false);
      }
    },
    [stopPoll],
  );

  useEffect(() => {
    return () => stopPoll();
  }, [stopPoll]);

  useEffect(() => {
    if (!trigger || !userId) return;

    let cancelled = false;
    (async () => {
      setErrorHint(null);
      setPhase("recommending");
      setCollapsed(false);
      setUserMessage(trigger.text);
      onConsumeTrigger();
      try {
        const res = await fetch("/api/mainline/orchestrations/recommend", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversation_id: conversationId, user_message: trigger.text }),
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const steps = json.data?.steps as TopologyStepDraft[] | undefined;
        if (!res.ok || !Array.isArray(steps) || steps.length < 2) {
          setPhase("idle");
          setErrorHint(o.recommendUnavailable);
          return;
        }
        setDraftSteps(steps);
        setPhase("draft");
        setRunId(null);
        setRun(null);
        setStepRows([]);
      } catch {
        if (!cancelled) {
          setPhase("idle");
          setErrorHint(o.recommendUnavailable);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trigger, userId, conversationId, onConsumeTrigger, o]);

  const startPoll = useCallback(
    (id: string) => {
      stopPoll();
      void fetchRun(id);
      pollRef.current = setInterval(() => void fetchRun(id), 2000);
    },
    [fetchRun, stopPoll],
  );

  const handleConfirm = async () => {
    if (!userId || draftSteps.length === 0 || !userMessage) return;
    setErrorHint(null);
    try {
      const res = await fetch("/api/mainline/orchestrations/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: userMessage,
          topology_source: "dynamic",
          steps: draftSteps,
          idempotency_key: `${conversationId}:${userMessage.slice(0, 200)}:${Date.now()}`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const id = json.data?.run?.id as string | undefined;
      if (!res.ok || !id) {
        setErrorHint(o.runFailed);
        return;
      }
      setRunId(id);
      setPhase("running");
      setRun(json.data.run);
      setStepRows(Array.isArray(json.data.steps) ? json.data.steps : []);
      startPoll(id);
    } catch {
      setErrorHint(o.runFailed);
    }
  };

  const handleScheduleConfirm = async () => {
    if (!userId || draftSteps.length === 0 || !userMessage) return;
    setScheduling(true);
    setErrorHint(null);
    try {
      const schedule_cron = cronExpressionFromPicker(cronPicker);
      const res = await fetch("/api/mainline/orchestrations/schedule", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversation_id: conversationId,
          user_message: userMessage,
          topology_source: "dynamic",
          steps: draftSteps,
          schedule_cron,
          idempotency_key: `sched:${conversationId}:${Date.now()}`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const id = json.data?.run?.id as string | undefined;
      if (!res.ok || !id) {
        setErrorHint(o.scheduleFailed);
        return;
      }
      setScheduleOpen(false);
      setRunId(id);
      setRun(json.data.run as OrchestrationRun);
      setStepRows(Array.isArray(json.data.steps) ? json.data.steps : []);
      setPhase("done");
      stopPoll();
    } catch {
      setErrorHint(o.scheduleFailed);
    } finally {
      setScheduling(false);
    }
  };

  const handleRetryStep = async (stepIndex: number) => {
    if (!userId || !runId) return;
    setPhase("running");
    await fetch(`/api/mainline/orchestrations/${encodeURIComponent(runId)}/steps/${stepIndex}/retry`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: userId }),
    });
    startPoll(runId);
  };

  const handleAbandonRun = async () => {
    if (!userId || !runId) return;
    await fetch(`/api/mainline/orchestrations/${encodeURIComponent(runId)}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: userId, action: "abandon_run" }),
    });
    stopPoll();
    setPhase("done");
    void fetchRun(runId);
  };

  const dismiss = () => {
    stopPoll();
    setPhase("idle");
    setDraftSteps([]);
    setRunId(null);
    setRun(null);
    setStepRows([]);
    setErrorHint(null);
    setExpanded({});
    setScheduleOpen(false);
  };

  const agentName = (id: string) => conversationAgents.find((a) => a.id === id)?.name ?? id.slice(0, 8) + "…";

  if (phase === "idle" && !errorHint) return null;

  const showBar = phase !== "idle" || Boolean(errorHint);
  if (!showBar) return null;

  const totalSteps = run?.steps_json?.length ?? draftSteps.length ?? 0;
  const current = run?.current_step ?? 0;
  const progressPct = (() => {
    if (totalSteps <= 0 || !run) return 0;
    if (run.status === "completed") return 100;
    if (run.status === "scheduled" && run.schedule_cron) return 0;
    if (phase === "done" && run.status === "failed") {
      return Math.min(100, Math.round(((current + 1) / totalSteps) * 100));
    }
    if (phase === "running") {
      return Math.min(100, Math.round(((current + 0.5) / totalSteps) * 100));
    }
    if (phase === "done") {
      return Math.min(100, Math.round(((current + 1) / totalSteps) * 100));
    }
    return 0;
  })();

  const sortedStepRows = [...stepRows].sort((a, b) => a.step_index - b.step_index);

  const cronCopy = {
    daily9: o.cronDaily9,
    weeklyMon9: o.cronWeeklyMon9,
    custom: o.cronCustom,
    customPlaceholder: o.cronCustomPlaceholder,
    utcNote: o.cronUtcNote,
  };

  const showLeaseActions = (row: OrchestrationStepRow) =>
    Boolean(userId) &&
    (row.status === "lease_expired" ||
      (run?.status === "lease_expired" && row.step_index === (run?.current_step ?? 0)));

  return (
    <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{o.planTitle}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="rounded px-2 py-0.5 text-[0.6875rem] font-medium text-primary hover:bg-primary/10"
          >
            {collapsed ? o.expand : o.collapse}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded px-2 py-0.5 text-[0.6875rem] text-muted-foreground hover:bg-muted"
          >
            {o.dismissing}
          </button>
        </div>
      </div>

      {scheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gl-schedule-dialog-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-border bg-background p-4 shadow-lg">
            <h2 id="gl-schedule-dialog-title" className="text-sm font-semibold text-foreground">
              {o.scheduleDialogTitle}
            </h2>
            <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">{o.scheduleDialogLead}</p>
            <div className="mt-3">
              <CronPicker copy={cronCopy} value={cronPicker} onChange={setCronPicker} />
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setScheduleOpen(false)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {o.scheduleClose}
              </button>
              <button
                type="button"
                disabled={scheduling}
                onClick={() => void handleScheduleConfirm()}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {scheduling ? "…" : o.scheduleConfirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {!collapsed && (
        <>
          {phase === "recommending" && (
            <p className="text-xs text-muted-foreground">{o.loadingRecommend}</p>
          )}

          {errorHint && <p className="text-xs text-amber-800 dark:text-amber-200">{errorHint}</p>}

          {phase === "draft" && draftSteps.length > 0 && (
            <div className="space-y-2">
              <div
                className="flex flex-wrap items-center gap-1 text-[0.625rem]"
                aria-label={o.flowAriaLabel}
              >
                {draftSteps.map((step, idx) => (
                  <Fragment key={`${step.agent_id}-${idx}`}>
                    {idx > 0 ? (
                      <span className="px-0.5 text-muted-foreground" aria-hidden>
                        →
                      </span>
                    ) : null}
                    <span className="rounded-md border border-border/60 bg-background px-2 py-1 font-medium text-foreground">
                      {stepLabel(o, idx)} · {agentName(step.agent_id)}
                    </span>
                  </Fragment>
                ))}
              </div>
              <ol className="list-decimal space-y-2 pl-4 text-xs text-foreground">
                {draftSteps.map((step, idx) => (
                  <li key={`${step.agent_id}-${idx}-edit`} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{stepLabel(o, idx)}</span>
                      <select
                        value={step.agent_id}
                        onChange={(e) => {
                          const opt = conversationAgents.find((a) => a.id === e.target.value);
                          if (!opt) return;
                          setDraftSteps((prev) =>
                            prev.map((s, i) => (i === idx ? replaceAgentOnStep(s, opt, idx) : s)),
                          );
                        }}
                        className="max-w-[12rem] rounded border border-border bg-background px-1.5 py-0.5 text-[0.6875rem]"
                        aria-label={o.selectAgent}
                      >
                        {conversationAgents.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[0.6875rem] text-muted-foreground">{agentName(step.agent_id)}</p>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleConfirm()}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {o.confirmRun}
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {o.scheduleRun}
                </button>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  {o.singleAgentOnly}
                </button>
              </div>
            </div>
          )}

          {(phase === "running" || phase === "done") && run && (
            <div className="space-y-2">
              <div>
                <div className="mb-0.5 flex justify-between text-[0.6875rem] text-muted-foreground">
                  <span>{o.runProgress}</span>
                  <span>{statusLabel(o, run.status)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {(phase === "running" || phase === "done") && run.steps_json?.length ? (
                <div
                  className="flex flex-wrap items-start gap-1 border-b border-border/50 pb-2"
                  aria-label={o.flowAriaLabel}
                >
                  {run.steps_json.map((_, idx) => {
                    const row = sortedStepRows.find((r) => r.step_index === idx);
                    const st = row?.status ?? "pending";
                    const bubble =
                      row?.output_json && (st === "completed" || st === "completed_with_warnings")
                        ? summarizeOrchestrationOutput(row.output_json)
                        : null;
                    const chipClass =
                      st === "failed"
                        ? "bg-red-500/15 text-red-950 dark:text-red-100"
                        : st === "lease_expired"
                          ? "bg-amber-500/15 text-amber-950 dark:text-amber-100"
                          : st === "completed" || st === "completed_with_warnings"
                            ? "bg-emerald-500/15 text-emerald-950 dark:text-emerald-100"
                            : st === "running"
                              ? "bg-primary/15 text-foreground"
                              : "bg-muted text-muted-foreground";
                    return (
                      <Fragment key={`flow-${idx}`}>
                        {idx > 0 ? (
                          <span className="mt-1.5 text-muted-foreground" aria-hidden>
                            →
                          </span>
                        ) : null}
                        <div className={`max-w-[11rem] rounded-md px-2 py-1 text-[0.625rem] ${chipClass}`}>
                          <div className="font-medium">{stepLabel(o, idx)}</div>
                          <div className="text-[0.5625rem] opacity-90">{statusLabel(o, st)}</div>
                          {bubble ? (
                            <div
                              className="mt-0.5 rounded bg-background/70 px-1 py-0.5 text-[0.5625rem] text-muted-foreground"
                              title={bubble}
                            >
                              {o.outputPreview}: {bubble}
                            </div>
                          ) : null}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              ) : null}

              {phase === "done" &&
                run.status === "partial_completed" &&
                partialSummaryCopy &&
                (() => {
                  const total = run.steps_json?.length ?? sortedStepRows.length;
                  const ok = sortedStepRows.filter(
                    (r) => r.status === "completed" || r.status === "completed_with_warnings",
                  ).length;
                  const lead = partialSummaryCopy.leadTemplate
                    .replace(/\{\{ok\}\}/g, String(ok))
                    .replace(/\{\{total\}\}/g, String(total));
                  return (
                    <div
                      className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-2 dark:border-amber-400/25 dark:bg-amber-500/5"
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      <p className="text-xs font-semibold text-amber-950 dark:text-amber-100">
                        {partialSummaryCopy.title}
                      </p>
                      <p className="mt-1 text-[0.6875rem] leading-relaxed text-foreground">{lead}</p>
                    </div>
                  );
                })()}
              <ul className="space-y-1">
                {sortedStepRows.map((row) => {
                  const open = expanded[row.step_index] ?? false;
                  const lease = showLeaseActions(row);
                  return (
                    <li
                      key={row.step_index}
                      className={`rounded-md border border-border/60 px-2 py-1 ${stepAccentClass(row.status)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="text-[0.6875rem] font-medium">
                          {stepLabel(o, row.step_index)} · {agentName(row.agent_id)}
                        </span>
                        <span
                          className={`text-[0.6875rem] ${
                            row.status === "lease_expired" ? "font-semibold text-amber-800 dark:text-amber-200" : "text-muted-foreground"
                          }`}
                        >
                          {statusLabel(o, row.status)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [row.step_index]: !prev[row.step_index] }))
                        }
                        className="mt-0.5 text-[0.625rem] text-primary hover:underline"
                      >
                        {o.expandStep}
                      </button>
                      {open && (
                        <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/50 p-1 text-[0.625rem] text-muted-foreground">
                          {row.error_message
                            ? row.error_message
                            : row.output_json
                              ? JSON.stringify(row.output_json, null, 2).slice(0, 800)
                              : "—"}
                        </pre>
                      )}
                      {row.status === "failed" && userId && (
                        <div className="mt-1 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleRetryStep(row.step_index)}
                            className="text-[0.625rem] font-medium text-primary hover:underline"
                          >
                            {o.retryStep}
                          </button>
                          <a
                            href={`${localePrefix}/app/settings`}
                            className="text-[0.625rem] text-muted-foreground hover:underline"
                          >
                            {o.sendFeedback}
                          </a>
                        </div>
                      )}
                      {lease && userId && (
                        <div className="mt-1 flex flex-wrap gap-2 border-t border-amber-500/20 pt-1">
                          <button
                            type="button"
                            onClick={() => void handleRetryStep(row.step_index)}
                            className="text-[0.625rem] font-medium text-primary hover:underline"
                          >
                            {o.retryStep}
                          </button>
                          <button
                            type="button"
                            title={o.swapAgentHint}
                            onClick={() => router.push(`${localePrefix}/app/chat/${conversationId}`)}
                            className="text-[0.625rem] font-medium text-foreground underline decoration-muted-foreground hover:text-primary"
                          >
                            {o.swapAgent}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleAbandonRun()}
                            className="text-[0.625rem] font-medium text-muted-foreground hover:text-destructive hover:underline"
                          >
                            {o.abandonRun}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {phase === "done" && (
                <p
                  className="text-[0.6875rem] text-muted-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {run.status === "scheduled" && run.schedule_cron
                    ? o.scheduleCreated
                    : run.status === "completed"
                      ? o.runCompleted
                      : run.status === "partial_completed"
                        ? o.runPartial
                        : run.status === "failed"
                          ? o.failedAt.replace("{{n}}", String((run.current_step ?? 0) + 1))
                          : o.runFailed}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
