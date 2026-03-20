"use client";

import { useState, useCallback, useEffect } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";
import { getDictionary } from "@/content/dictionaries";

type TaskInstance = {
  id: string;
  user_id: string;
  name: string;
  schedule_cron: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type RunRecord = {
  id: string;
  task_instance_id: string;
  actor_id: string;
  status: string;
  summary: string;
  created_at: string;
};

const LABELS: Record<
  Locale,
  {
    title: string;
    create: string;
    refresh: string;
    empty: string;
    name: string;
    scheduleCron: string;
    status: string;
    pause: string;
    resume: string;
    run: string;
    archive: string;
    delete: string;
    history: string;
    exportJson: string;
    exportCsv: string;
    close: string;
    runs: string;
    anomalySummary: string;
    error: string;
    userId: string;
  }
> = {
  en: {
    title: "Task center",
    create: "Create task",
    refresh: "Refresh",
    empty: "No tasks. Create one below.",
    name: "Name",
    scheduleCron: "Schedule (cron)",
    status: "Status",
    pause: "Pause",
    resume: "Resume",
    run: "Run once",
    archive: "Archive",
    delete: "Delete",
    history: "History",
    exportJson: "Export JSON",
    exportCsv: "Export CSV",
    close: "Close",
    runs: "Runs",
    anomalySummary: "Summary",
    error: "Error",
    userId: "User ID",
  },
  "zh-Hant": {
    title: "任務中心",
    create: "建立任務",
    refresh: "重新整理",
    empty: "尚無任務，請在下方建立。",
    name: "名稱",
    scheduleCron: "排程（cron）",
    status: "狀態",
    pause: "暫停",
    resume: "啟動",
    run: "執行一次",
    archive: "封存",
    delete: "刪除",
    history: "歷史",
    exportJson: "匯出 JSON",
    exportCsv: "匯出 CSV",
    close: "關閉",
    runs: "執行記錄",
    anomalySummary: "摘要",
    error: "錯誤",
    userId: "使用者 ID",
  },
  "zh-Hans": {
    title: "任务中心",
    create: "创建任务",
    refresh: "刷新",
    empty: "暂无任务，请在下方创建。",
    name: "名称",
    scheduleCron: "排程（cron）",
    status: "状态",
    pause: "暂停",
    resume: "启动",
    run: "执行一次",
    archive: "归档",
    delete: "删除",
    history: "历史",
    exportJson: "导出 JSON",
    exportCsv: "导出 CSV",
    close: "关闭",
    runs: "执行记录",
    anomalySummary: "摘要",
    error: "错误",
    userId: "用户 ID",
  },
};

export function SubscriptionsDemo({ locale }: { locale: Locale }) {
  const { userId, isAuthenticated } = useIdentity();
  const dict = getDictionary(locale);
  const authCopy = dict.auth ?? {
    loginRequired: "Sign in to use this feature.",
    loginCta: "Sign in",
    sessionExpired: "Session expired.",
    permissionDenied: "Permission denied.",
  };
  const [tasks, setTasks] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [createName, setCreateName] = useState("");
  const [createCron, setCreateCron] = useState("0 * * * *");
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [historyModal, setHistoryModal] = useState<{
    taskId: string;
    runs: RunRecord[];
    anomaly_summary?: { total_runs: number; completed_runs: number; failed_runs: number; failure_rate: number };
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const t = LABELS[locale];

  const fetchTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/mainline/user-task-instances?user_id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Request failed");
        setTasks([]);
        return;
      }
      setTasks(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setError("Network error");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchTasks();
    else setLoading(false);
  }, [userId, fetchTasks]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim() || !createCron.trim() || !userId) return;
    setCreateSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/mainline/user-task-instances", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: createName.trim(),
          schedule_cron: createCron.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json?.data?.id) {
        setCreateName("");
        setCreateCron("0 * * * *");
        await fetchTasks();
      } else {
        setError(json?.error?.message ?? "Create failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function runAction(
    taskId: string,
    action: "pause" | "resume" | "run" | "archive" | "delete",
  ) {
    if (!userId) return;
    setActionLoading((s) => ({ ...s, [taskId]: action }));
    setError("");
    const path = action === "delete" ? `/${taskId}/delete` : `/${taskId}/${action}`;
    try {
      const res = await fetch(`/api/mainline/user-task-instances${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      const json = await res.json();
      if (res.ok) {
        await fetchTasks();
        if (historyModal?.taskId === taskId) setHistoryModal(null);
      } else {
        setError(json?.error?.message ?? "Action failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading((s) => {
        const next = { ...s };
        delete next[taskId];
        return next;
      });
    }
  }

  async function openHistory(taskId: string) {
    if (!userId) return;
    try {
      const res = await fetch(
        `/api/mainline/user-task-instances/${taskId}/history?actor_id=${encodeURIComponent(userId)}&limit=20`,
      );
      const json = await res.json();
      if (res.ok && json?.data) {
        setHistoryModal({
          taskId,
          runs: json.data.runs ?? [],
          anomaly_summary: json.data.anomaly_summary,
        });
      } else {
        setError(json?.error?.message ?? "History failed");
      }
    } catch {
      setError("Network error");
    }
  }

  function exportTask(taskId: string, format: "json" | "csv") {
    if (!userId) return;
    const url = `/api/mainline/user-task-instances/${taskId}/export?format=${format}&actor_id=${encodeURIComponent(userId)}`;
    window.open(url, "_blank");
  }

  function confirmDelete() {
    if (deleteConfirm && userId) {
      runAction(deleteConfirm, "delete");
      setDeleteConfirm(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">{authCopy.loginRequired}</p>
        <p className="mt-2 text-sm text-muted-foreground">{authCopy.loginCta}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-foreground">{t.title}</h2>
        <button
          type="button"
          onClick={fetchTasks}
          disabled={loading}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading ? "…" : t.refresh}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {t.error}: {error}
        </div>
      )}

      {deleteConfirm && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="text-foreground">Delete this task? This cannot be undone.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
              onClick={confirmDelete}
            >
              Confirm delete
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-muted"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={createTask} className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">{t.create}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.userId}: {userId}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-foreground">{t.name}</span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="My daily sync"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">{t.scheduleCron}</span>
            <input
              type="text"
              value={createCron}
              onChange={(e) => setCreateCron(e.target.value)}
              placeholder="0 * * * *"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={createSubmitting || !createName.trim() || !createCron.trim()}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {createSubmitting ? "…" : t.create}
        </button>
      </form>

      {loading && tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="space-y-4">
          {tasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{task.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.schedule_cron} · {t.status}: {task.status}
                  </p>
                  <p className="text-xs text-muted-foreground">{task.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => runAction(task.id, "resume")}
                      disabled={!!actionLoading[task.id]}
                      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {actionLoading[task.id] === "resume" ? "…" : t.resume}
                    </button>
                  )}
                  {task.status === "active" && (
                    <>
                      <button
                        type="button"
                        onClick={() => runAction(task.id, "pause")}
                        disabled={!!actionLoading[task.id]}
                        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {actionLoading[task.id] === "pause" ? "…" : t.pause}
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction(task.id, "run")}
                        disabled={!!actionLoading[task.id]}
                        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {actionLoading[task.id] === "run" ? "…" : t.run}
                      </button>
                    </>
                  )}
                  {(task.status === "active" || task.status === "paused") && (
                    <button
                      type="button"
                      onClick={() => runAction(task.id, "archive")}
                      disabled={!!actionLoading[task.id]}
                      className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    >
                      {actionLoading[task.id] === "archive" ? "…" : t.archive}
                    </button>
                  )}
                  {task.status !== "deleted" && (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(task.id)}
                      disabled={!!actionLoading[task.id]}
                      className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      {actionLoading[task.id] === "delete" ? "…" : t.delete}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openHistory(task.id)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    {t.history}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportTask(task.id, "json")}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    {t.exportJson}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportTask(task.id, "csv")}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    {t.exportCsv}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{t.history}</h3>
              <button
                type="button"
                onClick={() => setHistoryModal(null)}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
              >
                {t.close}
              </button>
            </div>
            {historyModal.anomaly_summary && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t.anomalySummary}: total {historyModal.anomaly_summary.total_runs}, completed{" "}
                {historyModal.anomaly_summary.completed_runs}, failed{" "}
                {historyModal.anomaly_summary.failed_runs}, failure rate{" "}
                {(historyModal.anomaly_summary.failure_rate * 100).toFixed(2)}%
              </p>
            )}
            <ul className="mt-4 space-y-2">
              {historyModal.runs.length === 0 ? (
                <li className="text-sm text-muted-foreground">No runs yet.</li>
              ) : (
                historyModal.runs.map((run) => (
                  <li key={run.id} className="rounded border border-border bg-background p-2 text-sm">
                    <span className="font-medium text-foreground">{run.status}</span> — {run.summary} —{" "}
                    {run.created_at}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
