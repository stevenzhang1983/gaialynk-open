"use client";

type RiskConfirmationCardProps = {
  invocationId: string;
  title: string;
  invocationCaption: string;
  reason?: string;
  onConfirm: () => void;
  onReject: () => void;
  confirmLabel: string;
  rejectLabel: string;
  loading?: boolean;
};

/**
 * T-4.2 风险确认卡片：嵌入在对话流中，确认/拒绝按钮可操作。
 */
export function RiskConfirmationCard({
  invocationId,
  title,
  invocationCaption,
  reason,
  onConfirm,
  onReject,
  confirmLabel,
  rejectLabel,
  loading = false,
}: RiskConfirmationCardProps) {
  return (
    <div className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
      <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{title}</p>
      {reason && <p className="mt-1 text-xs text-muted-foreground">{reason}</p>}
      <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
        {invocationCaption}: {invocationId.slice(0, 8)}…
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={loading}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {rejectLabel}
        </button>
      </div>
    </div>
  );
}
