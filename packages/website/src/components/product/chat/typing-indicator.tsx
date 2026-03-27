"use client";

type TypingIndicatorProps = {
  label: string;
};

/**
 * W-16：会话底部「正在输入」省略号动画。
 */
export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground"
      role="status"
      aria-live="polite"
      aria-atomic
    >
      <span className="max-w-[min(100%,24rem)] truncate font-medium text-foreground/90">{label}</span>
      <span className="inline-flex gap-0.5" aria-hidden>
        <span
          className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/80"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/80"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/80"
          style={{ animationDelay: "300ms" }}
        />
      </span>
    </div>
  );
}
