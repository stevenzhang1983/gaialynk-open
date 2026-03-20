"use client";

import { useParams } from "next/navigation";
import { getProductUiCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";
import { usePanelFocus } from "./panel-focus-context";
import { AgentContext } from "./agent-context";
import { ApprovalContext } from "./approval-context";
import { ConversationContext } from "./conversation-context";
import { ReceiptContext } from "./receipt-context";

/**
 * T-4.4 根据当前焦点渲染右侧面板内容：对话 / Agent / 审批 / 收据。
 */
export function ContextPanelContent() {
  const { focus } = usePanelFocus();
  const params = useParams();
  const rawLocale = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const productUi = getProductUiCopy(locale);

  if (!focus) {
    return <p className="text-caption text-muted-foreground">{productUi.contextPanelEmpty}</p>;
  }

  switch (focus.type) {
    case "conversation":
      return <ConversationContext conversationId={focus.conversationId} />;
    case "agent":
      return <AgentContext agent={focus.agent} />;
    case "approval":
      return <ApprovalContext approvalId={focus.approvalId} />;
    case "receipt":
      return <ReceiptContext receiptId={focus.receiptId} />;
    default:
      return <p className="text-caption text-muted-foreground">{productUi.contextPanelEmpty}</p>;
  }
}
