/**
 * 智能体中心（Agent Hub）相关类型（T-4.1）。API 就绪后可与 T-5.2 类型对齐。
 */
export type AgentVerificationStatus = "verified" | "pending" | "unverified";

export type AgentRiskLevel = "low" | "medium" | "high";

export type AgentCategory = "productivity" | "research" | "code" | "governance" | "other";

/** E-6：与主线 `trust_badge` 对齐 */
export type TrustBadge = "unverified" | "consumer_ready" | "high_sensitivity_enhanced";

/** E-15：智能体中心上架状态 */
export type AgentListingStatus = "listed" | "maintenance" | "delisted";

export type Agent = {
  id: string;
  name: string;
  /** 能力摘要（卡片展示） */
  capabilitySummary: string;
  /** 信誉评分 0–100 */
  reputationScore: number;
  /** 验证状态 Badge */
  verificationStatus: AgentVerificationStatus;
  /** E-6：智能体中心卡片优先展示（与 API trust_badge 一致） */
  trustBadge?: TrustBadge;
  /** E-7：并发容量 */
  maxConcurrent?: number;
  queueBehavior?: "queue" | "fast_fail";
  /** 分类，用于筛选 */
  category: AgentCategory;
  /** 详情：身份验证状态 */
  identityVerificationStatus: string;
  /** 详情：能力声明 */
  capabilityStatement: string;
  /** 详情：历史成功率 0–100 */
  historySuccessRate: number;
  /** 详情：风险等级 */
  riskLevel: AgentRiskLevel;
  /** 详情（API）：排程、记忆、超时等 */
  supportsScheduled?: boolean;
  memoryTier?: string;
  timeoutMs?: number | null;
  sourceOrigin?: string;
  agentType?: string;
  sourceUrl?: string;
  nodeId?: string;
  /** E-15：上架 / 维护 / 下架 */
  listingStatus?: AgentListingStatus;
};
