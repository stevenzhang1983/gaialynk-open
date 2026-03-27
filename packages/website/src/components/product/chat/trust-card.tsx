"use client";

import type { Locale } from "@/lib/i18n/locales";
import { lineFromUserFacingBundle } from "@/lib/product/locale-bundle";
import type { UserFacingLocaleBundle } from "@/lib/product/reason-codes-user-facing";

export type TrustCardVariant = "need_confirmation" | "platform_blocked" | "data_boundary_blocked";

type TrustRiskLevel = "low" | "medium" | "high" | "critical";

export type TrustCardCopy = {
  needConfirmTitle: string;
  platformBlockedTitle: string;
  boundaryBlockedTitle: string;
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  riskCritical: string;
  confirm: string;
  reject: string;
  viewDetails: string;
  invocationRef: string;
  /** W-18：打开角色化调用收据页 */
  viewInvocationReceipt: string;
};

function riskLabel(level: TrustRiskLevel, copy: TrustCardCopy): string {
  switch (level) {
    case "low":
      return copy.riskLow;
    case "medium":
      return copy.riskMedium;
    case "high":
      return copy.riskHigh;
    case "critical":
      return copy.riskCritical;
    default:
      return copy.riskMedium;
  }
}

function riskStyles(level: TrustRiskLevel): { ring: string; badge: string; icon: string } {
  switch (level) {
    case "low":
      return {
        ring: "border-slate-400/50 bg-slate-500/[0.06]",
        badge: "bg-slate-600/15 text-slate-700 dark:text-slate-200",
        icon: "text-slate-600",
      };
    case "medium":
      return {
        ring: "border-amber-500/45 bg-amber-500/[0.09]",
        badge: "bg-amber-600/20 text-amber-900 dark:text-amber-100",
        icon: "text-amber-700",
      };
    case "high":
      return {
        ring: "border-orange-500/50 bg-orange-500/[0.09]",
        badge: "bg-orange-600/20 text-orange-950 dark:text-orange-100",
        icon: "text-orange-700",
      };
    case "critical":
      return {
        ring: "border-rose-600/55 bg-rose-500/[0.1]",
        badge: "bg-rose-600/20 text-rose-950 dark:text-rose-100",
        icon: "text-rose-700",
      };
    default:
      return riskStyles("medium");
  }
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l7 3v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4m0 4h.01M10.3 4.3L3.1 18.1c-.5.9.1 2 1.1 2h15.6c1 0 1.6-1.1 1.1-2L13.7 4.3c-.5-.9-1.9-.9-2.4 0z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export type TrustCardProps = {
  variant: TrustCardVariant;
  locale: Locale;
  riskLevel: TrustRiskLevel;
  userFacingMessage: UserFacingLocaleBundle;
  reasonCodes: string[];
  invocationId?: string;
  policyRuleId?: string;
  /** Space admin / owner: show raw codes + policy id */
  showAdminFields?: boolean;
  copy: TrustCardCopy;
  onConfirm?: () => void;
  onReject?: () => void;
  onViewDetails?: () => void;
  /** W-18：跳转 /app/receipt/:invocationId */
  onViewInvocationReceipt?: (invocationId: string) => void;
  loading?: boolean;
  /** W-22：操作类型 + 路径等一行摘要 */
  resourceLine?: string;
};

/**
 * W-5 Trust 用户面：拦截 / 需确认 / 数据边界 — 风险等级、reason 人话、CTA。
 */
export function TrustCard({
  variant,
  locale,
  riskLevel,
  userFacingMessage,
  reasonCodes,
  invocationId,
  policyRuleId,
  showAdminFields = false,
  copy,
  onConfirm,
  onReject,
  onViewDetails,
  onViewInvocationReceipt,
  loading = false,
  resourceLine,
}: TrustCardProps) {
  const styles = riskStyles(riskLevel);
  const title =
    variant === "need_confirmation"
      ? copy.needConfirmTitle
      : variant === "data_boundary_blocked"
        ? copy.boundaryBlockedTitle
        : copy.platformBlockedTitle;
  const body = lineFromUserFacingBundle(userFacingMessage, locale);
  const Icon = variant === "need_confirmation" ? ShieldIcon : AlertIcon;

  const livePriority = variant === "need_confirmation" ? "polite" : "assertive";

  return (
    <div
      className={`mt-3 rounded-xl border px-3 py-3 sm:px-4 ${styles.ring}`}
      role="region"
      aria-label={title}
      aria-live={livePriority}
      aria-atomic="true"
    >
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 shrink-0 ${styles.icon}`}>
          <Icon className="h-[1.125rem] w-[1.125rem]" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold leading-snug tracking-tight text-foreground">{title}</h3>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${styles.badge}`}
            >
              {riskLabel(riskLevel, copy)}
            </span>
          </div>
          <p className="max-w-[65ch] text-base leading-relaxed text-foreground/90">{body}</p>
          {resourceLine ? (
            <p className="rounded-md border border-border/70 bg-muted/30 px-2.5 py-2 font-mono text-sm leading-relaxed text-foreground/95">
              {resourceLine}
            </p>
          ) : null}
          {showAdminFields && (reasonCodes.length > 0 || policyRuleId) && (
            <div className="rounded-md border border-border/80 bg-muted/40 px-2.5 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {reasonCodes.length > 0 && (
                <p>
                  <span className="font-sans font-medium text-foreground/80">reason_codes: </span>
                  {reasonCodes.join(", ")}
                </p>
              )}
              {policyRuleId && (
                <p className="mt-1">
                  <span className="font-sans font-medium text-foreground/80">policy_rule_id: </span>
                  {policyRuleId}
                </p>
              )}
            </div>
          )}
          {invocationId && (
            <p className="truncate font-mono text-xs tabular-nums text-muted-foreground">
              {copy.invocationRef}: {invocationId.slice(0, 8)}…
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {variant === "need_confirmation" && onConfirm && onReject && (
              <>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={loading}
                  className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {copy.confirm}
                </button>
                <button
                  type="button"
                  onClick={onReject}
                  disabled={loading}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
                >
                  {copy.reject}
                </button>
              </>
            )}
            {onViewDetails && (
              <button
                type="button"
                onClick={onViewDetails}
                className="rounded-md px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {copy.viewDetails}
              </button>
            )}
            {invocationId && onViewInvocationReceipt && (
              <button
                type="button"
                onClick={() => onViewInvocationReceipt(invocationId)}
                className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {copy.viewInvocationReceipt}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
