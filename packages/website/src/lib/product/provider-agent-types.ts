/**
 * T-4.8 / T-5.4 Provider 接入 API 使用的 Agent 类型（与 mainline 响应一致）。
 */
export type ProviderAgentCapability = {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
};

export type ProviderAgent = {
  id: string;
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: ProviderAgentCapability[];
  source_origin?: string;
  status?: "active" | "deprecated" | "pending_review";
  created_at: string;
  owner_id?: string;
  health_check_status?: "ok" | "failed" | null;
  health_check_at?: string | null;
  health_check_error?: string | null;
};

export type RegisterAgentBody = {
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: ProviderAgentCapability[];
};

export type HealthCheckResult = {
  status: "ok" | "failed" | null;
  checked_at: string | null;
  error: string | null;
};
