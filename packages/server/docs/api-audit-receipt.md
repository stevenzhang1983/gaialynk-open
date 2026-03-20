# 审计与收据 API（T-5.6）

> 依据：CTO-Execution-Directive-v1 §5、CTO-Website-Optimization-Plan-v1 §8

## 基础路径

- 收据：`/api/v1/receipts`
- 审计：`/api/v1/audit`、`/api/v1/audit-events`（列表）
- 成功响应：`{ data: T, meta?: { next_cursor?, is_valid? } }`；错误：`{ error: { code, message, details? } }`
- 对应产品区「右侧收据视图」「审计时间线」「历史记录」；收据可独立验签。

## 接口清单

### 1. 收据详情

- **GET** `/api/v1/receipts/:id`
- 响应 200: `{ data: Receipt, meta: { is_valid: boolean } }`
  - 收据包含 `signature`、`payload_hash`、`signer`、`issued_at`，可独立验证
- 404: `receipt_not_found`

### 2. 收据签名验证

- **GET** `/api/v1/receipts/:id/verify`
- 响应 200: `{ data: { receipt_id: string, is_valid: boolean } }`
- 404: `receipt_not_found`

### 3. 审计时间线

- **GET** `/api/v1/audit/timeline`
- Query:
  - `conversation_id`（可选）— 按对话过滤
  - `agent_id`（可选）— 按 Agent 过滤
  - `from`、`to`（可选）— ISO 8601 时间范围
  - `cursor`、`limit`（可选）— 分页，limit 1–200，默认 50
  - `sort`（可选）— `created_at:asc` | `created_at:desc`，默认 `created_at:desc`
- 响应 200: `{ data: AuditEvent[], meta: { next_cursor: string | null } }`
- 400: `invalid_audit_timeline_query`（参数不合法）

### 4. 审计事件详情

- **GET** `/api/v1/audit/events/:id`
- 响应 200: `{ data: AuditEvent }`
- 404: `audit_event_not_found`

## 已有相关接口

- **GET** `/api/v1/audit-events` — 审计事件列表（同 timeline 过滤能力，排序为 created_at asc，无 sort 参数）

## TypeScript 类型（与实现一致）

```ts
interface Receipt {
  id: string;
  audit_event_id: string;
  conversation_id: string;
  receipt_type: string;
  payload_hash: string;
  signature: string;
  signer: string;
  issued_at: string;
  prev_receipt_hash?: string;
}

interface AuditEvent {
  id: string;
  event_type: string;
  conversation_id?: string;
  agent_id?: string;
  actor_type: "user" | "agent" | "system";
  actor_id: string;
  payload: Record<string, unknown>;
  trust_decision?: TrustDecision;
  correlation_id: string;
  created_at: string;
}
```

## 验收条件（T-5.6）

- [x] 收据包含签名、可独立验证
- [x] 审计时间线按时间排序、支持过滤（按对话 / 按 Agent / 按时间）
