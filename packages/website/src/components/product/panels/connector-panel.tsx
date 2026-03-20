"use client";

import type { Locale } from "@/lib/i18n/locales";
import { PanelLayout } from "./panel-layout";

type ConnectorPanelProps = {
  locale: Locale;
  title: string;
  description?: string;
  backToChatLabel?: string;
  /** 可选：嵌入现有 Demo 等 */
  children?: React.ReactNode;
};

/**
 * T-4.5 连接器管理面板：连接器管理视图骨架。初版占位，可嵌入 Demo。
 */
export function ConnectorPanel({
  locale,
  title,
  description = "Manage connector authorizations and local actions.",
  backToChatLabel,
  children,
}: ConnectorPanelProps) {
  return (
    <PanelLayout
      locale={locale}
      title={title}
      description={description}
      backToChatLabel={backToChatLabel}
    >
      {children ?? (
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-sm text-muted-foreground">Connector management — placeholder. Configure authorizations and receipts here.</p>
        </div>
      )}
    </PanelLayout>
  );
}
