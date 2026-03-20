"use client";

type ReceiptLinkProps = {
  receiptId: string;
  label?: string;
  onViewReceipt?: (receiptId: string) => void;
};

/**
 * T-4.2 收据查看入口。点击可回调 onViewReceipt 或跳转收据详情。
 */
export function ReceiptLink({ receiptId, label = "View receipt", onViewReceipt }: ReceiptLinkProps) {
  if (onViewReceipt) {
    return (
      <button
        type="button"
        onClick={() => onViewReceipt(receiptId)}
        className="text-xs font-medium text-primary hover:underline"
      >
        {label}
      </button>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      Receipt: <code className="rounded bg-muted px-1 font-mono text-[10px]">{receiptId.slice(0, 8)}…</code>
    </span>
  );
}
