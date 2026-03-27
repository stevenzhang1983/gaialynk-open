"use client";

type MessageReadIndicatorProps = {
  /** 已送达（服务端确认 / 默认） */
  delivered: boolean;
  /** 至少一名其他成员已读 */
  read: boolean;
  deliveredLabel: string;
  readLabel: string;
};

/**
 * W-16：用户消息气泡底部双勾（已送达 / 已读）。
 */
export function MessageReadIndicator({
  delivered,
  read,
  deliveredLabel,
  readLabel,
}: MessageReadIndicatorProps) {
  const label = read ? readLabel : delivered ? deliveredLabel : "";
  return (
    <span
      className="mt-1 inline-flex items-center gap-0.5 self-end text-[0.65rem] font-medium opacity-80"
      title={label}
      aria-label={label}
    >
      <span className="inline-flex" aria-hidden>
        <CheckIcon filled={delivered || read} />
        <CheckIcon className="-ml-1.5" filled={read} />
      </span>
    </span>
  );
}

function CheckIcon({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={`h-3 w-3 ${filled ? "text-primary-foreground" : "text-primary-foreground/35"} ${className}`}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
