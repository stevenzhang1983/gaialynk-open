"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentity } from "@/lib/identity/context";
import { usePanelFocus } from "@/components/product/context-panel/panel-focus-context";
import { getProductUiCopy } from "@/content/i18n/product-experience";
import type { ApiMessage, ChatMessage } from "@/lib/product/chat-types";
import { InputBar } from "./input-bar";
import { LoginModal } from "@/components/product/auth/login-modal";
import { MessageList } from "./message-list";
import { useParams } from "next/navigation";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toChatMessage(m: ApiMessage): ChatMessage {
  const isAgent = m.sender_type === "agent";
  return {
    ...m,
    agentName: isAgent
      ? UUID_RE.test(m.sender_id) ? "Agent" : m.sender_id
      : undefined,
    agentVerificationStatus: isAgent ? "verified" : undefined,
  };
}

type ChatWindowProps = {
  conversationId: string;
  /** 可选：初始消息（如从 GET conversation 详情取得） */
  initialMessages?: ApiMessage[];
  placeholder?: string;
  sendLabel?: string;
};

/**
 * T-4.2 聊天窗口：消息列表 + 输入条 + 登录弹窗；拉取消息、发送、订阅 SSE 流式新消息。
 */
export function ChatWindow({
  conversationId,
  initialMessages = [],
  placeholder = "Type a message…",
  sendLabel = "Send",
}: ChatWindowProps) {
  const pathname = usePathname();
  const params = useParams();
  const { userId, isAuthenticated } = useIdentity();
  const { setFocus } = usePanelFocus();
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map(toChatMessage),
  );
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const didTrackLoginTriggerRef = useRef(false);

  const resolvedLocale: Locale = (() => {
    const raw = typeof params?.locale === "string" ? params.locale : "en";
    return isSupportedLocale(raw) ? (raw as Locale) : "en";
  })();
  const productUi = getProductUiCopy(resolvedLocale);
  const threadCopy = {
    chatEmptyHint: productUi.chatEmptyHint,
    riskActionNeedsConfirmation: productUi.riskActionNeedsConfirmation,
    riskConfirm: productUi.riskConfirm,
    riskReject: productUi.riskReject,
    riskInvocationCaption: productUi.riskInvocationCaption,
    viewReceipt: productUi.viewReceipt,
  };

  const onRequireLogin = () => {
    if (!didTrackLoginTriggerRef.current && typeof window !== "undefined") {
      const key = `gl_consumer_login_trigger_tracked_${resolvedLocale}`;
      if (window.sessionStorage.getItem(key) !== "1") {
        didTrackLoginTriggerRef.current = true;
        window.sessionStorage.setItem(key, "1");
        trackEvent(
          "consumer_login_trigger",
          buildAnalyticsPayload({
            locale: resolvedLocale,
            page: "chat",
            referrer: "input_bar",
            action: "require_login",
            outcome: "login_modal",
          }),
        );
      }
    }
    setLoginOpen(true);
  };

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/mainline/conversations/${conversationId}/messages?limit=100&sort=created_at:asc`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      const data = json.data;
      if (Array.isArray(data)) {
        setMessages(data.map(toChatMessage));
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const url = `/api/mainline/conversations/${conversationId}/messages/stream`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    es.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data) as ApiMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, toChatMessage(msg)];
        });
        if (msg.sender_type === "agent") {
          setStreamingMessageId(msg.id);
          setTimeout(() => setStreamingMessageId(null), 800);
        }
      } catch {
        // ignore
      }
    });
    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
    };
    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [conversationId]);

  const handleSend = useCallback(
    async (text: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const res = await fetch(
          `/api/mainline/conversations/${conversationId}/messages`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ sender_id: userId, text }),
          },
        );
        const json = await res.json().catch(() => ({}));
        if (res.status === 201 && json.data) {
          setMessages((prev) => [...prev, toChatMessage(json.data)]);
          return true;
        }
        if (res.status === 202 && json.data) {
          setMessages((prev) => [...prev, toChatMessage(json.data)]);
          if (json.meta?.pending_invocations?.[0]) {
            const inv = json.meta.pending_invocations[0];
            const syntheticId = `pending-${inv.invocation_id}`;
            setMessages((prev) => [
              ...prev,
              {
                id: syntheticId,
                conversation_id: conversationId,
                sender_type: "agent" as const,
                sender_id: "system",
                content: { type: "text" as const, text: productUi.pendingAgentConfirmation },
                created_at: new Date().toISOString(),
                pendingInvocationId: inv.invocation_id,
                trustDecision: "need_confirmation" as const,
              },
            ]);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [conversationId, userId, productUi.pendingAgentConfirmation],
  );

  const handleConfirmInvocation = useCallback(
    async (invocationId: string) => {
      try {
        const res = await fetch(
          `/api/mainline/review-queue/${invocationId}/approve`,
          { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
        );
        if (res.ok) loadMessages();
      } catch {
        // ignore
      }
    },
    [loadMessages],
  );

  const handleRejectInvocation = useCallback(
    async (invocationId: string) => {
      try {
        const res = await fetch(
          `/api/mainline/review-queue/${invocationId}/deny`,
          { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
        );
        if (res.ok) loadMessages();
      } catch {
        // ignore
      }
    },
    [loadMessages],
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          streamingMessageId={streamingMessageId}
          onConfirmInvocation={handleConfirmInvocation}
          onRejectInvocation={handleRejectInvocation}
          onViewReceipt={(receiptId) => setFocus({ type: "receipt", receiptId })}
          threadCopy={threadCopy}
        />
        <InputBar
          placeholder={placeholder}
          sendLabel={sendLabel}
          isAuthenticated={isAuthenticated}
          onRequireLogin={onRequireLogin}
          onSend={handleSend}
        />
      </div>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
        returnUrl={pathname ?? undefined}
      />
    </>
  );
}
