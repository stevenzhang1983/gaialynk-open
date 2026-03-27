/**
 * T-4.8 / T-5.4 Provider 接入 API 使用的 Agent 类型（与 mainline 响应一致）。
 */
export type ProviderAgentCapability = {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
};

export type QueueBehavior = "queue" | "fast_fail";

export type MemoryTier = "none" | "session" | "user_isolated";

/** E-7 上架 / 网关声明字段（与 PATCH gateway-listing 及 GET agents/:id 对齐） */
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
  max_concurrent?: number;
  queue_behavior?: QueueBehavior;
  timeout_ms?: number | null;
  supports_scheduled?: boolean;
  memory_tier?: MemoryTier;
};

/** GET /api/v1/agents/:id 富化响应中的 data（控制台取 agent 子集即可） */
export type AgentDetailApiData = ProviderAgent & {
  identity_verified?: boolean;
  reputation_score?: number;
  reputation_grade?: string;
  success_rate?: number;
  trust_badge?: string;
};

export type AgentEndpointRow = {
  id: string;
  agent_id: string;
  endpoint_url: string;
  status: string;
  last_health_check_at: string | null;
  created_at: string;
};

export type AgentEndpointsApiData = {
  primary_source_url: string;
  endpoints: AgentEndpointRow[];
};

export type AgentStatsApiData = {
  event_counts: {
    completed: number;
    failed: number;
    denied: number;
    need_confirmation: number;
  };
  success_rate: number;
  reputation_score: number;
  reputation_grade: string;
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
