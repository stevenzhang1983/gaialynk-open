/**
 * T-4.2 聊天消息类型，与 T-5.1 会话 API 对齐。
 * Mainline Message: id, conversation_id, sender_type, sender_id, content: { type: "text"; text: string }, created_at
 */
export type MessageSenderType = "user" | "agent" | "system";

export type MessageContent = {
  type: "text";
  text: string;
  thread_id?: string;
  mentions?: string[];
};

export type ApiMessage = {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id: string;
  content: MessageContent;
  created_at: string;
};

/** 前端展示用：API 消息 + 可选的内嵌风险确认、收据等 */
export type ChatMessage = ApiMessage & {
  /** 若为 agent 消息，可带 Agent 显示名与验证状态 */
  agentName?: string;
  agentVerificationStatus?: "verified" | "pending" | "unverified";
  /** 本条消息关联的待确认 invocation（展示风险确认卡片） */
  pendingInvocationId?: string;
  trustDecision?: "allow" | "allow_limited" | "need_confirmation" | "deny";
  /** 收据 ID，用于收据查看入口 */
  receiptId?: string;
};

export type RiskConfirmationPayload = {
  invocationId: string;
  reason?: string;
  onConfirm: () => void;
  onReject: () => void;
};

/**
 * T-4.3 会话列表项：与 T-5.1 会话 API 列表对齐，含展示用扩展字段。
 * API Conversation: id, title, state, created_at, updated_at
 */
export type ApiConversation = {
  id: string;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
};

/** 列表展示用：API 会话 + 可选摘要、参与 Agent 标识、未读 */
export type ConversationListItem = ApiConversation & {
  /** 最后一条消息摘要（API 未返回时可前端从详情补全或留空） */
  summary?: string;
  /** 参与会话的 Agent 显示名或 id（用于头像/角标） */
  agentNames?: string[];
  /** 未读消息数或仅指示有无未读 */
  unread?: boolean | number;
};
