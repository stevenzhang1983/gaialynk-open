"use client";

import { motion } from "framer-motion";
import type { ChatMessage } from "@/lib/product/chat-types";
import { RiskConfirmationCard } from "./risk-confirmation-card";
import { ReceiptLink } from "./receipt-link";

const VERIFICATION_CLASS = {
  verified: "text-emerald-600",
  pending: "text-amber-600",
  unverified: "text-zinc-500",
} as const;

type MessageBubbleProps = {
  message: ChatMessage;
  /** 若为 need_confirmation，展示风险确认卡片并传入回调 */
  onConfirmInvocation?: (invocationId: string) => void;
  onRejectInvocation?: (invocationId: string) => void;
  onViewReceipt?: (receiptId: string) => void;
  /** 是否正在流式输出（agent 消息逐字显示） */
  isStreaming?: boolean;
  riskCopy: {
    title: string;
    confirm: string;
    reject: string;
    invocationCaption: string;
  };
  viewReceiptLabel: string;
};

/**
 * T-4.2 / T-6.1 单条消息 Bubble：入场动效由 Framer Motion 驱动；流式光标 `animate-pulse` 仍为 Tailwind。
 */
export function MessageBubble({
  message,
  onConfirmInvocation,
  onRejectInvocation,
  onViewReceipt,
  isStreaming = false,
  riskCopy,
  viewReceiptLabel,
}: MessageBubbleProps) {
  const text = message.content?.text ?? "";
  const isUser = message.sender_type === "user";
  const isSystem = message.sender_type === "system";

  if (isSystem) {
    return (
      <motion.div
        className="flex justify-center py-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      >
        <span className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground">{text}</span>
      </motion.div>
    );
  }

  const showRiskCard =
    message.pendingInvocationId &&
    message.trustDecision === "need_confirmation" &&
    onConfirmInvocation &&
    onRejectInvocation;

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className={`max-w-[85%] rounded-xl px-4 py-2 ${
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
        }`}
      >
        {!isUser && (message.agentName || message.agentVerificationStatus) && (
          <div className="mb-1 flex items-center gap-2 border-b border-border/50 pb-1">
            {message.agentName && <span className="text-xs font-medium">{message.agentName}</span>}
            {message.agentVerificationStatus && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${VERIFICATION_CLASS[message.agentVerificationStatus] ?? VERIFICATION_CLASS.unverified}`}
              >
                {message.agentVerificationStatus === "verified" && (
                  <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                {message.agentVerificationStatus === "verified"
                  ? "Verified"
                  : message.agentVerificationStatus === "pending"
                    ? "Pending"
                    : "Unverified"}
              </span>
            )}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">{text}</p>
        {showRiskCard && (
          <RiskConfirmationCard
            invocationId={message.pendingInvocationId!}
            title={riskCopy.title}
            invocationCaption={riskCopy.invocationCaption}
            confirmLabel={riskCopy.confirm}
            rejectLabel={riskCopy.reject}
            onConfirm={() => onConfirmInvocation(message.pendingInvocationId!)}
            onReject={() => onRejectInvocation(message.pendingInvocationId!)}
          />
        )}
        {message.receiptId && (
          <div className="mt-2">
            <ReceiptLink
              receiptId={message.receiptId}
              label={viewReceiptLabel}
              onViewReceipt={onViewReceipt}
            />
          </div>
        )}
        {isStreaming && (
          <span className="inline-block h-4 w-0.5 animate-pulse bg-current align-middle" aria-hidden />
        )}
      </div>
    </motion.div>
  );
}
