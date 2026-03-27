"use client";

import { useCallback, useState } from "react";
import { lineFromUserFacingBundle } from "@/lib/product/locale-bundle";
import type { Locale } from "@/lib/i18n/locales";
import type { UserFacingLocaleBundle } from "@/lib/product/reason-codes-user-facing";

export type ReceiptSummaryCopy = {
  sectionTitle: string;
  issuedAtLabel: string;
  summaryLabel: string;
  copyFullId: string;
  copied: string;
  viewReceipt: string;
  adminReasonCodes: string;
  adminPolicyRule: string;
};

export type ReceiptSummaryProps = {
  locale: Locale;
  receiptId: string;
  issuedAt?: string;
  /** End-user line, e.g. trust summary */
  summaryBundle?: UserFacingLocaleBundle;
  reasonCodes?: string[];
  policyRuleId?: string;
  showAdminFields?: boolean;
  copy: ReceiptSummaryCopy;
  /** 第二参数为 invocation id 时，产品区优先打开角色化调用收据页（W-18） */
  onViewReceipt?: (receiptId: string, invocationId?: string) => void;
  invocationId?: string;
};

/**
 * W-5 收据用户可见切片：截断 ID、时间、摘要、复制完整 ID；管理员可见 reason / 策略。
 */
export function ReceiptSummary({
  locale,
  receiptId,
  issuedAt,
  summaryBundle,
  reasonCodes,
  policyRuleId,
  showAdminFields = false,
  copy,
  onViewReceipt,
  invocationId,
}: ReceiptSummaryProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(receiptId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [receiptId]);

  const summaryText = summaryBundle ? lineFromUserFacingBundle(summaryBundle, locale) : null;

  return (
    <div
      className="mt-3 rounded-xl border border-border/90 bg-muted/30 px-3 py-3 sm:px-4"
      role="region"
      aria-label={copy.sectionTitle}
    >
      <h3 className="text-sm font-semibold leading-snug text-foreground">{copy.sectionTitle}</h3>
      <dl className="mt-2 space-y-1.5 text-sm leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-muted-foreground">{copy.issuedAtLabel}</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {issuedAt ? new Date(issuedAt).toLocaleString() : "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="shrink-0 text-muted-foreground">{copy.summaryLabel}</dt>
          <dd className="max-w-[65ch] min-w-0 text-foreground/90">
            {summaryText ?? <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <dt className="sr-only">Receipt ID</dt>
          <dd className="font-mono text-xs tabular-nums text-muted-foreground">
            ID <span className="text-foreground">{receiptId.slice(0, 8)}</span>…
          </dd>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-md border border-border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            {copied ? copy.copied : copy.copyFullId}
          </button>
          {onViewReceipt && (
            <button
              type="button"
              onClick={() => onViewReceipt(receiptId, invocationId)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {copy.viewReceipt}
            </button>
          )}
        </div>
        {showAdminFields && (reasonCodes?.length || policyRuleId) && (
          <div className="mt-2 rounded-md border border-border/80 bg-background/80 px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
            {reasonCodes && reasonCodes.length > 0 && (
              <p>
                <span className="font-sans font-medium text-foreground/80">{copy.adminReasonCodes}</span>{" "}
                {reasonCodes.join(", ")}
              </p>
            )}
            {policyRuleId && (
              <p className="mt-1">
                <span className="font-sans font-medium text-foreground/80">{copy.adminPolicyRule}</span>{" "}
                {policyRuleId}
              </p>
            )}
          </div>
        )}
      </dl>
    </div>
  );
}
