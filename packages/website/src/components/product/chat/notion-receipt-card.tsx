"use client";

import type { Locale } from "@/lib/i18n/locales";
import type { W17NotionReceiptCardCopy } from "@/content/i18n/product-experience";
import type { ParsedNotionReceiptPayload } from "@/lib/product/parse-notion-system-message";

function actionLabelFor(action: string, copy: W17NotionReceiptCardCopy): string {
  switch (action) {
    case "notion.search":
      return copy.actionSearch;
    case "notion.list_databases":
      return copy.actionListDatabases;
    case "notion.database.query":
      return copy.actionQuery;
    case "notion.page.create":
      return copy.actionCreatePage;
    default:
      return copy.actionUnknown;
  }
}

function statusLabelFor(status: ParsedNotionReceiptPayload["status"], copy: W17NotionReceiptCardCopy): string {
  switch (status) {
    case "ok":
      return copy.statusOk;
    case "error":
      return copy.statusError;
    case "connector_expired":
      return copy.statusExpired;
    default:
      return copy.statusError;
  }
}

function statusStyles(status: ParsedNotionReceiptPayload["status"]): string {
  switch (status) {
    case "ok":
      return "text-emerald-700 dark:text-emerald-400";
    case "connector_expired":
      return "text-amber-700 dark:text-amber-400";
    default:
      return "text-destructive";
  }
}

export type NotionReceiptCardProps = {
  receipt: ParsedNotionReceiptPayload;
  copy: W17NotionReceiptCardCopy;
  locale: Locale;
  onViewReceipt?: (receiptId: string) => void;
};

export function NotionReceiptCard({ receipt, copy, locale, onViewReceipt }: NotionReceiptCardProps) {
  const target = receipt.target_label?.trim() || "—";
  const ridShort =
    receipt.receipt_id.length > 14
      ? `${receipt.receipt_id.slice(0, 8)}…${receipt.receipt_id.slice(-4)}`
      : receipt.receipt_id;

  return (
    <div
      className="w-full max-w-md rounded-xl border border-border bg-card px-4 py-3 text-left shadow-sm"
      lang={locale}
    >
      <div className="flex items-center gap-2 border-b border-border/60 pb-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-sm font-bold text-foreground">
          N
        </span>
        <p className="text-sm font-semibold text-foreground">{copy.badge}</p>
      </div>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-muted-foreground">{copy.actionLabel}</dt>
          <dd className="font-medium text-foreground">{actionLabelFor(receipt.action, copy)}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-muted-foreground">{copy.targetLabel}</dt>
          <dd className="min-w-0 flex-1 break-words font-medium text-foreground">{target}</dd>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-muted-foreground">{copy.statusLabel}</dt>
          <dd className={`font-semibold ${statusStyles(receipt.status)}`}>
            {statusLabelFor(receipt.status, copy)}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1">
          <dt className="text-muted-foreground">{copy.receiptRefLabel}</dt>
          <dd className="font-mono text-xs text-foreground">{ridShort}</dd>
          {onViewReceipt ? (
            <button
              type="button"
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
              onClick={() => onViewReceipt(receipt.receipt_id)}
            >
              →
            </button>
          ) : null}
        </div>
      </dl>
    </div>
  );
}
