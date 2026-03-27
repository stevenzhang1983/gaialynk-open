"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { ChatMessage, DesktopExecuteRetryContext } from "@/lib/product/chat-types";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageBubbleTrustCopy } from "./message-bubble";
import { MessageItem, type MessageItemModeration } from "./message-item";
import type { ReceiptSummaryCopy } from "./receipt-summary";
import type { W7ProductResilienceCopy, W16RealtimeCopy, W17NotionReceiptCardCopy } from "@/content/i18n/product-experience";

export type ChatThreadSurfaceCopy = {
  chatEmptyHint: string;
  riskActionNeedsConfirmation: string;
  riskConfirm: string;
  riskReject: string;
  riskInvocationCaption: string;
  viewReceipt: string;
  /** W-14：读屏播报新消息 */
  a11yLiveNewUserMessage: string;
  a11yLiveNewAgentMessage: string;
  a11yLiveNewSystemMessage: string;
};

type MessageListProps = {
  messages: ChatMessage[];
  locale: Locale;
  isSpaceAdmin: boolean;
  streamingMessageId?: string | null;
  onConfirmInvocation?: (invocationId: string) => void;
  onRejectInvocation?: (invocationId: string) => void;
  onViewReceipt?: (receiptId: string, invocationId?: string) => void;
  onViewInvocationReceipt?: (invocationId: string) => void;
  onOpenTrustQueue: () => void;
  className?: string;
  threadCopy: ChatThreadSurfaceCopy;
  trustCardCopy: MessageBubbleTrustCopy;
  receiptSummaryCopy: ReceiptSummaryCopy;
  w7Copy?: W7ProductResilienceCopy;
  onRefreshMessages?: () => void;
  /** W-8：通知 deep link 滚动至对应 Trust 卡片 */
  focusInvocationId?: string | null;
  onConsumedFocusInvocation?: () => void;
  /** W-9：空会话首屏（推荐 Agent 等），替代默认一句 hint */
  emptySlot?: ReactNode;
  /** W-16：当前用户 id；用于已读回执与可见性观察 */
  viewerUserId?: string | null;
  /** W-16：他人用户消息进入视口时上报（由父级去重并 WS 发送 message_read） */
  onMarkMessageRead?: (messageId: string) => void;
  w16ReadCopy?: W16RealtimeCopy | null;
  /** W-17 */
  w17NotionReceiptCopy?: W17NotionReceiptCardCopy | null;
  /** W-21：举报 / 管理员隐藏 */
  moderation?: MessageItemModeration | null;
  /** W-22 */
  onDesktopWriteConfirm?: (messageId: string, ctx: DesktopExecuteRetryContext) => void | Promise<void>;
  onDesktopWriteReject?: (messageId: string) => void;
};

/**
 * T-4.2 / W-5 消息流：Trust 卡片、收据摘要、滚动到底部。
 */
export function MessageList({
  messages,
  locale,
  isSpaceAdmin,
  streamingMessageId = null,
  onConfirmInvocation,
  onRejectInvocation,
  onViewReceipt,
  onViewInvocationReceipt,
  onOpenTrustQueue,
  className = "",
  threadCopy,
  trustCardCopy,
  receiptSummaryCopy,
  w7Copy,
  onRefreshMessages,
  focusInvocationId = null,
  onConsumedFocusInvocation,
  emptySlot,
  viewerUserId = null,
  onMarkMessageRead,
  w16ReadCopy = null,
  w17NotionReceiptCopy = null,
  moderation = null,
  onDesktopWriteConfirm,
  onDesktopWriteReject,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const skipBottomScrollOnceRef = useRef(false);
  const reduceMotion = useReducedMotion();
  const [liveAnnounce, setLiveAnnounce] = useState("");
  const prevLenRef = useRef(0);

  useEffect(() => {
    const prev = prevLenRef.current;
    const next = messages.length;
    if (next > prev) {
      const delta = next - prev;
      prevLenRef.current = next;
      /** 跳过多条一次注入（历史拉取），避免误报最后一条 */
      if (delta > 1) {
        return;
      }
      const last = messages[messages.length - 1];
      const line =
        last.sender_type === "user"
          ? threadCopy.a11yLiveNewUserMessage
          : last.sender_type === "agent"
            ? threadCopy.a11yLiveNewAgentMessage
            : threadCopy.a11yLiveNewSystemMessage;
      setLiveAnnounce(line);
      const t = window.setTimeout(() => setLiveAnnounce(""), 1200);
      return () => window.clearTimeout(t);
    }
    prevLenRef.current = next;
  }, [messages, threadCopy.a11yLiveNewAgentMessage, threadCopy.a11yLiveNewSystemMessage, threadCopy.a11yLiveNewUserMessage]);

  useLayoutEffect(() => {
    if (!focusInvocationId || !scrollRootRef.current) return;
    const el = scrollRootRef.current.querySelector(`[data-gl-invocation-id="${focusInvocationId}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      skipBottomScrollOnceRef.current = true;
      onConsumedFocusInvocation?.();
    }
  }, [focusInvocationId, messages, reduceMotion, onConsumedFocusInvocation]);

  useEffect(() => {
    if (skipBottomScrollOnceRef.current) {
      skipBottomScrollOnceRef.current = false;
      return;
    }
    if (focusInvocationId) return;
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, streamingMessageId, reduceMotion, focusInvocationId]);

  const onMarkReadRef = useRef(onMarkMessageRead);
  onMarkReadRef.current = onMarkMessageRead;

  useEffect(() => {
    const root = scrollRootRef.current;
    if (!root || !viewerUserId || !onMarkMessageRead) return;
    const nodes = root.querySelectorAll<HTMLElement>("[data-gl-read-target='1']");
    if (nodes.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          const id = en.target.getAttribute("data-gl-message-id");
          if (id) onMarkReadRef.current?.(id);
        }
      },
      { root, threshold: 0.45, rootMargin: "0px" },
    );
    nodes.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [messages, viewerUserId, onMarkMessageRead]);

  return (
    <div
      ref={scrollRootRef}
      data-gl-chat-scroll-root
      className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-3 sm:p-4 ${className}`}
    >
      <div className="sr-only" aria-live="polite" aria-relevant="additions text">
        {liveAnnounce}
      </div>
      {messages.length === 0 && (emptySlot ?? <p className="py-8 text-center text-base text-muted-foreground">{threadCopy.chatEmptyHint}</p>)}
      {messages.map((msg) => {
        const readObserve =
          Boolean(viewerUserId) &&
          Boolean(onMarkMessageRead) &&
          msg.sender_type === "user" &&
          msg.sender_id !== viewerUserId;
        const w16Read =
          w16ReadCopy &&
          msg.sender_type === "user" &&
          viewerUserId &&
          msg.sender_id === viewerUserId
            ? {
                show: true,
                delivered: msg.status !== "failed" && msg.status !== "sending",
                read: (msg.readByUserIds?.length ?? 0) > 0,
                deliveredLabel: w16ReadCopy.msgDelivered,
                readLabel: w16ReadCopy.msgRead,
              }
            : undefined;
        return (
          <div
            key={msg.id}
            data-gl-read-target={readObserve ? "1" : undefined}
            data-gl-message-id={readObserve ? msg.id : undefined}
          >
            <MessageItem
              message={msg}
              locale={locale}
              isSpaceAdmin={isSpaceAdmin}
              isStreaming={streamingMessageId === msg.id}
              onConfirmInvocation={onConfirmInvocation}
              onRejectInvocation={onRejectInvocation}
              onDesktopWriteConfirm={onDesktopWriteConfirm}
              onDesktopWriteReject={onDesktopWriteReject}
              onViewReceipt={onViewReceipt}
              onViewInvocationReceipt={onViewInvocationReceipt}
              onOpenTrustQueue={onOpenTrustQueue}
              riskCopy={trustCardCopy}
              receiptSummaryCopy={receiptSummaryCopy}
              viewReceiptLabel={threadCopy.viewReceipt}
              w7Copy={w7Copy}
              onRefreshMessages={onRefreshMessages}
              w16Read={w16Read}
              w17NotionReceiptCopy={w17NotionReceiptCopy}
              moderation={moderation}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
