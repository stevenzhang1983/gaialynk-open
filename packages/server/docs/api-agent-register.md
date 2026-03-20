# Agent 接入 API（T-5.4）

> 依据：CTO-Execution-Directive-v1 §5、CTO-Website-Optimization-Plan-v1 §8

## 说明

- **需认证**：所有接口均要求 `Authorization: Bearer <access_token>`。
- **仅 Provider 角色可调用**：非 Provider 角色返回 `403 forbidden`。
- 前缀：`/api/v1`
- 响应格式：成功 `{ data: T }`，错误 `{ error: { code, message, details? } }`。

## 接口清单

### 1. 注册新 Agent

- **POST** `/api/v1/agents/register`
- Body:
  - `name` (string, 1–255)
  - `description` (string, 非空)
  - `agent_type` (`"logical"` | `"execution"`)
  - `source_url` (string, 合法 URL，A2A 端点)
  - `capabilities` (array of `{ name: string, risk_level: "low"|"medium"|"high"|"critical" }`)
- 服务端自动设置：`source_origin = "self_hosted"`，`status = "pending_review"`，`owner_id = 当前用户 id`。
- 响应 201: `{ data: Agent }`
- 400: 参数校验失败
- 401: 未认证
- 403: 非 Provider 角色

### 2. 获取当前 Provider 的 Agent 列表

- **GET** `/api/v1/agents/mine`
- 响应 200: `{ data: Agent[] }`（按创建时间倒序）
- 401: 未认证
- 403: 非 Provider 角色

### 3. 触发连通性检查

- **POST** `/api/v1/agents/:id/health-check`
- 向 Agent 的 `source_url` 发送 A2A `capabilities.list` 请求，将结果写入该 Agent 的健康检查字段。
- 响应 200: `{ data: { status: "ok" | "failed", error?: string } }`
- 401: 未认证
- 403: 非 Provider 或非该 Agent 的 owner
- 404: Agent 不存在

### 4. 获取健康检查结果

- **GET** `/api/v1/agents/:id/health-check/result`
- 响应 200: `{ data: { status: "ok"|"failed"|null, checked_at: string|null, error: string|null } }`
- 401/403/404: 同上

### 5. 触发测试调用

- **POST** `/api/v1/agents/:id/test-call`
- Body 可选: `{ message?: string }`（默认 `"Hello, this is a test call from GaiaLynk."`）
- 使用 A2A `tasks.run` 向该 Agent 发送一条测试消息，返回输出文本。
- 响应 200: `{ data: { output_text: string } }`
- 401/403/404: 同上
- 502: 调用 Agent 失败（网络/超时/A2A 错误）

### 6. 提交上架审核

- **POST** `/api/v1/agents/:id/submit-review`
- 将 Agent 的 `status` 设为 `active`，审核通过后可通过目录 API（GET /api/v1/agents）查询到。
- 响应 200: `{ data: Agent }`
- 401/403/404: 同上

## 验收条件（T-5.4）

- [x] Agent 注册后可通过目录 API 查询到（审核通过后，即 submit-review 后）
- [x] 健康检查能正确检测 Agent 端点可达性（mock:// 视为 ok；真实端点用 capabilities.list）
- [x] 测试调用可走通完整的 A2A 调用链路（requestAgent）
- [x] 需认证（仅 Provider 角色可调用）
- [x] 自动化测试：`packages/server/tests/t5-4-agent-register-api.test.ts`

## 依赖

- 数据库迁移 `0015_agent_provider_ownership.sql` 需已应用（新增 `agents.owner_id`、`health_check_*` 列）。
- 与 T-5.3 认证 API 配合使用：先 `POST /api/v1/auth/register` 或 `POST /api/v1/auth/login` 取得 `access_token`，再在请求头中携带 `Authorization: Bearer <access_token>`。
