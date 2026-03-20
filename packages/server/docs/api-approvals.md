# 风险确认 API（T-5.5）

> 依据：CTO-Execution-Directive-v1 §5、CTO-Website-Optimization-Plan-v1 §8

## 基础路径

- 前缀：`/api/v1/approvals`
- 成功响应：`{ data: T }`；错误：`{ error: { code, message, details? } }`
- 对应产品区「审批队列」与对话内风险确认卡片；与 `review-queue` 语义一致，提供统一审批入口。

## 接口清单

### 1. 待审批列表

- **GET** `/api/v1/approvals`
- Query: `conversation_id`（可选）— 按会话过滤
- 响应 200: `{ data: ApprovalListItem[] }`
  - 仅包含 `status === "pending_confirmation"` 且未被拒绝的 invocation
  - 每项：`id`, `conversation_id`, `agent_id`, `requester_id`, `user_text`, `status`, `created_at`

### 2. 审批详情

- **GET** `/api/v1/approvals/:id`
- 响应 200: `{ data: ApprovalDetail }`
  - 含 invocation 字段 + `agent: { id, name, description, agent_type, capabilities }`
- 404: `approval_not_found`（不存在或已处理/已拒绝）

### 3. 确认（继续执行）

- **POST** `/api/v1/approvals/:id/confirm`
- Body: `{ approver_id: string }`
- 行为：与 `POST /api/v1/invocations/:id/confirm` 一致，执行 A2A 调用并写审计/收据
- 响应 200: `{ data: { invocation_id, status: "completed" }, meta: { receipt_id } }`
- 404: `approval_not_found`
- 409: `invocation_not_confirmable`（已处理或已拒绝）

### 4. 拒绝

- **POST** `/api/v1/approvals/:id/reject`
- Body: `{ approver_id: string; reason?: string (max 280) }`
- 行为：记录拒绝决策并写入审计 `invocation.denied_by_reviewer`，不执行 Agent 调用
- 响应 200: `{ data: { invocation_id, status: "denied", approver_id, reason?, denied_at }, meta?: { idempotent } }`
- 已拒绝时再次调用返回 200（idempotent）
- 409: 若 invocation 已 completed

### 5. 调用链摘要

- **GET** `/api/v1/approvals/:id/chain`
- 响应 200: `{ data: ApprovalChainEvent[] }`
  - 按时间排序的审计事件列表，仅包含 `payload.invocation_id === id` 的事件
  - 每项：`event_type`, `actor_type`, `actor_id`, `trust_decision?`, `created_at`, `payload?`
- 404: `approval_not_found`（invocation 不存在）

## TypeScript 类型（与实现一致）

```ts
interface ApprovalListItem {
  id: string;
  conversation_id: string;
  agent_id: string;
  requester_id: string;
  user_text: string;
  status: "pending_confirmation" | "processing_confirmation" | "completed";
  created_at: string;
}

interface ApprovalDetail extends InvocationLike {
  agent: { id: string; name: string; description: string; agent_type: string; capabilities: unknown };
}

interface ApprovalChainEvent {
  event_type: string;
  actor_type: string;
  actor_id: string;
  trust_decision?: unknown;
  created_at: string;
  payload?: Record<string, unknown>;
}
```

## 验收条件（T-5.5）

- [x] 确认后对应的 Agent 操作正确继续（执行 A2A、写审计与收据）
- [x] 拒绝后不执行、写审计，待审批列表中不再出现
- [x] 调用链摘要包含完整决策路径（含 `invocation.pending_confirmation` 等）
- [x] 基础自动化测试：`tests/t5-5-approvals-api.test.ts`
