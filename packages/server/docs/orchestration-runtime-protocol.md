# 编排运行时协议（E-5 V1.3）

## 资源

- `POST /api/v1/orchestrations/recommend`：意图路由，返回建议的线性拓扑（每步 `agent_id`、`expected_input`、`expected_output`）。
- `POST /api/v1/orchestrations/execute`：确认拓扑并启动顺序执行（`202` + `run`）。
- `GET /api/v1/orchestrations/:id`：运行状态与各 `step` 进度。
- `POST /api/v1/orchestrations/:id/cancel`：取消（`cancel_requested` + 中断信号；排队步骤不再执行）。
- `POST /api/v1/orchestrations/:id/steps/:stepIndex/retry`：重试失败或超时暂停的步骤（**新** `run_id_per_step`，D-ORC-5）。
- `POST /api/v1/orchestrations/:id/resume`：`retry_after_timeout`（从 `current_step` 续跑）或 `abandon_run`（放弃）。

所有路由需 **Bearer JWT**；Space 会话需为 Space 成员且为会话参与者。

## Run 状态机

| status | 含义 |
|--------|------|
| `running` | 正在顺序执行 |
| `awaiting_human_review` | Trust `need_confirmation`，已创建 `invocations` 待确认；计时语义上视为暂停（D-ORC-8） |
| `awaiting_user` | A2A 失败等非 Trust 暂停 |
| `paused_timeout` | 单步超时（D-ORC-4） |
| `completed` | 全部步骤成功 |
| `partial_completed` | 中途失败，已完成步骤保留（D-ORC-3） |
| `failed` | 首步即失败且无可用结果 |
| `canceled` | 用户取消（D-ORC-6） |

## Step 状态机

`pending` → `running` → `completed` | `failed` | `awaiting_user` | `awaiting_human_review`

- **D-ORC-1**：步骤完成 = A2A 返回终态 + `expected_output.required_fields` 在服务端映射为结构化字段后校验（V1.3 对纯文本响应校验非空 `text`）。
- **D-ORC-2**：步骤间输入由模板占位符 `{{user_message}}`、`{{prev}}`（前一步 `output_json` 的 JSON 字符串）拼装，用户不可编辑中间稿。
- **D-ORC-8**：进入 `awaiting_human_review` 时 Run 同步为该状态；用户 `POST /api/v1/invocations/:id/confirm` 通过后 **同一 `run_id`** 续跑后续步骤。

## 审计与幂等

- 每步独立 **`run_id_per_step`**（UUID），写入 `orchestration_steps` 与审计 `payload`，重试时轮换新值。
- 审计事件示例：`orchestration.trust.evaluated`、`orchestration.step.completed`、`orchestration.run.awaiting_human_review`、`orchestration.run.completed`、`orchestration.run.canceled`。
- `execute` 可选 `idempotency_key`：同一 `user_id` + key 返回 **最近一次** 运行快照（含已终态），`200` + `idempotent_replay`，用于客户端安全重试、不产生第二条 run。

## 与 Trust / Invocation

- 每步使用 `evaluateTrustDecision`；`need_confirmation` 时创建 `invocations` 并写入 `orchestration_run_id`、`orchestration_step_index`，确认后由编排引擎续跑。
