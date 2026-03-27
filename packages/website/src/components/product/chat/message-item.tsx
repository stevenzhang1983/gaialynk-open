"use client";

import type { ChatMessage, DesktopExecuteRetryContext } from "@/lib/product/chat-types";
import type { Locale } from "@/lib/i18n/locales";
import type {
  W7ProductResilienceCopy,
  W17NotionReceiptCardCopy,
  W21ModerationCopy,
} from "@/content/i18n/product-experience";
import { isModerationHiddenMessageText } from "@/lib/product/moderation-constants";
import { MessageBubble, type MessageBubbleTrustCopy } from "./message-bubble";
import { MessageContextMenu, type MessageContextMenuItem } from "./message-context-menu";
import type { ReceiptSummaryCopy } from "./receipt-summary";

export type MessageItemModeration = {
  copy: W21ModerationCopy;
  viewerUserId: string | null | undefined;
  isSpaceAdmin: boolean;
  onRequestReport: (messageId: string) => void;
  onRequestHide: (messageId: string) => void;
};

type MessageItemProps = {
  message: ChatMessage;
  locale: Locale;
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
  w7Copy?: W7ProductResilienceCopy;
  onRefreshMessages?: () => void;
  w16Read?: {
    show: boolean;
    delivered: boolean;
    read: boolean;
    deliveredLabel: string;
    readLabel: string;
  };
  w17NotionReceiptCopy?: W17NotionReceiptCardCopy | null;
  moderation?: MessageItemModeration | null;
};

/**
 * W-21：单条消息 = Bubble + 可选右键/长按菜单（举报、管理员隐藏）。
 */
export function MessageItem({
  moderation,
  message,
  ...bubbleProps
}: MessageItemProps) {
  const text = message.content?.text ?? "";
  const hidden = isModerationHiddenMessageText(text);
  const isUser = message.sender_type === "user";
  const isAgent = message.sender_type === "agent";

  const items: MessageContextMenuItem[] = [];
  if (moderation && !hidden && message.sender_type !== "system" && !message.productErrorSurface) {
    const canReport =
      Boolean(moderation.viewerUserId) &&
      isUser &&
      message.sender_id !== moderation.viewerUserId;
    if (canReport) {
      items.push({
        id: "report",
        label: moderation.copy.menuReport,
        onSelect: () => moderation.onRequestReport(message.id),
      });
    }
    const canHide = moderation.isSpaceAdmin && (isUser || isAgent);
    if (canHide) {
      items.push({
        id: "hide",
        label: moderation.copy.menuHide,
        destructive: true,
        onSelect: () => moderation.onRequestHide(message.id),
      });
    }
  }

  const bubble = (
    <MessageBubble
      message={message}
      {...bubbleProps}
    />
  );

  if (!moderation || items.length === 0) {
    return bubble;
  }

  return (
    <MessageContextMenu copy={moderation.copy} items={items}>
      {bubble}
    </MessageContextMenu>
  );
}
