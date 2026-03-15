# Agent IM 主线接口契约矩阵（v1 冻结）

日期：2026-03-15  
适用范围：`packages/server`（主线后端）  
状态：冻结（发布前）

---

## 1. 目标与说明

- 本文冻结 CTO 指定的 5 个接口契约（字段、错误码、语义）。
- 官网/入口线联调以本文为准。
- 若需改动契约，必须走“破坏性变更判定规则”并显式版本化。

---

## 2. 契约矩阵

## 2.1 `POST /api/v1/public/entry-events`

### 请求体（v1）

- `event_name`：`page_view | cta_click | docs_click | demo_click | waitlist_submit | demo_submit | lang_switch`
- `locale`：`en | zh-Hant | zh-Hans`
- `page`：`string`（`1..128`）
- `cta_id?`：`string`（`1..128`）
- `source?`：`string`（`<=256`）
- `device_type?`：`mobile | desktop`
- `referrer?`：`string`（`1..512`，缺省服务端补 `unknown`）
- `timestamp?`：ISO 字符串（缺省服务端补当前时间）

### 成功响应

- `202`
- `{ data: { accepted: true, event_type: "entry.<event_name>" } }`

### 错误响应

- `400 invalid_public_entry_event`：payload 非法或 JSON 非法

### 语义约束

- 仅写入审计事件，不返回聚合统计。
- 不接受扩展事件名；新增事件名需版本说明。

---

## 2.2 `GET /api/v1/public/entry-metrics`

### 请求参数

- 无（当前固定 30 天窗口，后续如扩展需版本说明）

### 成功响应

- `200`
- `data.locales_supported: string[]`
- `data.weekly_trusted_invocations: number`
- `data.first_session_success_rate: number`
- `data.connected_nodes_total: number`
- `data.conversion_baseline`
  - `page_view_home: number`
  - `cta_click_start_building: number`
  - `docs_click: number`
  - `waitlist_submit: number`
  - `demo_submit: number`
- `data.locale_breakdown: Record<string, Record<string, number>>`

### 语义约束

- `page_view_home` 仅统计首页（`home`/`/en`/`/zh-Hant`/`/zh-Hans`）。
- `cta_click_start_building` 仅统计 `cta_id === "start_building"`。

---

## 2.3 `GET /api/v1/agents/recommendations`

### 请求参数

- `intent`（必填，`string`）
- `risk_max?`：`low | medium | high | critical`
- `limit?`：`1..20`

### 成功响应

- `200`
- `{ data: Array<{ agent: Agent; score: number; reason: string }> }`

### 错误响应

- `400 invalid_recommendation_query`：查询参数非法

### 语义约束

- 风险过滤按“与 intent 匹配能力优先、全能力回退”执行，不允许首能力误判。

---

## 2.4 `GET /api/v1/nodes/health`

### 请求参数

- `stale_after_sec?`：`1..86400`（默认 `30`）

### 成功响应

- `200`
- `data.stale_after_sec: number`
- `data.summary: { total, online, degraded, offline }`
- `data.nodes: Array<{ node_id, status, heartbeat_lag_ms, endpoint }>`

### 错误响应

- `400 invalid_nodes_health_query`：查询参数非法

---

## 2.5 `POST /api/v1/nodes/relay/invoke`

### 请求体

- `node_id`：UUID
- `conversation_id`：UUID
- `agent_id`：UUID
- `sender_id`：`string`
- `text`：`string`
- `thread_id?`：`string`
- `mentions?`：`string[]`
- `retry_max?`：`0..3`
- `stale_after_sec?`：`1..86400`

### 成功响应

- `201`：已完成调用（常见）
- `202`：进入待确认（高风险）

### 错误响应

- `400 validation_error`：请求体校验失败
- `400 agent_node_mismatch`：agent 不属于指定 node
- `404 node_not_found`
- `404 agent_not_found`
- `503 node_unavailable`：心跳超时判定离线
- `502 a2a_invocation_failed`：中继后下游 A2A 调用失败

---

## 3. 破坏性变更判定规则（必须执行）

以下任一项发生，判定为破坏性变更（Breaking Change）：

1. 删除或重命名任一已发布字段（含 `data`、`meta`、`error` 内字段）。
2. 变更字段类型（如 `number -> string`）或语义（统计口径变化且未版本化）。
3. 删除或改名已有错误码。
4. 收紧枚举值而未提供兼容策略（如 event_name 旧值失效）。
5. 将既有成功状态码改为其他状态码，且无版本切换说明。

非破坏性变更（可在 v1 内迭代）：

- 新增可选字段；
- 在不改变语义前提下新增错误 `details` 子字段；
- 增加新接口，不影响现有接口行为。

---

## 4. 版本治理规则

- 契约变更必须同步更新本文版本号（`v1 -> v1.x` 或 `v2`）。
- 任何破坏性变更必须：
  - 新增版本标识；
  - 提供迁移说明；
  - 增加兼容性守卫测试。

