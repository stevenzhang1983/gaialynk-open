"use client";

import type { Locale } from "@/lib/i18n/locales";
import { PanelLayout } from "./panel-layout";

type HistoryPanelProps = {
  locale: Locale;
  title: string;
  description?: string;
  backToChatLabel?: string;
};

/**
 * T-4.5 历史记录面板：历史列表 + 回放视图骨架。初版占位，结构到位即可。
 */
export function HistoryPanel({
  locale,
  title,
  description = "Browse run history and replay past executions.",
  backToChatLabel,
}: HistoryPanelProps) {
  const placeholderItems = [
    { id: "h1", label: "Conversation — Summary Pro", at: "2026-03-19 10:30" },
    { id: "h2", label: "Conversation — Code Reviewer", at: "2026-03-18 14:00" },
  ];

  return (
    <PanelLayout
      locale={locale}
      title={title}
      description={description}
      backToChatLabel={backToChatLabel}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-medium text-foreground">History list</h2>
          <ul className="mt-2 space-y-1">
            {placeholderItems.map((item) => (
              <li
                key={item.id}
                className="rounded border border-border bg-background px-2 py-2 text-xs text-foreground"
              >
                {item.label} · {item.at}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="text-sm font-medium text-foreground">Replay</h2>
          <p className="mt-2 text-xs text-muted-foreground">Select an item to replay. — Placeholder.</p>
        </div>
      </div>
    </PanelLayout>
  );
}
