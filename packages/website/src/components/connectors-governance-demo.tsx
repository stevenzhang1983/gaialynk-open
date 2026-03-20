"use client";

import { useState, useCallback, useEffect } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";
import { getDictionary } from "@/content/dictionaries";

type Authorization = {
  id: string;
  user_id: string;
  connector: string;
  scope_level: string;
  scope_value: string;
  expires_at: string;
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
};

type Receipt = {
  id: string;
  authorization_id: string;
  action: string;
  risk_level: string;
  params_summary: Record<string, unknown>;
  result: string;
  env_signature: string;
  created_at: string;
};

const LABELS: Record<
  Locale,
  {
    title: string;
    create: string;
    refresh: string;
    empty: string;
    connector: string;
    scopeLevel: string;
    scopeValue: string;
    expiresInSec: string;
    revoke: string;
    viewReceipt: string;
    receiptIdPlaceholder: string;
    executeAction: string;
    actionPlaceholder: string;
    riskLevel: string;
    close: string;
    receipt: string;
    error: string;
    userId: string;
  }
> = {
  en: {
    title: "Connector authorizations & receipts",
    create: "Create authorization",
    refresh: "Refresh",
    empty: "No authorizations. Create one below.",
    connector: "Connector",
    scopeLevel: "Scope level",
    scopeValue: "Scope value",
    expiresInSec: "Expires (seconds)",
    revoke: "Revoke",
    viewReceipt: "View receipt",
    receiptIdPlaceholder: "Receipt ID",
    executeAction: "Execute action",
    actionPlaceholder: "e.g. my_connector.read",
    riskLevel: "Risk level",
    close: "Close",
    receipt: "Receipt",
    error: "Error",
    userId: "User ID",
  },
  "zh-Hant": {
    title: "Connector 授權與收據",
    create: "建立授權",
    refresh: "重新整理",
    empty: "尚無授權，請在下方建立。",
    connector: "Connector",
    scopeLevel: "範圍層級",
    scopeValue: "範圍值",
    expiresInSec: "有效秒數",
    revoke: "撤銷",
    viewReceipt: "查看收據",
    receiptIdPlaceholder: "收據 ID",
    executeAction: "執行動作",
    actionPlaceholder: "例：my_connector.read",
    riskLevel: "風險等級",
    close: "關閉",
    receipt: "收據",
    error: "錯誤",
    userId: "使用者 ID",
  },
  "zh-Hans": {
    title: "Connector 授权与收据",
    create: "创建授权",
    refresh: "刷新",
    empty: "暂无授权，请在下方创建。",
    connector: "Connector",
    scopeLevel: "范围层级",
    scopeValue: "范围值",
    expiresInSec: "有效秒数",
    revoke: "撤销",
    viewReceipt: "查看收据",
    receiptIdPlaceholder: "收据 ID",
    executeAction: "执行动作",
    actionPlaceholder: "例：my_connector.read",
    riskLevel: "风险等级",
    close: "关闭",
    receipt: "收据",
    error: "错误",
    userId: "用户 ID",
  },
};

const SCOPE_LEVELS = ["directory", "application", "action"] as const;
const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export function ConnectorsGovernanceDemo({ locale }: { locale: Locale }) {
  const { userId, isAuthenticated } = useIdentity();
  const dict = getDictionary(locale);
  const authCopy = dict.auth ?? {
    loginRequired: "Sign in to use this feature.",
    loginCta: "Sign in",
    sessionExpired: "Session expired.",
    permissionDenied: "Permission denied.",
  };
  const [auths, setAuths] = useState<Authorization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [createConnector, setCreateConnector] = useState("demo_connector");
  const [createScopeLevel, setCreateScopeLevel] = useState<"directory" | "application" | "action">("application");
  const [createScopeValue, setCreateScopeValue] = useState("/app");
  const [createExpiresInSec, setCreateExpiresInSec] = useState(3600);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [receiptModal, setReceiptModal] = useState<Receipt | null>(null);
  const [receiptIdInput, setReceiptIdInput] = useState("");
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [executeModal, setExecuteModal] = useState<Authorization | null>(null);
  const [executeAction, setExecuteAction] = useState("");
  const [executeRisk, setExecuteRisk] = useState<"low" | "medium" | "high" | "critical">("low");
  const [executeSubmitting, setExecuteSubmitting] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null);

  const t = LABELS[locale];

  const fetchAuths = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/mainline/connectors/authorizations?user_id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Request failed");
        setAuths([]);
        return;
      }
      setAuths(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setError("Network error");
      setAuths([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) fetchAuths();
    else setLoading(false);
  }, [userId, fetchAuths]);

  async function createAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setCreateSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/mainline/connectors/authorizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          connector: createConnector.trim(),
          scope_level: createScopeLevel,
          scope_value: createScopeValue.trim(),
          expires_in_sec: createExpiresInSec,
        }),
      });
      const json = await res.json();
      if (res.ok && json?.data?.id) {
        await fetchAuths();
      } else {
        setError(json?.error?.message ?? "Create failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function revokeAuth(authId: string) {
    if (!userId) return;
    setRevokeConfirm(null);
    setActionLoading((s) => ({ ...s, [authId]: "revoke" }));
    setError("");
    try {
      const res = await fetch(`/api/mainline/connectors/authorizations/${authId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      const json = await res.json();
      if (res.ok) {
        await fetchAuths();
      } else {
        setError(json?.error?.message ?? "Revoke failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading((s) => {
        const next = { ...s };
        delete next[authId];
        return next;
      });
    }
  }

  async function fetchReceiptById(receiptId: string) {
    if (!receiptId.trim() || !userId) return;
    setReceiptLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/mainline/connectors/local-action-receipts/${receiptId.trim()}?actor_id=${encodeURIComponent(userId)}`,
      );
      const json = await res.json();
      if (res.ok && json?.data) {
        setReceiptModal(json.data);
      } else {
        setError(json?.error?.message ?? "Receipt not found");
      }
    } catch {
      setError("Network error");
    } finally {
      setReceiptLoading(false);
    }
  }

  async function executeLocalAction() {
    if (!executeModal || !executeAction.trim() || !userId) return;
    setExecuteSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/mainline/connectors/local-actions/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          authorization_id: executeModal.id,
          action: executeAction.trim(),
          risk_level: executeRisk,
          confirmed: executeRisk === "high" || executeRisk === "critical",
          params_summary: {},
        }),
      });
      const json = await res.json();
      if (res.ok && json?.data?.receipt_id) {
        setExecuteModal(null);
        setExecuteAction("");
        setExecuteRisk("low");
        await fetchReceiptById(json.data.receipt_id);
      } else {
        setError(json?.error?.message ?? "Execute failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setExecuteSubmitting(false);
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
          onClick={fetchAuths}
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

      {revokeConfirm && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="text-foreground">Revoke this authorization? This cannot be undone.</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700"
              onClick={() => revokeAuth(revokeConfirm!)}
            >
              Confirm revoke
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-foreground hover:bg-muted"
              onClick={() => setRevokeConfirm(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={createAuth} className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">{t.create}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.userId}: {userId}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-foreground">{t.connector}</span>
            <input
              type="text"
              value={createConnector}
              onChange={(e) => setCreateConnector(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">{t.scopeLevel}</span>
            <select
              value={createScopeLevel}
              onChange={(e) => setCreateScopeLevel(e.target.value as typeof createScopeLevel)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {SCOPE_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">{t.scopeValue}</span>
            <input
              type="text"
              value={createScopeValue}
              onChange={(e) => setCreateScopeValue(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-foreground">{t.expiresInSec}</span>
            <input
              type="number"
              min={60}
              max={60 * 60 * 24 * 30}
              value={createExpiresInSec}
              onChange={(e) => setCreateExpiresInSec(Number(e.target.value) || 3600)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={createSubmitting}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {createSubmitting ? "…" : t.create}
        </button>
      </form>

      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">{t.viewReceipt}</p>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={receiptIdInput}
            onChange={(e) => setReceiptIdInput(e.target.value)}
            placeholder={t.receiptIdPlaceholder}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            type="button"
            onClick={() => fetchReceiptById(receiptIdInput)}
            disabled={receiptLoading || !receiptIdInput.trim()}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {receiptLoading ? "…" : t.viewReceipt}
          </button>
        </div>
      </div>

      {loading && auths.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : auths.length === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ul className="space-y-4">
          {auths.map((auth) => (
            <li key={auth.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{auth.connector}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {auth.scope_level} · {auth.scope_value} · {auth.status} · expires {auth.expires_at}
                  </p>
                  <p className="text-xs text-muted-foreground">{auth.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {auth.status === "active" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setExecuteModal(auth)}
                        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                      >
                        {t.executeAction}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevokeConfirm(auth.id)}
                        disabled={!!actionLoading[auth.id]}
                        className="rounded-md border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {actionLoading[auth.id] === "revoke" ? "…" : t.revoke}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{t.receipt}</h3>
              <button
                type="button"
                onClick={() => setReceiptModal(null)}
                className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
              >
                {t.close}
              </button>
            </div>
            <pre className="mt-4 overflow-auto rounded border border-border bg-background p-3 text-xs text-muted-foreground">
              {JSON.stringify(receiptModal, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {executeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-foreground">{t.executeAction}</h3>
            <p className="mt-1 text-xs text-muted-foreground">Auth: {executeModal.id}</p>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-foreground">Action</span>
              <input
                type="text"
                value={executeAction}
                onChange={(e) => setExecuteAction(e.target.value)}
                placeholder={t.actionPlaceholder}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="font-medium text-foreground">{t.riskLevel}</span>
              <select
                value={executeRisk}
                onChange={(e) => setExecuteRisk(e.target.value as typeof executeRisk)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                {RISK_LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setExecuteModal(null); setExecuteAction(""); }}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                {t.close}
              </button>
              <button
                type="button"
                onClick={executeLocalAction}
                disabled={executeSubmitting || !executeAction.trim()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {executeSubmitting ? "…" : t.executeAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
