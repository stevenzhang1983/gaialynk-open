"use client";

import type { W7ProductResilienceCopy } from "@/content/i18n/product-experience";

export type QueuedSend = { id: string; text: string; fileRefId?: string };

type ChatResilienceChromeProps = {
  copy: W7ProductResilienceCopy;
  browserOnline: boolean;
  sseState: "live" | "connecting" | "disconnected";
  sendQueue: QueuedSend[];
  onRemoveQueued: (id: string) => void;
  onFlushQueue: () => void;
};

/**
 * W-7：网络断线提示、SSE 重连提示、发送队列摘要。
 */
export function ChatResilienceChrome({
  copy,
  browserOnline,
  sseState,
  sendQueue,
  onRemoveQueued,
  onFlushQueue,
}: ChatResilienceChromeProps) {
  const showOffline = !browserOnline;
  /** 仅在曾断连后提示，避免首屏 connecting 误报 */
  const showSseWarning = browserOnline && sseState === "disconnected";

  if (!showOffline && !showSseWarning && sendQueue.length === 0) return null;

  return (
    <div className="shrink-0 space-y-1 border-b border-border bg-muted/40 px-3 py-2">
      {showOffline ? (
        <p className="text-xs font-medium text-amber-950 dark:text-amber-100" role="status">
          {copy.connectionOffline}
        </p>
      ) : null}
      {showSseWarning ? (
        <p className="text-xs text-muted-foreground" role="status">
          {copy.connectionSseDisconnected}
        </p>
      ) : null}

      {sendQueue.length > 0 ? (
        <div className="rounded-md border border-border/80 bg-card/80 px-2 py-1.5">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[0.6875rem] font-semibold text-foreground">{copy.queueStripTitle}</span>
            <button
              type="button"
              onClick={onFlushQueue}
              className="text-[0.625rem] font-medium text-primary hover:underline"
            >
              {copy.queueFlushNow}
            </button>
          </div>
          <ul className="max-h-24 space-y-1 overflow-y-auto">
            {sendQueue.map((q) => (
              <li
                key={q.id}
                className="flex items-start justify-between gap-2 rounded bg-muted/50 px-1.5 py-1 text-[0.625rem]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-muted-foreground">{copy.queueWillSend}</p>
                  <p className="line-clamp-2 text-foreground">{q.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveQueued(q.id)}
                  className="shrink-0 font-medium text-muted-foreground hover:text-foreground"
                >
                  {copy.queueRemove}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
