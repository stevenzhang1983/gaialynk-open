"use client";

import type { Locale } from "@/lib/i18n/locales";
import { PanelLayout } from "./panel-layout";

type TasksPanelProps = {
  locale: Locale;
  title: string;
  description?: string;
  backToChatLabel?: string;
};

/**
 * T-4.5 任务中心面板：任务列表视图骨架。初版占位 + Mock 数据，结构到位即可。
 */
export function TasksPanel({
  locale,
  title,
  description = "View and manage your recurring tasks and subscriptions.",
  backToChatLabel,
}: TasksPanelProps) {
  const placeholderTasks = [
    { id: "1", name: "Weekly summary", status: "active", nextRun: "In 2 days" },
    { id: "2", name: "Policy check", status: "paused", nextRun: "—" },
  ];

  return (
    <PanelLayout
      locale={locale}
      title={title}
      description={description}
      backToChatLabel={backToChatLabel}
    >
      <ul className="space-y-2 rounded-lg border border-border bg-surface p-4">
        {placeholderTasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <span className="font-medium text-foreground">{task.name}</span>
            <span className="text-muted-foreground">{task.status}</span>
            <span className="text-xs text-muted-foreground">{task.nextRun}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">Task center — placeholder. Connect API for real list.</p>
    </PanelLayout>
  );
}
