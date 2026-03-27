"use client";

import { Suspense, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChatWindow } from "@/components/product/chat/chat-window";
import { usePanelFocus } from "@/components/product/context-panel/panel-focus-context";
import { getProductUiCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

/**
 * T-4.3 / T-4.2 指定会话的聊天页面：根据 URL conversationId 展示对应 ChatWindow。
 * 侧边栏点击会话后切换到此路由，主区域显示该会话的聊天窗口；T-4.4 右侧面板显示对话上下文。
 */
function ChatConversationPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = typeof params?.conversationId === "string" ? params.conversationId : null;
  const { setFocus } = usePanelFocus();
  const rawLocale = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = useMemo(
    () => (isSupportedLocale(rawLocale) ? rawLocale : "en"),
    [rawLocale],
  );
  const invalidLabel = useMemo(() => getProductUiCopy(locale).chatInvalidConversation, [locale]);
  const focusInvocationId = searchParams.get("focus_invocation");
  const clearFocusQuery = useCallback(() => {
    if (!conversationId) return;
    router.replace(`/${locale}/app/chat/${conversationId}`);
  }, [router, locale, conversationId]);

  useEffect(() => {
    if (conversationId) {
      setFocus({ type: "conversation", conversationId });
    }
    return () => setFocus(null);
  }, [conversationId, setFocus]);

  if (!conversationId) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8">
        <p className="text-sm text-destructive">{invalidLabel}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatWindow
        conversationId={conversationId}
        focusInvocationId={focusInvocationId}
        onConsumedFocusInvocation={clearFocusQuery}
      />
    </div>
  );
}

export default function ChatConversationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ChatConversationPageInner />
    </Suspense>
  );
}
