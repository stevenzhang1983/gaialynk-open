# Agent 目录 API（T-5.2）

> 依据：CTO-Execution-Directive-v1 §5、CTO-Website-Optimization-Plan-v1 §8

## 说明

- **未登录用户可调用**：目录浏览不需要认证，所有接口均不要求 `X-Actor-Id` 等鉴权头。
- 前缀：`/api/v1`
- 响应格式：成功 `{ data: T, meta?: { next_cursor? } }`，错误 `{ error: { code, message, details? } }`

## 接口清单

### 1. Agent 列表（分页、搜索、分类筛选）

- **GET** `/api/v1/agents`
- Query:
  - `cursor?: string` — 分页游标（上一页最后一条的 id）
  - `limit?: number` — 每页条数，默认 50，最大 100
  - `sort?: "created_at:desc" | "created_at:asc"` — 排序，默认 `created_at:desc`
  - `search?: string` — 关键词模糊匹配（name、description 的 ILIKE）
  - `status?: "active" | "deprecated" | "pending_review"` — 按状态筛选
  - `source_origin?: "official" | "self_hosted" | "connected_node" | "vendor"` — 按来源筛选
  - `agent_type?: "logical" | "execution"` — 按类型筛选
- 响应 200: `{ data: Agent[] }` 或 `{ data: Agent[]; meta: { next_cursor?: string } }`（使用 cursor/limit 时）

### 2. Agent 详情（含身份验证状态、信誉评分、成功率、风险等级）

- **GET** `/api/v1/agents/:id`
- 响应 200: `{ data: AgentEnriched }`
  - 包含基础 Agent 字段（id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at）
  - 以及：`identity_verified: boolean`、`reputation_score: number`、`reputation_grade: "A"|"B"|"C"|"D"`、`success_rate: number`、`risk_level: "low"|"medium"|"high"|"critical"`、`feedback_summary: { valid_feedback_count, quality_avg, speed_avg, stability_avg, meets_expectation_avg, abuse_flagged_count }`
- 404: `agent_not_found`

### 3. Agent 统计信息

- **GET** `/api/v1/agents/:id/stats`
- 响应 200: `{ data: AgentStats }`
  - `event_counts: { completed, failed, denied, need_confirmation }`
  - `success_rate: number`
  - `reputation_score: number`、`reputation_grade: "A"|"B"|"C"|"D"`
  - `feedback_summary: { valid_feedback_count, quality_avg, speed_avg, stability_avg, meets_expectation_avg, abuse_flagged_count }`
- 404: `agent_not_found`

## 验收条件（T-5.2）

- [x] 搜索支持关键词模糊匹配（name、description）
- [x] Agent 详情包含身份验证状态、信誉评分
- [x] 未登录用户可调用（目录浏览不需要认证）
