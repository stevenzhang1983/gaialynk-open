"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { ChatMessage, DesktopExecuteRetryContext } from "@/lib/product/chat-types";
import { buildUserFacingMessageFromReasonCodes } from "@/lib/product/reason-codes-user-facing";
import { ReceiptLink } from "./receipt-link";
import { ReceiptSummary } from "./receipt-summary";
import type { ReceiptSummaryCopy } from "./receipt-summary";
import { TrustCard, type TrustCardCopy } from "./trust-card";
import type { Locale } from "@/lib/i18n/locales";
import type { W7ProductResilienceCopy, W17NotionReceiptCardCopy } from "@/content/i18n/product-experience";
import { ProductErrorCallout } from "./product-error-callout";
import { MessageReadIndicator } from "./message-read-indicator";
import { parseNotionSystemMessage } from "@/lib/product/parse-notion-system-message";
import { NotionReceiptCard } from "./notion-receipt-card";
import { isModerationHiddenMessageText } from "@/lib/product/moderation-constants";

const VERIFICATION_CLASS = {
  verified: "text-emerald-600",
  pending: "text-amber-600",
  unverified: "text-zinc-500",
} as const;

export type MessageBubbleTrustCopy = TrustCardCopy & {
  trustActorLabel: string;
};

type MessageBubbleProps = {
  message: ChatMessage;
  locale: Locale;
  /** Space owner/admin：收据与 Trust 卡片展示 reason_codes / 策略摘要 */
  isSpaceAdmin: boolean;
  onConfirmInvocation?: (invocationId: string) => void;
  onRejectInvocation?: (invocationId: string) => void;
  onDesktopWriteConfirm?: (messageId: string, ctx: DesktopExecuteRetryContext) => void | Promise<void>;
  onDesktopWriteReject?: (messageId: string) => void;
  onViewReceipt?: (receiptId: string, invocationId?: string) => void;
  onViewInvocationReceipt?: (invocationId: string) => void;
  onOpenTrustQueue: () => void;
  isStreaming?: boolean;
  riskCopy: MessageBubbleTrustCopy;
  receiptSummaryCopy: ReceiptSummaryCopy;
  viewReceiptLabel: string;
  /** W-7 */
  w7Copy?: W7ProductResilienceCopy;
  onRefreshMessages?: () => void;
  /** W-16：本人发送消息的已送达 / 已读双勾 */
  w16Read?: {
    show: boolean;
    delivered: boolean;
    read: boolean;
    deliveredLabel: string;
    readLabel: string;
  };
  /** W-17：Notion 连接器系统消息收据卡片 */
  w17NotionReceiptCopy?: W17NotionReceiptCardCopy | null;
};

function resolveTrustSurface(message: ChatMessage): ChatMessage["trustInteraction"] | undefined {
  if (message.trustInteraction) {
    return message.trustInteraction;
  }
  if (message.pendingInvocationId && message.trustDecision === "need_confirmation") {
    const bundle = buildUserFacingMessageFromReasonCodes(["risk_high_requires_confirmation"]);
    return {
      variant: "need_confirmation",
      invocationId: message.pendingInvocationId,
      riskLevel: "high",
      reasonCodes: ["risk_high_requires_confirmation"],
      userFacingMessage: bundle,
    };
  }
  return undefined;
}

/**
 * T-4.2 / W-5 单条消息 Bubble：Trust 卡片、收据摘要、流式光标。
 */
export function MessageBubble({
  message,
  locale,
  isSpaceAdmin,
  onConfirmInvocation,
  onRejectInvocation,
  onDesktopWriteConfirm,
  onDesktopWriteReject,
  onViewReceipt,
  onViewInvocationReceipt,
  onOpenTrustQueue,
  isStreaming = false,
  riskCopy,
  receiptSummaryCopy,
  viewReceiptLabel,
  w7Copy,
  onRefreshMessages,
  w16Read,
  w17NotionReceiptCopy,
}: MessageBubbleProps) {
  const [desktopTrustBusy, setDesktopTrustBusy] = useState(false);
  const text = message.content?.text ?? "";
  const isUser = message.sender_type === "user";
  const isSystem = message.sender_type === "system";

  if (message.productErrorSurface && w7Copy) {
    return (
      <motion.div
        className="flex justify-start"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="w-full max-w-[min(100%,28rem)]">
          <p className="mb-1 text-xs font-medium text-muted-foreground">{w7Copy.errorActorLabel}</p>
          <ProductErrorCallout
            surface={message.productErrorSurface}
            copy={w7Copy}
            locale={locale}
            onRefreshThread={onRefreshMessages}
            helpArticleHref={
              message.productErrorSurface?.helpArticleId
                ? `/${locale}/help#article-${message.productErrorSurface.helpArticleId}`
                : null
            }
          />
        </div>
      </motion.div>
    );
  }

  if (isSystem) {
    const notionParsed = w17NotionReceiptCopy ? parseNotionSystemMessage(text) : null;
    if (notionParsed && w17NotionReceiptCopy) {
      return (
        <motion.div
          className="flex flex-col items-center gap-2 py-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        >
          {notionParsed.humanText ? (
            <p className="max-w-md text-center text-xs leading-relaxed text-muted-foreground">
              {notionParsed.humanText}
            </p>
          ) : null}
          <NotionReceiptCard
            receipt={notionParsed.receipt}
            copy={w17NotionReceiptCopy}
            locale={locale}
            onViewReceipt={onViewReceipt}
          />
        </motion.div>
      );
    }

    const joinLike = /加入|joined|invite|邀請|邀请|left|離開|离开/i.test(text);
    return (
      <motion.div
        className="flex justify-center py-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
      >
        <span className="inline-flex max-w-[90%] items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
          {joinLike && (
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary"
              aria-hidden
            >
              ◆
            </span>
          )}
          <span className="text-center leading-snug">{text}</span>
        </span>
      </motion.div>
    );
  }

  const trustSurface = resolveTrustSurface(message);
  const invocationAnchorId = trustSurface?.invocationId ?? message.pendingInvocationId;
  const showTrustCard = Boolean(trustSurface);
  const desktopTrust =
    trustSurface?.variant === "need_confirmation" &&
    trustSurface.desktopExecuteContext &&
    onDesktopWriteConfirm &&
    onDesktopWriteReject;
  const confirmableInvocation =
    trustSurface?.variant === "need_confirmation" &&
    trustSurface.invocationId &&
    onConfirmInvocation &&
    onRejectInvocation;

  const contentModerationHidden = !isSystem && isModerationHiddenMessageText(text);
  const bubbleTone = contentModerationHidden
    ? "border border-dashed border-border/80 bg-muted/50 text-muted-foreground"
    : isUser
      ? "bg-primary text-primary-foreground"
      : "border border-border bg-card text-foreground";

  const bubble = (
    <div
      className={`rounded-xl px-4 py-2 ${bubbleTone} ${contentModerationHidden ? "italic" : ""}`}
    >
      {!isUser && (message.agentName || message.agentVerificationStatus) && (
        <div className="mb-1 flex items-center gap-2 border-b border-border/50 pb-1">
          {message.agentName && <span className="text-xs font-medium">{message.agentName}</span>}
          {message.agentVerificationStatus && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${VERIFICATION_CLASS[message.agentVerificationStatus] ?? VERIFICATION_CLASS.unverified}`}
            >
              {message.agentVerificationStatus === "verified" && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M10 3L4.5 8.5 2 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
      <p
        className={`whitespace-pre-wrap break-words text-base leading-relaxed ${
          contentModerationHidden ? "" : isUser ? "text-primary-foreground" : ""
        }`}
      >
        {text}
      </p>
      {showTrustCard && trustSurface && (
        <TrustCard
          variant={trustSurface.variant}
          locale={locale}
          riskLevel={trustSurface.riskLevel}
          userFacingMessage={trustSurface.userFacingMessage}
          reasonCodes={trustSurface.reasonCodes}
          invocationId={trustSurface.invocationId}
          policyRuleId={trustSurface.policyRuleId}
          showAdminFields={isSpaceAdmin}
          copy={riskCopy}
          resourceLine={trustSurface.desktopResourceLine}
          onConfirm={
            desktopTrust
              ? () => {
                  const ctx = trustSurface.desktopExecuteContext;
                  if (!ctx) return;
                  setDesktopTrustBusy(true);
                  void Promise.resolve(onDesktopWriteConfirm(message.id, ctx)).finally(() =>
                    setDesktopTrustBusy(false),
                  );
                }
              : confirmableInvocation && trustSurface.invocationId
                ? () => onConfirmInvocation(trustSurface.invocationId!)
                : undefined
          }
          onReject={
            desktopTrust
              ? () => onDesktopWriteReject(message.id)
              : confirmableInvocation && trustSurface.invocationId
                ? () => onRejectInvocation(trustSurface.invocationId!)
                : undefined
          }
          onViewDetails={onOpenTrustQueue}
          onViewInvocationReceipt={onViewInvocationReceipt}
          loading={desktopTrustBusy}
        />
      )}
      {!isUser && !message.receiptSlice && message.receiptId && (
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
  );

  const userColumn =
    isUser && message.receiptSlice ? (
      <div className="flex max-w-[85%] flex-col items-stretch gap-2">
        {bubble}
        <ReceiptSummary
          locale={locale}
          receiptId={message.receiptSlice.receiptId}
          invocationId={message.receiptSlice.invocationId}
          issuedAt={message.receiptSlice.issuedAt}
          summaryBundle={message.receiptSlice.summaryBundle}
          reasonCodes={message.receiptSlice.reasonCodes}
          policyRuleId={message.receiptSlice.policyRuleId}
          showAdminFields={isSpaceAdmin}
          copy={receiptSummaryCopy}
          onViewReceipt={onViewReceipt}
        />
        {w16Read?.show ? (
          <MessageReadIndicator
            delivered={w16Read.delivered}
            read={w16Read.read}
            deliveredLabel={w16Read.deliveredLabel}
            readLabel={w16Read.readLabel}
          />
        ) : null}
      </div>
    ) : (
      <div className={`flex max-w-[85%] flex-col ${isUser ? "items-end gap-0" : ""}`}>
        {bubble}
        {isUser && w16Read?.show ? (
          <MessageReadIndicator
            delivered={w16Read.delivered}
            read={w16Read.read}
            deliveredLabel={w16Read.deliveredLabel}
            readLabel={w16Read.readLabel}
          />
        ) : null}
      </div>
    );

  return (
    <motion.div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      {...(invocationAnchorId ? { "data-gl-invocation-id": invocationAnchorId } : {})}
    >
      {userColumn}
    </motion.div>
  );
}
