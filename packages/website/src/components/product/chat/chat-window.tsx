"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdentity } from "@/lib/identity/context";
import { usePanelFocus } from "@/components/product/context-panel/panel-focus-context";
import {
  getProductUiCopy,
  getW4AgentUxCopy,
  getW5TrustUiCopy,
  getW6ConversationLifecycleCopy,
  getW7ProductResilienceCopy,
  getW9FirstRunCopy,
  getW16RealtimeCopy,
  getW17NotionReceiptCardCopy,
  getW18AgentLifecycleCopy,
  getW21ModerationCopy,
  getW22DesktopConnectorCopy,
} from "@/content/i18n/product-experience";
import { useConversationLifecycle } from "@/components/product/conversation-lifecycle-context";
import {
  buildConversationMarkdownExport,
  buildConversationPlainExport,
} from "@/lib/product/export-conversation";
import type {
  ApiMessage,
  ChatMessage,
  DesktopExecuteRetryContext,
  TrustInteractionSurface,
} from "@/lib/product/chat-types";
import {
  buildConversationRealtimeWsUrl,
  mergeReadReceipt,
  openConversationWebSocket,
  type RealtimeWsInbound,
} from "@/lib/product/ws-client";
import { subscribeConversationMessagesSse } from "@/lib/product/sse-fallback";
import type { SpacePresenceStatus } from "@/lib/product/presence-types";
import {
  classifySendMessageError,
  type ClassifiedProductError,
} from "@/lib/product/product-error-pattern";
import { buildUserFacingMessageFromReasonCodes } from "@/lib/product/reason-codes-user-facing";
import type { UserFacingLocaleBundle } from "@/lib/product/reason-codes-user-facing";
import { useSpace } from "@/components/product/space-context";
import { useSpacePermissions } from "@/hooks/use-space-permissions";
import { getSpaceUiCopy } from "@/content/i18n/product-experience";
import { ChatParticipantBar, type ChatParticipant } from "./chat-participant-bar";
import { InputBar, type MentionCandidate } from "./input-bar";
import { LoginModal } from "@/components/product/auth/login-modal";
import type { MessageBubbleTrustCopy } from "./message-bubble";
import { MessageList } from "./message-list";
import { ReportDialog } from "./report-dialog";
import { HideMessageDialog } from "./hide-message-dialog";
import type { MessageItemModeration } from "./message-item";
import type { ReceiptSummaryCopy } from "./receipt-summary";
import { OrchestrationPlanBar } from "./orchestration-plan-bar";
import { ChatResilienceChrome, type QueuedSend } from "./chat-resilience-chrome";
import { ChatFirstRunEmpty } from "./chat-first-run-empty";
import { ProductErrorCallout } from "./product-error-callout";
import { TypingIndicator } from "./typing-indicator";
import { consumeFirstRunDraft, consumePendingAgentId } from "@/lib/product/first-run-storage";
import { useParams } from "next/navigation";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ApiTrustDecision = {
  decision?: string;
  reason_codes?: string[];
  risk_level?: string;
  policy_rule_id?: string;
  user_facing_message?: UserFacingLocaleBundle;
};

type PendingInvocationMeta = {
  invocation_id: string;
  agent_id?: string;
  trust_decision?: ApiTrustDecision;
};

function normalizeRisk(r: unknown): TrustInteractionSurface["riskLevel"] {
  if (r === "low" || r === "medium" || r === "high" || r === "critical") {
    return r;
  }
  return "high";
}

function bundleFromDecision(td: ApiTrustDecision | undefined, codes: string[]): UserFacingLocaleBundle {
  if (
    td?.user_facing_message &&
    typeof td.user_facing_message.zh === "string" &&
    typeof td.user_facing_message.en === "string" &&
    typeof td.user_facing_message.ja === "string"
  ) {
    return td.user_facing_message;
  }
  return buildUserFacingMessageFromReasonCodes(codes.length ? codes : ["trust_review_pending"]);
}

function buildTrustAgentMessage(args: {
  id: string;
  conversationId: string;
  leadText: string;
  trust: TrustInteractionSurface;
  agentLabel: string;
}): ChatMessage {
  return {
    id: args.id,
    conversation_id: args.conversationId,
    sender_type: "agent",
    sender_id: "trust-policy",
    content: { type: "text", text: args.leadText },
    created_at: new Date().toISOString(),
    agentName: args.agentLabel,
    agentVerificationStatus: "pending",
    trustInteraction: args.trust,
    pendingInvocationId:
      args.trust.variant === "need_confirmation" ? args.trust.invocationId : undefined,
    trustDecision: args.trust.variant === "need_confirmation" ? "need_confirmation" : undefined,
  };
}

function toChatMessage(m: ApiMessage): ChatMessage {
  const isAgent = m.sender_type === "agent";
  return {
    ...m,
    status: m.status ?? "delivered",
    agentName: isAgent
      ? UUID_RE.test(m.sender_id) ? "Agent" : m.sender_id
      : undefined,
    agentVerificationStatus: isAgent ? "verified" : undefined,
  };
}

function formatDesktopTrustPathLine(
  w22: ReturnType<typeof getW22DesktopConnectorCopy>,
  action: string,
  path: string,
): string {
  const act =
    action === "file_list"
      ? w22.desktopActionFileList
      : action === "file_read"
        ? w22.desktopActionFileRead
        : action === "file_write"
          ? w22.desktopActionFileWrite
          : action;
  return w22.desktopTrustPathLine.replace("{{action}}", act).replace("{{path}}", path || "—");
}

function buildProductErrorChatRow(args: {
  conversationId: string;
  actorLabel: string;
  classified: ClassifiedProductError;
}): ChatMessage {
  return {
    id: `product-error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    conversation_id: args.conversationId,
    sender_type: "agent",
    sender_id: "product-error",
    content: { type: "text", text: "\u00a0" },
    created_at: new Date().toISOString(),
    agentName: args.actorLabel,
    agentVerificationStatus: "unverified",
    productErrorSurface: {
      pattern: args.classified.pattern,
      code: args.classified.code,
      estimatedWaitMs: args.classified.estimatedWaitMs,
      canRetrySamePayload: false,
      helpArticleId: args.classified.helpArticleId,
    },
  };
}

type ChatWindowProps = {
  conversationId: string;
  /** 可选：初始消息（如从 GET conversation 详情取得） */
  initialMessages?: ApiMessage[];
  placeholder?: string;
  sendLabel?: string;
  /** W-8：通知 deep link 聚焦 Trust 卡片 */
  focusInvocationId?: string | null;
  onConsumedFocusInvocation?: () => void;
};

/**
 * T-4.2 聊天窗口：消息列表 + 输入条 + 登录弹窗；拉取消息、发送、订阅 SSE 流式新消息。
 */
export function ChatWindow({
  conversationId,
  initialMessages = [],
  placeholder = "Type a message…",
  sendLabel = "Send",
  focusInvocationId = null,
  onConsumedFocusInvocation,
}: ChatWindowProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { userId, isAuthenticated } = useIdentity();
  const { isGuestInSpace, myRole, roleLoading: spaceRoleLoading } = useSpace();
  const { mayTriggerConnector } = useSpacePermissions(myRole);
  const mayUseConnectorUpload = spaceRoleLoading || mayTriggerConnector;
  const { bumpListVersion } = useConversationLifecycle();
  const { setFocus } = usePanelFocus();
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [conversationTitle, setConversationTitle] = useState("");
  const [conversationState, setConversationState] = useState<string>("active");
  const [conversationSpaceId, setConversationSpaceId] = useState<string | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, SpacePresenceStatus>>({});
  const [exportRedact, setExportRedact] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialMessages.map(toChatMessage),
  );
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [hideMessageId, setHideMessageId] = useState<string | null>(null);
  const [productToast, setProductToast] = useState<string | null>(null);
  const [orchestrationTrigger, setOrchestrationTrigger] = useState<{ text: string; key: number } | null>(
    null,
  );
  const [agentCatalog, setAgentCatalog] = useState<
    { id: string; name: string; capabilities: { name: string; risk_level?: string }[] }[]
  >([]);
  const wsSendRef = useRef<((payload: Record<string, unknown>) => void) | null>(null);
  const readReceiptSentRef = useRef<Set<string>>(new Set());
  const lastRealtimeEventIdRef = useRef<string | undefined>(undefined);
  const typingLastPulseRef = useRef(0);
  const didTrackLoginTriggerRef = useRef(false);
  const [browserOnline, setBrowserOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine,
  );
  const [sseState, setSseState] = useState<"live" | "connecting" | "disconnected">("connecting");
  const [sendQueue, setSendQueue] = useState<QueuedSend[]>([]);
  const [networkFailure, setNetworkFailure] = useState<{ text: string; fileRefId?: string } | null>(null);
  const [initialInputDraft, setInitialInputDraft] = useState<string | undefined>(undefined);
  const [maintenanceAgentNames, setMaintenanceAgentNames] = useState<string[]>([]);

  const resolvedLocale: Locale = (() => {
    const raw = typeof params?.locale === "string" ? params.locale : "en";
    return isSupportedLocale(raw) ? (raw as Locale) : "en";
  })();
  const productUi = getProductUiCopy(resolvedLocale);
  const spaceUi = getSpaceUiCopy(resolvedLocale);
  const w4Ux = getW4AgentUxCopy(resolvedLocale);
  const w5 = getW5TrustUiCopy(resolvedLocale);
  const w6conv = getW6ConversationLifecycleCopy(resolvedLocale);
  const w7 = getW7ProductResilienceCopy(resolvedLocale);
  const w9FirstRun = getW9FirstRunCopy(resolvedLocale);
  const w16 = getW16RealtimeCopy(resolvedLocale);
  const w17NotionReceipt = getW17NotionReceiptCardCopy(resolvedLocale);
  const w18 = getW18AgentLifecycleCopy(resolvedLocale);
  const w21 = getW21ModerationCopy(resolvedLocale);
  const forceSseOnly =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_REALTIME_FORCE_SSE === "1";
  const isSpaceAdmin = myRole === "owner" || myRole === "admin";
  const readOnlyChat = conversationState === "archived" || conversationState === "closed";
  const trustCardCopy: MessageBubbleTrustCopy = {
    needConfirmTitle: productUi.riskActionNeedsConfirmation,
    platformBlockedTitle: w5.platformBlockedTitle,
    boundaryBlockedTitle: w5.boundaryBlockedTitle,
    riskLow: w5.riskLow,
    riskMedium: w5.riskMedium,
    riskHigh: w5.riskHigh,
    riskCritical: w5.riskCritical,
    confirm: productUi.riskConfirm,
    reject: productUi.riskReject,
    viewDetails: w5.viewDetails,
    invocationRef: productUi.riskInvocationCaption,
    viewInvocationReceipt: w18.viewInvocationReceipt,
    trustActorLabel: w5.trustActorLabel,
  };
  const receiptSummaryCopy: ReceiptSummaryCopy = {
    sectionTitle: w5.receiptSectionTitle,
    issuedAtLabel: w5.receiptIssuedAtLabel,
    summaryLabel: w5.receiptSummaryLabel,
    copyFullId: w5.receiptCopyFullId,
    copied: w5.receiptCopied,
    viewReceipt: productUi.viewReceipt,
    adminReasonCodes: w5.receiptAdminReasonCodes,
    adminPolicyRule: w5.receiptAdminPolicyRule,
  };
  const threadCopy = {
    chatEmptyHint: productUi.chatEmptyHint,
    riskActionNeedsConfirmation: productUi.riskActionNeedsConfirmation,
    riskConfirm: productUi.riskConfirm,
    riskReject: productUi.riskReject,
    riskInvocationCaption: productUi.riskInvocationCaption,
    viewReceipt: productUi.viewReceipt,
    a11yLiveNewUserMessage: productUi.a11yLiveNewUserMessage,
    a11yLiveNewAgentMessage: productUi.a11yLiveNewAgentMessage,
    a11yLiveNewSystemMessage: productUi.a11yLiveNewSystemMessage,
  };

  const messageModeration = useMemo((): MessageItemModeration | null => {
    if (!isAuthenticated) return null;
    return {
      copy: w21,
      viewerUserId: userId,
      isSpaceAdmin,
      onRequestReport: (id) => setReportMessageId(id),
      onRequestHide: (id) => setHideMessageId(id),
    };
  }, [isAuthenticated, userId, isSpaceAdmin, w21]);

  useEffect(() => {
    if (!productToast) return;
    const t = window.setTimeout(() => setProductToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [productToast]);

  const onOpenTrustQueue = useCallback(() => {
    router.push(`/${resolvedLocale}/app/recovery-hitl`);
  }, [router, resolvedLocale]);

  const handleViewReceipt = useCallback(
    (auditReceiptId: string, invocationId?: string) => {
      if (invocationId) {
        router.push(`/${resolvedLocale}/app/receipt/${encodeURIComponent(invocationId)}`);
        return;
      }
      setFocus({ type: "receipt", receiptId: auditReceiptId });
    },
    [resolvedLocale, router, setFocus],
  );

  const handleViewInvocationReceipt = useCallback(
    (invocationId: string) => {
      router.push(`/${resolvedLocale}/app/receipt/${encodeURIComponent(invocationId)}`);
    },
    [resolvedLocale, router],
  );

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

  const loadConversationMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/mainline/conversations/${conversationId}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.data?.conversation) {
        setParticipants([]);
        setConversationTitle("");
        setConversationState("active");
        setConversationSpaceId(null);
        return;
      }
      setConversationTitle(json.data.conversation.title ?? "");
      setConversationState(json.data.conversation.state ?? "active");
      const sid = json.data.conversation.space_id;
      setConversationSpaceId(typeof sid === "string" && sid ? sid : null);
      const parts = Array.isArray(json.data.participants) ? json.data.participants : [];
      setParticipants(
        parts.map((p: { participant_type: string; participant_id: string; role: string }) => ({
          participant_type: p.participant_type === "agent" ? "agent" : "user",
          participant_id: p.participant_id,
          role: p.role,
        })),
      );
    } catch {
      setParticipants([]);
      setConversationState("active");
      setConversationSpaceId(null);
    }
  }, [conversationId]);

  const handleRestoreConversation = useCallback(async () => {
    try {
      const res = await fetch(`/api/mainline/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: "active" }),
      });
      if (res.ok) {
        bumpListVersion();
        await loadConversationMeta();
      }
    } catch {
      /* ignore */
    }
  }, [bumpListVersion, conversationId, loadConversationMeta]);

  const downloadExport = useCallback(
    (kind: "md" | "txt") => {
      const title = conversationTitle || "Chat";
      const base = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "conversation";
      const payload = messages.map((m) => ({
        id: m.id,
        conversation_id: m.conversation_id,
        sender_type: m.sender_type,
        sender_id: m.sender_id,
        content: m.content,
        created_at: m.created_at,
      }));
      const body =
        kind === "md"
          ? buildConversationMarkdownExport(title, payload, { redact: exportRedact })
          : buildConversationPlainExport(title, payload, { redact: exportRedact });
      const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}.${kind === "md" ? "md" : "txt"}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [conversationTitle, exportRedact, messages],
  );

  useEffect(() => {
    void loadConversationMeta();
  }, [loadConversationMeta]);

  const agentParticipantIdsKey = useMemo(
    () =>
      participants
        .filter((p) => p.participant_type === "agent")
        .map((p) => p.participant_id)
        .sort()
        .join(","),
    [participants],
  );

  useEffect(() => {
    if (!agentParticipantIdsKey) {
      setMaintenanceAgentNames([]);
      return;
    }
    const ids = agentParticipantIdsKey.split(",").filter(Boolean);
    let cancelled = false;
    (async () => {
      const names: string[] = [];
      for (const id of ids) {
        try {
          const res = await fetch(`/api/mainline/agents/${encodeURIComponent(id)}`, { cache: "no-store" });
          const j = await res.json().catch(() => ({}));
          if (cancelled) return;
          if (res.ok && j?.data?.listing_status === "maintenance") {
            names.push(typeof j.data.name === "string" ? j.data.name : id.slice(0, 8));
          }
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setMaintenanceAgentNames(names);
    })();
    return () => {
      cancelled = true;
    };
  }, [agentParticipantIdsKey]);

  useEffect(() => {
    setInitialInputDraft(undefined);
    const d = consumeFirstRunDraft();
    if (d) setInitialInputDraft(d);
  }, [conversationId]);

  useEffect(() => {
    if (!userId || readOnlyChat) return;
    const pendingAgentId = consumePendingAgentId();
    if (!pendingAgentId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/mainline/conversations/${conversationId}/agents`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agent_id: pendingAgentId }),
        });
        if (res.ok) await loadConversationMeta();
      } catch {
        /* ignore */
      }
    })();
  }, [conversationId, userId, readOnlyChat, loadConversationMeta]);

  useEffect(() => {
    const onUp = () => setBrowserOnline(true);
    const onDown = () => setBrowserOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/mainline/agents?limit=100&status=active", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const data = Array.isArray(json.data) ? json.data : [];
        if (!cancelled) setAgentCatalog(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const conversationAgentOptions = useMemo(
    () =>
      participants
        .filter((p) => p.participant_type === "agent")
        .map((p) => {
          const row = agentCatalog.find((a) => a.id === p.participant_id);
          return {
            id: p.participant_id,
            name: row?.name ?? `${p.participant_id.slice(0, 8)}…`,
            capabilities: row?.capabilities ?? [],
          };
        }),
    [participants, agentCatalog],
  );

  const consumeOrchestrationTrigger = useCallback(() => setOrchestrationTrigger(null), []);

  const mentionCandidates: MentionCandidate[] = participants.map((p) => ({
    id: p.participant_id,
    kind: p.participant_type === "agent" ? "agent" : "user",
    label:
      p.participant_type === "user"
        ? `${spaceUi.mentionUserPrefix} ${p.participant_id.slice(0, 8)}…`
        : `${spaceUi.mentionAgentPrefix} ${p.participant_id.length > 14 ? `${p.participant_id.slice(0, 12)}…` : p.participant_id}`,
  }));

  const handleMarkMessageRead = useCallback((messageId: string) => {
    if (readReceiptSentRef.current.has(messageId)) return;
    readReceiptSentRef.current.add(messageId);
    wsSendRef.current?.({ type: "message_read", message_id: messageId });
  }, []);

  const handleTypingPulse = useCallback(() => {
    if (!userId || readOnlyChat) return;
    const now = Date.now();
    if (typingLastPulseRef.current !== 0 && now - typingLastPulseRef.current < 7000) return;
    typingLastPulseRef.current = now;
    wsSendRef.current?.({ type: "typing_start" });
  }, [userId, readOnlyChat]);

  const handleTypingCease = useCallback(() => {
    typingLastPulseRef.current = 0;
    wsSendRef.current?.({ type: "typing_stop" });
  }, []);

  const typingBannerLabel = useMemo(() => {
    if (typingUserIds.length === 0) return null;
    if (typingUserIds.length > 1) return w16.typingMulti;
    const uid = typingUserIds[0]!;
    const cand = mentionCandidates.find((c) => c.kind === "user" && c.id === uid);
    const name = cand?.label ?? `${uid.slice(0, 8)}…`;
    return w16.typingSingle.replace("{{name}}", name);
  }, [typingUserIds, mentionCandidates, w16.typingMulti, w16.typingSingle]);

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
    setTypingUserIds([]);
    readReceiptSentRef.current = new Set();
    lastRealtimeEventIdRef.current = undefined;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationSpaceId || !isAuthenticated) {
      setPresenceByUserId({});
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/mainline/spaces/${conversationSpaceId}/presence`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { members?: { user_id: string; presence_status: SpacePresenceStatus }[] };
        };
        const members = json.data?.members;
        if (cancelled || !Array.isArray(members)) return;
        const next: Record<string, SpacePresenceStatus> = {};
        for (const m of members) {
          if (m.user_id) next[m.user_id] = m.presence_status;
        }
        setPresenceByUserId(next);
      } catch {
        if (!cancelled) setPresenceByUserId({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationSpaceId, isAuthenticated, conversationId]);

  useEffect(() => {
    let destroyed = false;
    let sseSub: { close: () => void } | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let wsConn: ReturnType<typeof openConversationWebSocket> | null = null;

    readReceiptSentRef.current = new Set();

    const clearWs = () => {
      if (pingTimer) {
        clearInterval(pingTimer);
        pingTimer = null;
      }
      wsSendRef.current = null;
      const c = wsConn;
      wsConn = null;
      c?.close();
    };

    const appendStreamMessage = (msg: ApiMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, toChatMessage(msg)];
      });
      if (msg.sender_type === "system") {
        void loadConversationMeta();
      }
      if (msg.sender_type === "agent") {
        setStreamingMessageId(msg.id);
        setTimeout(() => setStreamingMessageId(null), 800);
      }
    };

    const handleWsFrame = (frame: RealtimeWsInbound) => {
      if (
        frame.type === "message" &&
        "data" in frame &&
        frame.data &&
        typeof (frame as { event_id?: string }).event_id === "string"
      ) {
        lastRealtimeEventIdRef.current = (frame as { event_id: string }).event_id;
        appendStreamMessage(frame.data as ApiMessage);
        return;
      }
      if (
        frame.type === "message_read" &&
        typeof (frame as { message_id?: string }).message_id === "string" &&
        typeof (frame as { user_id?: string }).user_id === "string"
      ) {
        const message_id = (frame as { message_id: string }).message_id;
        const reader = (frame as { user_id: string }).user_id;
        setMessages((prev) => mergeReadReceipt(prev, message_id, reader));
        return;
      }
      if (frame.type === "typing_start" && typeof (frame as { user_id?: string }).user_id === "string") {
        const uid = (frame as { user_id: string }).user_id;
        if (userId && uid !== userId) {
          setTypingUserIds((prev) => (prev.includes(uid) ? prev : [...prev, uid]));
        }
        return;
      }
      if (frame.type === "typing_stop" && typeof (frame as { user_id?: string }).user_id === "string") {
        const uid = (frame as { user_id: string }).user_id;
        setTypingUserIds((prev) => prev.filter((x) => x !== uid));
        return;
      }
      if (frame.type === "presence_update") {
        const uid = (frame as { user_id?: string }).user_id;
        const st = (frame as { status?: string }).status;
        if (uid && (st === "online" || st === "away")) {
          setPresenceByUserId((prev) => ({ ...prev, [uid]: st }));
        }
      }
    };

    const startSse = () => {
      clearWs();
      sseSub?.close();
      setSseState("connecting");
      sseSub = subscribeConversationMessagesSse(conversationId, {
        onOpen: () => {
          if (!destroyed) setSseState("live");
        },
        onDisconnected: () => {
          if (!destroyed) setSseState("disconnected");
        },
        onMessage: appendStreamMessage,
      });
    };

    const tryWs = async () => {
      if (forceSseOnly || !isAuthenticated || !userId) {
        startSse();
        return;
      }
      setSseState("connecting");
      let handshake: Response;
      try {
        handshake = await fetch("/api/auth/realtime-handshake", {
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        startSse();
        return;
      }
      if (!handshake.ok) {
        startSse();
        return;
      }
      const hj = (await handshake.json().catch(() => ({}))) as {
        data?: { access_token?: string; ws_origin?: string };
      };
      const token = hj.data?.access_token;
      const origin = hj.data?.ws_origin;
      if (!token || !origin || destroyed) {
        startSse();
        return;
      }
      const url = buildConversationRealtimeWsUrl({
        wsOrigin: origin,
        accessToken: token,
        conversationId,
        lastEventId: lastRealtimeEventIdRef.current,
      });
      wsConn = openConversationWebSocket(url, {
        onOpen: () => {
          if (destroyed) return;
          setSseState("live");
          wsSendRef.current = (payload) => wsConn?.sendJson(payload);
          pingTimer = setInterval(() => {
            wsConn?.sendJson({ type: "ping" });
          }, 30_000);
        },
        onFrame: handleWsFrame,
        onClose: () => {
          if (destroyed) return;
          clearWs();
          startSse();
        },
      });
    };

    void tryWs();

    return () => {
      destroyed = true;
      clearWs();
      sseSub?.close();
    };
  }, [conversationId, forceSseOnly, isAuthenticated, userId, loadConversationMeta]);

  const flushSendQueue = useCallback(async () => {
    if (!userId) return;
    const pending = [...sendQueue];
    for (const item of pending) {
      if (typeof navigator !== "undefined" && !navigator.onLine) break;
      try {
        const res = await fetch(`/api/mainline/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sender_id: userId,
            text: item.text,
            ...(item.fileRefId ? { file_ref_id: item.fileRefId } : {}),
          }),
        });
        if (res.ok) {
          setSendQueue((q) => q.filter((x) => x.id !== item.id));
          await loadMessages();
        } else {
          break;
        }
      } catch {
        break;
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }, [userId, sendQueue, conversationId, loadMessages]);

  const handleDesktopWriteConfirm = useCallback(
    async (messageId: string, ctx: DesktopExecuteRetryContext) => {
      try {
        const c = await fetch(
          `/api/mainline/connectors/desktop/write-challenges/${encodeURIComponent(ctx.challengeId)}/confirm`,
          { method: "POST", headers: { "content-type": "application/json" }, body: "{}" },
        );
        const cj = (await c.json().catch(() => ({}))) as {
          data?: { write_confirmation_token?: string };
        };
        if (!c.ok || !cj.data?.write_confirmation_token) {
          setProductToast(getW22DesktopConnectorCopy(resolvedLocale).desktopWriteConfirmFailed);
          return;
        }
        const ex = await fetch(`/api/mainline/connectors/desktop/execute`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: ctx.action,
            path: ctx.path,
            device_id: ctx.deviceId,
            space_id: conversationSpaceId ?? undefined,
            conversation_id: conversationId,
            write_targets_new_path_prefix: ctx.write_targets_new_path_prefix,
            write_confirmation_token: cj.data.write_confirmation_token,
          }),
        });
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        const ej = await ex.json().catch(() => ({}));
        if (!ex.ok) {
          const classified = classifySendMessageError(ex.status, ej, false);
          if (classified) {
            setMessages((prev) => [
              ...prev,
              buildProductErrorChatRow({
                conversationId,
                actorLabel: w7.errorActorLabel,
                classified,
              }),
            ]);
          }
        }
        void loadMessages();
      } catch {
        setProductToast(getW22DesktopConnectorCopy(resolvedLocale).desktopWriteConfirmFailed);
      }
    },
    [conversationId, conversationSpaceId, loadMessages, resolvedLocale, w7.errorActorLabel],
  );

  const handleDesktopWriteReject = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  }, []);

  const handleSend = useCallback(
    async (text: string, options?: { fileRefId?: string }): Promise<boolean> => {
      if (!userId) return false;
      if (conversationState === "archived" || conversationState === "closed") {
        return false;
      }
      setNetworkFailure(null);
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `q-${Date.now()}`;
        const fileRefId = options?.fileRefId;
        setSendQueue((q) => [...q, { id, text, ...(fileRefId ? { fileRefId } : {}) }]);
        return true;
      }
      const w5Local = getW5TrustUiCopy(resolvedLocale);
      const w22Local = getW22DesktopConnectorCopy(resolvedLocale);
      const bodyPayload: { sender_id: string; text: string; file_ref_id?: string } = {
        sender_id: userId,
        text,
      };
      if (options?.fileRefId) {
        bodyPayload.file_ref_id = options.fileRefId;
      }
      try {
        const res = await fetch(`/api/mainline/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
        const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const multiAgent = participants.filter((p) => p.participant_type === "agent").length >= 2;

        if (res.status === 422) {
          const err = json.error as { details?: { reason_codes?: string[] } } | undefined;
          const codes = Array.isArray(err?.details?.reason_codes)
            ? (err!.details!.reason_codes as string[])
            : [];
          const ufm = buildUserFacingMessageFromReasonCodes(codes);
          const optimisticUser: ChatMessage = {
            id: `local-boundary-${Date.now()}`,
            conversation_id: conversationId,
            sender_type: "user",
            sender_id: userId,
            content: { type: "text", text },
            created_at: new Date().toISOString(),
          };
          const blocked = buildTrustAgentMessage({
            id: `trust-boundary-${Date.now()}`,
            conversationId,
            leadText: w5Local.trustLeadBlockedBoundary,
            agentLabel: w5Local.trustActorLabel,
            trust: {
              variant: "data_boundary_blocked",
              riskLevel: "high",
              reasonCodes: codes,
              userFacingMessage: ufm,
            },
          });
          setMessages((prev) => [...prev, optimisticUser, blocked]);
          return false;
        }

        if (res.status === 409) {
          await loadConversationMeta();
          return false;
        }

        if (res.status === 403) {
          const err403 = json as {
            error?: {
              code?: string;
              details?: {
                trust_decision?: ApiTrustDecision;
                challenge_id?: string;
                device_id?: string;
                path?: string;
                action?: string;
                write_targets_new_path_prefix?: boolean;
              };
            };
          };
          const details403 = err403.error?.details;
          const td403 = details403?.trust_decision;
          const errCode403 = err403.error?.code;

          if (td403?.decision === "need_confirmation") {
            const codes = Array.isArray(td403.reason_codes) ? td403.reason_codes : [];
            const ufm = bundleFromDecision(td403, codes);
            await loadMessages();
            const d = details403;
            const desktopCtx: DesktopExecuteRetryContext | undefined =
              errCode403 === "desktop_write_confirmation_required" &&
              typeof d?.challenge_id === "string" &&
              typeof d?.device_id === "string" &&
              d?.action === "file_write"
                ? {
                    challengeId: d.challenge_id,
                    deviceId: d.device_id,
                    path: typeof d.path === "string" ? d.path : "",
                    action: "file_write",
                    write_targets_new_path_prefix: Boolean(d.write_targets_new_path_prefix),
                  }
                : undefined;
            const resourceLine =
              typeof d?.action === "string"
                ? formatDesktopTrustPathLine(
                    w22Local,
                    d.action,
                    typeof d.path === "string" ? d.path : "",
                  )
                : undefined;
            const confirmRow = buildTrustAgentMessage({
              id: `trust-confirm-${Date.now()}`,
              conversationId,
              leadText: desktopCtx ? w22Local.desktopTrustLead : productUi.pendingAgentConfirmation,
              agentLabel: w5Local.trustActorLabel,
              trust: {
                variant: "need_confirmation",
                riskLevel: normalizeRisk(td403.risk_level),
                reasonCodes: codes,
                userFacingMessage: ufm,
                policyRuleId:
                  typeof td403.policy_rule_id === "string" ? td403.policy_rule_id : undefined,
                desktopExecuteContext: desktopCtx,
                desktopResourceLine: resourceLine,
              },
            });
            setMessages((prev) => [...prev, confirmRow]);
            return false;
          }

          if (td403) {
            const codes = Array.isArray(td403.reason_codes) ? td403.reason_codes : [];
            const ufm = bundleFromDecision(td403, codes);
            await loadMessages();
            const blocked = buildTrustAgentMessage({
              id: `trust-deny-${Date.now()}`,
              conversationId,
              leadText: w5Local.trustLeadBlockedPolicy,
              agentLabel: w5Local.trustActorLabel,
              trust: {
                variant: "platform_blocked",
                riskLevel: normalizeRisk(td403.risk_level),
                reasonCodes: codes,
                userFacingMessage: ufm,
                policyRuleId: typeof td403.policy_rule_id === "string" ? td403.policy_rule_id : undefined,
              },
            });
            setMessages((prev) => [...prev, blocked]);
            return false;
          }
          await loadMessages();
          const policyClassified = classifySendMessageError(403, json, false);
          if (policyClassified) {
            setMessages((prev) => [
              ...prev,
              buildProductErrorChatRow({
                conversationId,
                actorLabel: w7.errorActorLabel,
                classified: policyClassified,
              }),
            ]);
          }
          return false;
        }

        if (res.status === 201 && json.data) {
          const data = json.data as ApiMessage;
          const meta = (json as {
            meta?: {
              receipt_id?: string;
              invocation_id?: string;
              trust_decision?: ApiTrustDecision;
            };
          }).meta;
          const next: ChatMessage = { ...toChatMessage(data) };
          if (meta?.receipt_id) {
            const td = meta.trust_decision;
            const codes = Array.isArray(td?.reason_codes) ? td!.reason_codes! : [];
            next.receiptSlice = {
              receiptId: meta.receipt_id,
              invocationId: typeof meta.invocation_id === "string" ? meta.invocation_id : undefined,
              issuedAt: new Date().toISOString(),
              summaryBundle: td ? bundleFromDecision(td, codes) : buildUserFacingMessageFromReasonCodes([]),
              reasonCodes: codes.length > 0 ? codes : undefined,
              policyRuleId: typeof td?.policy_rule_id === "string" ? td.policy_rule_id : undefined,
            };
          }
          setMessages((prev) => [...prev, next]);
          if (multiAgent) {
            setOrchestrationTrigger({ text, key: Date.now() });
          }
          return true;
        }

        if (res.status === 202 && json.data) {
          const meta = (
            json as {
              meta?: {
                pending_invocations?: PendingInvocationMeta[];
                invocation_id?: string;
                trust_decision?: ApiTrustDecision;
              };
            }
          ).meta;
          const userMsg = toChatMessage(json.data as ApiMessage);
          const extras: ChatMessage[] = [];
          const pending = meta?.pending_invocations;
          if (Array.isArray(pending) && pending.length > 0) {
            pending.forEach((inv, i) => {
              const td = inv.trust_decision;
              const codes = Array.isArray(td?.reason_codes) ? td!.reason_codes! : [];
              extras.push(
                buildTrustAgentMessage({
                  id: `pending-${inv.invocation_id}-${i}`,
                  conversationId,
                  leadText: productUi.pendingAgentConfirmation,
                  agentLabel: w5Local.trustActorLabel,
                  trust: {
                    variant: "need_confirmation",
                    invocationId: inv.invocation_id,
                    riskLevel: normalizeRisk(td?.risk_level),
                    reasonCodes: codes,
                    userFacingMessage: bundleFromDecision(td, codes),
                    policyRuleId: typeof td?.policy_rule_id === "string" ? td.policy_rule_id : undefined,
                  },
                }),
              );
            });
          } else if (meta?.invocation_id && meta.trust_decision?.decision === "need_confirmation") {
            const td = meta.trust_decision;
            const codes = Array.isArray(td.reason_codes) ? td.reason_codes : [];
            extras.push(
              buildTrustAgentMessage({
                id: `pending-${meta.invocation_id}`,
                conversationId,
                leadText: productUi.pendingAgentConfirmation,
                agentLabel: w5Local.trustActorLabel,
                trust: {
                  variant: "need_confirmation",
                  invocationId: meta.invocation_id,
                  riskLevel: normalizeRisk(td.risk_level),
                  reasonCodes: codes,
                  userFacingMessage: bundleFromDecision(td, codes),
                  policyRuleId: typeof td.policy_rule_id === "string" ? td.policy_rule_id : undefined,
                },
              }),
            );
          }
          setMessages((prev) => [...prev, userMsg, ...extras]);
          if (multiAgent) {
            setOrchestrationTrigger({ text, key: Date.now() });
          }
          return true;
        }

        const classified = classifySendMessageError(res.status, json, false);
        if (classified) {
          await loadMessages();
          setMessages((prev) => [
            ...prev,
            buildProductErrorChatRow({
              conversationId,
              actorLabel: w7.errorActorLabel,
              classified,
            }),
          ]);
        }
        return false;
      } catch {
        setNetworkFailure({ text, fileRefId: options?.fileRefId });
        return false;
      }
    },
    [
      conversationId,
      userId,
      productUi.pendingAgentConfirmation,
      participants,
      loadMessages,
      resolvedLocale,
      conversationState,
      loadConversationMeta,
      w7.errorActorLabel,
    ],
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
        <ChatParticipantBar
          locale={resolvedLocale}
          conversationId={conversationId}
          title={conversationTitle}
          participants={participants}
          isGuestInSpace={isGuestInSpace}
          readOnly={readOnlyChat}
          onParticipantsChange={() => void loadConversationMeta()}
          showPresenceDots={Boolean(conversationSpaceId)}
          presenceByUserId={presenceByUserId}
          presenceOnlineLabel={w16.presenceOnline}
          presenceAwayLabel={w16.presenceAway}
          presenceOfflineLabel={w16.presenceOffline}
        />
        <ChatResilienceChrome
          copy={w7}
          browserOnline={browserOnline}
          sseState={sseState}
          sendQueue={sendQueue}
          onRemoveQueued={(id) => setSendQueue((q) => q.filter((x) => x.id !== id))}
          onFlushQueue={() => void flushSendQueue()}
        />
        {networkFailure ? (
          <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-2">
            <ProductErrorCallout
              surface={{ pattern: "platform_fault", canRetrySamePayload: true }}
              copy={w7}
              locale={resolvedLocale}
              onRetrySamePayload={() => {
                const t = networkFailure.text;
                const fr = networkFailure.fileRefId;
                setNetworkFailure(null);
                void handleSend(t, fr ? { fileRefId: fr } : undefined);
              }}
              onRefreshThread={() => {
                setNetworkFailure(null);
                void loadMessages();
              }}
            />
          </div>
        ) : null}
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-muted/25 px-3 py-2 text-xs text-foreground">
          {readOnlyChat && (
            <p className="w-full text-amber-900 dark:text-amber-100 sm:mr-auto sm:w-auto">
              {conversationState === "closed" ? w6conv.readOnlyClosed : w6conv.readOnlyArchived}
            </p>
          )}
          {readOnlyChat && (
            <button
              type="button"
              onClick={() => void handleRestoreConversation()}
              className="rounded-md border border-border bg-background px-2 py-1 font-medium hover:bg-muted"
            >
              {w6conv.restoreChat}
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-1.5 text-muted-foreground">
            <input
              type="checkbox"
              checked={exportRedact}
              onChange={(e) => setExportRedact(e.target.checked)}
              className="rounded border-border"
            />
            {w6conv.exportRedact}
          </label>
          <button
            type="button"
            onClick={() => downloadExport("md")}
            className="font-medium text-primary hover:underline"
          >
            {w6conv.exportMarkdown}
          </button>
          <button
            type="button"
            onClick={() => downloadExport("txt")}
            className="font-medium text-primary hover:underline"
          >
            {w6conv.exportPlain}
          </button>
        </div>
        <MessageList
          messages={messages}
          locale={resolvedLocale}
          isSpaceAdmin={isSpaceAdmin}
          streamingMessageId={streamingMessageId}
          onConfirmInvocation={handleConfirmInvocation}
          onRejectInvocation={handleRejectInvocation}
          onDesktopWriteConfirm={handleDesktopWriteConfirm}
          onDesktopWriteReject={handleDesktopWriteReject}
          onViewReceipt={handleViewReceipt}
          onViewInvocationReceipt={handleViewInvocationReceipt}
          onOpenTrustQueue={onOpenTrustQueue}
          threadCopy={threadCopy}
          trustCardCopy={trustCardCopy}
          receiptSummaryCopy={receiptSummaryCopy}
          w7Copy={w7}
          onRefreshMessages={() => void loadMessages()}
          focusInvocationId={focusInvocationId}
          onConsumedFocusInvocation={onConsumedFocusInvocation}
          viewerUserId={userId}
          onMarkMessageRead={handleMarkMessageRead}
          w16ReadCopy={w16}
          w17NotionReceiptCopy={w17NotionReceipt}
          moderation={messageModeration}
          emptySlot={
            isAuthenticated && messages.length === 0 ? (
              <ChatFirstRunEmpty
                locale={resolvedLocale}
                copy={w9FirstRun}
                conversationId={conversationId}
                userId={userId}
                isGuest={isGuestInSpace}
                readOnly={readOnlyChat}
                onConversationRefresh={() => void loadConversationMeta()}
              />
            ) : undefined
          }
        />
        <OrchestrationPlanBar
          conversationId={conversationId}
          userId={userId}
          localePrefix={`/${resolvedLocale}`}
          ux={w4Ux}
          conversationAgents={conversationAgentOptions}
          trigger={orchestrationTrigger}
          onConsumeTrigger={consumeOrchestrationTrigger}
          partialSummaryCopy={{
            title: w7.orchestrationPartialTitle,
            leadTemplate: w7.orchestrationPartialLead,
          }}
        />
        {typingBannerLabel ? <TypingIndicator label={typingBannerLabel} /> : null}
        {maintenanceAgentNames.length > 0 ? (
          <div className="shrink-0 border-b border-amber-500/35 bg-amber-500/[0.07] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100 sm:px-4">
            <span className="font-medium">{w18.maintenanceBanner}</span>
            <span className="mt-1 block text-amber-900/90 dark:text-amber-100/90">
              {maintenanceAgentNames.join(" · ")}
            </span>
          </div>
        ) : null}
        <InputBar
          placeholder={placeholder}
          sendLabel={sendLabel}
          isAuthenticated={isAuthenticated}
          disabled={readOnlyChat}
          onRequireLogin={onRequireLogin}
          onSend={handleSend}
          mentionCandidates={mentionCandidates}
          mentionEmptyLabel={spaceUi.mentionEmpty}
          initialDraft={initialInputDraft}
          onTypingPulse={handleTypingPulse}
          onTypingCease={handleTypingCease}
          showAttachmentButton={mayUseConnectorUpload}
          attachmentCopy={{
            attachAria: productUi.chatAttachFileAria,
            uploading: productUi.chatAttachUploading,
            uploadFailed: productUi.chatAttachUploadFailed,
            attachedPrefix: productUi.chatAttachedPrefix,
            removeAria: productUi.chatRemoveAttachmentAria,
            fileTooLarge: productUi.chatFileTooLarge,
            defaultMessageWithFile: productUi.chatDefaultMessageWithFile,
          }}
        />
      </div>
      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => setLoginOpen(false)}
        returnUrl={pathname ?? undefined}
      />
      <ReportDialog
        open={reportMessageId !== null}
        messageId={reportMessageId}
        copy={w21}
        onClose={() => setReportMessageId(null)}
        onSuccessToast={(m) => setProductToast(m)}
      />
      <HideMessageDialog
        open={hideMessageId !== null}
        messageId={hideMessageId}
        copy={w21}
        onClose={() => setHideMessageId(null)}
        onSuccessToast={(m) => {
          setProductToast(m);
          void loadMessages();
        }}
      />
      {productToast ? (
        <div
          className="pointer-events-none fixed bottom-28 left-1/2 z-[96] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-lg border border-border bg-card px-4 py-3 text-center text-base text-foreground shadow-lg"
          role="status"
        >
          {productToast}
        </div>
      ) : null}
    </>
  );
}
