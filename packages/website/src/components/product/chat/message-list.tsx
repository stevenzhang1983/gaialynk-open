"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/product/chat-types";
import { MessageBubble } from "./message-bubble";

export type ChatThreadSurfaceCopy = {
  chatEmptyHint: string;
  riskActionNeedsConfirmation: string;
  riskConfirm: string;
  riskReject: string;
  riskInvocationCaption: string;
  viewReceipt: string;
};

type MessageListProps = {
  messages: ChatMessage[];
  streamingMessageId?: string | null;
  onConfirmInvocation?: (invocationId: string) => void;
  onRejectInvocation?: (invocationId: string) => void;
  onViewReceipt?: (receiptId: string) => void;
  className?: string;
  threadCopy: ChatThreadSurfaceCopy;
};

/**
 * T-4.2 消息流组件：支持用户、Agent、系统消息；可内嵌风险确认与收据；滚动到底部。
 */
export function MessageList({
  messages,
  streamingMessageId = null,
  onConfirmInvocation,
  onRejectInvocation,
  onViewReceipt,
  className = "",
  threadCopy,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, streamingMessageId, reduceMotion]);

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-3 sm:p-4 ${className}`}>
      {messages.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">{threadCopy.chatEmptyHint}</p>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={streamingMessageId === msg.id}
          onConfirmInvocation={onConfirmInvocation}
          onRejectInvocation={onRejectInvocation}
          onViewReceipt={onViewReceipt}
          riskCopy={{
            title: threadCopy.riskActionNeedsConfirmation,
            confirm: threadCopy.riskConfirm,
            reject: threadCopy.riskReject,
            invocationCaption: threadCopy.riskInvocationCaption,
          }}
          viewReceiptLabel={threadCopy.viewReceipt}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
