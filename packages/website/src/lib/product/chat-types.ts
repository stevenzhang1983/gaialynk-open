import type { UserFacingLocaleBundle } from "@/lib/product/reason-codes-user-facing";
import type { ProductErrorPattern } from "@/lib/product/product-error-pattern";

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

export type MessageDeliveryStatus = "sending" | "delivered" | "failed";

export type ApiMessage = {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id: string;
  content: MessageContent;
  created_at: string;
  /** 主线投递状态；缺省视为 delivered */
  status?: MessageDeliveryStatus;
};

/** W-22：桌面 Connector 写入确认后，用 token 重试 execute */
export type DesktopExecuteRetryContext = {
  challengeId: string;
  deviceId: string;
  path: string;
  action: "file_list" | "file_read" | "file_write";
  write_targets_new_path_prefix?: boolean;
};

/** W-5：会话内 Trust 面（拦截 / 需确认 / 边界），与主线 meta.trust_decision 对齐 */
export type TrustInteractionSurface = {
  variant: "need_confirmation" | "platform_blocked" | "data_boundary_blocked";
  invocationId?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  reasonCodes: string[];
  userFacingMessage: UserFacingLocaleBundle;
  policyRuleId?: string;
  /** W-22：与 invocation 确认并行，桌面文件写入确认 + 重试 execute */
  desktopExecuteContext?: DesktopExecuteRetryContext;
  /** W-22：展示在 Trust 卡片上的资源行（操作类型 + 路径） */
  desktopResourceLine?: string;
};

/** W-7：产品错误面（与 Trust 卡片区分：平台 / Agent / 队列 / 连接器） */
export type ProductErrorSurface = {
  pattern: ProductErrorPattern;
  code?: string;
  estimatedWaitMs?: number;
  /** 是否可用「用上次正文再试一次」（仅网络级失败等） */
  canRetrySamePayload?: boolean;
  /** W-22：`/{locale}/help#article-{id}` */
  helpArticleId?: string;
};

/** W-5：201 成功调用后附在用户消息上的收据切片 */
export type ReceiptSliceAttachment = {
  receiptId: string;
  /** W-18：与主线 `invocations` 行对应时，可打开角色化调用收据页 */
  invocationId?: string;
  issuedAt?: string;
  summaryBundle?: UserFacingLocaleBundle;
  reasonCodes?: string[];
  policyRuleId?: string;
};

/** 前端展示用：API 消息 + 可选的内嵌风险确认、收据等 */
export type ChatMessage = ApiMessage & {
  /** 若为 agent 消息，可带 Agent 显示名与验证状态 */
  agentName?: string;
  agentVerificationStatus?: "verified" | "pending" | "unverified";
  /** 本条消息关联的待确认 invocation（展示风险确认卡片） */
  pendingInvocationId?: string;
  trustDecision?: "allow" | "allow_limited" | "need_confirmation" | "deny";
  /** 收据 ID，用于收据查看入口（轻量链接） */
  receiptId?: string;
  /** W-5 统一 Trust 卡片数据（优先于 pendingInvocationId 单独渲染） */
  trustInteraction?: TrustInteractionSurface;
  /** W-5 用户消息上的收据摘要 */
  receiptSlice?: ReceiptSliceAttachment;
  /** W-7：内联错误卡片（与 Trust 不同轴） */
  productErrorSurface?: ProductErrorSurface;
  /** W-16：其他用户对该条消息的已读 user_id（仅自己发送的消息由前端合并 WS `message_read`） */
  readByUserIds?: string[];
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
  /** E-2：会话所属 Space；未绑定时为 null */
  space_id?: string | null;
  /** W-6：当前用户置顶时间（登录且主线返回 prefs join 时） */
  pinned_at?: string | null;
  /** W-6：当前用户标星 */
  starred?: boolean;
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
