"use client";

import { useState, useCallback, useEffect } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";
import { getDictionary } from "@/content/dictionaries";

type QueueItem = {
  invocation_id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  status: string;
  created_at: string;
};

const LABELS: Record<
  Locale,
  {
    title: string;
    refresh: string;
    empty: string;
    invocationId: string;
    conversationId: string;
    agentId: string;
    approve: string;
    deny: string;
    askMoreInfo: string;
    delegate: string;
    reason: string;
    question: string;
    delegateTo: string;
    submit: string;
    cancel: string;
    error: string;
    success: string;
  }
> = {
  en: {
    title: "Review queue (HITL)",
    refresh: "Refresh",
    empty: "No items pending review.",
    invocationId: "Invocation",
    conversationId: "Conversation",
    agentId: "Agent",
    approve: "Approve",
    deny: "Deny",
    askMoreInfo: "Ask more info",
    delegate: "Delegate",
    reason: "Reason (optional)",
    question: "Question",
    delegateTo: "Delegate to",
    submit: "Submit",
    cancel: "Cancel",
    error: "Error",
    success: "Done",
  },
  "zh-Hant": {
    title: "審核佇列（HITL）",
    refresh: "重新整理",
    empty: "目前沒有待審項目。",
    invocationId: "調用",
    conversationId: "會話",
    agentId: "Agent",
    approve: "通過",
    deny: "拒絕",
    askMoreInfo: "要求補充",
    delegate: "轉派",
    reason: "原因（選填）",
    question: "問題",
    delegateTo: "轉派給",
    submit: "送出",
    cancel: "取消",
    error: "錯誤",
    success: "完成",
  },
  "zh-Hans": {
    title: "审核队列（HITL）",
    refresh: "刷新",
    empty: "暂无待审项。",
    invocationId: "调用",
    conversationId: "会话",
    agentId: "Agent",
    approve: "通过",
    deny: "拒绝",
    askMoreInfo: "要求补充",
    delegate: "转派",
    reason: "原因（选填）",
    question: "问题",
    delegateTo: "转派给",
    submit: "提交",
    cancel: "取消",
    error: "错误",
    success: "完成",
  },
};

export function RecoveryHitlDemo({ locale }: { locale: Locale }) {
  const { userId, isAuthenticated } = useIdentity();
  const dict = getDictionary(locale);
  const authCopy = dict.auth ?? {
    loginRequired: "Sign in to use this feature.",
    loginCta: "Sign in",
    sessionExpired: "Session expired.",
    permissionDenied: "Permission denied.",
  };
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [modal, setModal] = useState<{
    invocationId: string;
    action: "deny" | "ask-more-info" | "delegate";
    value: string;
  } | null>(null);

  const t = LABELS[locale];

  const fetchQueue = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mainline/review-queue", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Request failed");
        setItems([]);
        return;
      }
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setError("Network error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchQueue();
    else setLoading(false);
  }, [userId, fetchQueue]);

  async function runAction(
    invocationId: string,
    action: "approve" | "deny" | "ask-more-info" | "delegate",
    body: Record<string, string>,
  ) {
    if (!userId) return;
    setActionLoading((s) => ({ ...s, [invocationId]: action }));
    setModal(null);
    try {
      const res = await fetch(`/api/mainline/review-queue/${invocationId}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.ok) {
        await fetchQueue();
      } else {
        setError(json?.error?.message ?? "Action failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading((s) => {
        const next = { ...s };
        delete next[invocationId];
        return next;
      });
    }
  }

  function openModal(invocationId: string, action: "deny" | "ask-more-info" | "delegate") {
    setModal({ invocationId, action, value: "" });
  }

  function submitModal() {
    if (!modal) return;
    if (!userId) return;
    const { invocationId, action, value } = modal;
    const approver_id = userId;
    if (action === "deny") {
      runAction(invocationId, "deny", { approver_id, ...(value ? { reason: value } : {}) });
    } else if (action === "ask-more-info") {
      if (!value.trim()) return;
      runAction(invocationId, "ask-more-info", { approver_id, question: value.trim() });
    } else if (action === "delegate") {
      if (!value.trim()) return;
      runAction(invocationId, "delegate", { approver_id, delegate_to: value.trim() });
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
          onClick={fetchQueue}
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

      {loading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.invocation_id}
              className="rounded-xl border border-border bg-card p-6"
            >
              <div className="grid gap-2 text-sm">
                <p>
                  <span className="font-medium text-foreground">{t.invocationId}:</span>{" "}
                  <code className="rounded bg-muted px-1">{item.invocation_id}</code>
                </p>
                <p className="text-muted-foreground">
                  {t.conversationId}: {item.conversation_id} · {t.agentId}: {item.agent_id}
                </p>
                <p className="text-muted-foreground">
                  {item.status} · {item.created_at}
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    runAction(item.invocation_id, "approve", {
                      approver_id: userId!,
                    })
                  }
                  disabled={!!actionLoading[item.invocation_id]}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {actionLoading[item.invocation_id] === "approve" ? "…" : t.approve}
                </button>
                <button
                  type="button"
                  onClick={() => openModal(item.invocation_id, "deny")}
                  disabled={!!actionLoading[item.invocation_id]}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  {t.deny}
                </button>
                <button
                  type="button"
                  onClick={() => openModal(item.invocation_id, "ask-more-info")}
                  disabled={!!actionLoading[item.invocation_id]}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  {t.askMoreInfo}
                </button>
                <button
                  type="button"
                  onClick={() => openModal(item.invocation_id, "delegate")}
                  disabled={!!actionLoading[item.invocation_id]}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  {t.delegate}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <p className="text-sm font-medium text-foreground">
              {modal.action === "deny" && t.deny}
              {modal.action === "ask-more-info" && t.askMoreInfo}
              {modal.action === "delegate" && t.delegate}
            </p>
            {modal.action === "deny" && (
              <input
                type="text"
                placeholder={t.reason}
                value={modal.value}
                onChange={(e) => setModal((m) => (m ? { ...m, value: e.target.value } : null))}
                className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            )}
            {(modal.action === "ask-more-info" || modal.action === "delegate") && (
              <input
                type="text"
                placeholder={modal.action === "ask-more-info" ? t.question : t.delegateTo}
                value={modal.value}
                onChange={(e) => setModal((m) => (m ? { ...m, value: e.target.value } : null))}
                className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={submitModal}
                disabled={
                  (modal.action === "ask-more-info" || modal.action === "delegate") &&
                  !modal.value.trim()
                }
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
