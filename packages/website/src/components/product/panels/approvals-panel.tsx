"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { PanelLayout } from "./panel-layout";
import { usePanelFocus } from "../context-panel/panel-focus-context";

type ApprovalListItem = {
  id: string;
  conversation_id: string;
  agent_id: string;
  user_text: string;
  status: string;
  created_at: string;
};

type ApprovalsPanelProps = {
  locale: Locale;
  title: string;
  description?: string;
  backToChatLabel?: string;
};

/**
 * T-4.5 审批队列面板：审批列表视图。对接 T-5.5 GET /api/mainline/approvals，失败时占位。
 */
export function ApprovalsPanel({
  locale,
  title,
  description = "Review and approve high-risk actions that require your confirmation.",
  backToChatLabel,
}: ApprovalsPanelProps) {
  const { setFocus } = usePanelFocus();
  const [items, setItems] = useState<ApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mainline/approvals", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(json.data)) {
        setItems(json.data);
      } else {
        setItems([]);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <PanelLayout
      locale={locale}
      title={title}
      description={description}
      backToChatLabel={backToChatLabel}
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading approvals…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-sm text-muted-foreground">No pending approvals.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setFocus({ type: "approval", approvalId: item.id })}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-surface-raised"
              >
                <span className="font-medium text-foreground">{item.agent_id}</span>
                <span className="ml-2 text-muted-foreground">{item.user_text?.slice(0, 40)}…</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </PanelLayout>
  );
}
