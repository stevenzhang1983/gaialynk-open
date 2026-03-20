/**
 * Agent 目录相关类型（T-4.1）。API 就绪后可与 T-5.2 类型对齐。
 */
export type AgentVerificationStatus = "verified" | "pending" | "unverified";

export type AgentRiskLevel = "low" | "medium" | "high";

export type AgentCategory = "productivity" | "research" | "code" | "governance" | "other";

export type Agent = {
  id: string;
  name: string;
  /** 能力摘要（卡片展示） */
  capabilitySummary: string;
  /** 信誉评分 0–100 */
  reputationScore: number;
  /** 验证状态 Badge */
  verificationStatus: AgentVerificationStatus;
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
};
