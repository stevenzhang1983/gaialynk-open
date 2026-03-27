# 产品事件字典（E-10 V1.3）

> 与 `CTO-V1.3-Execution-Directive-v1.md` §E-10 对齐的最小事件集；事件写入 PostgreSQL 表 `product_events`，供 Founder 看板与 CSV 导出。

## 事件一览

| 事件名 | 说明 | 主要触发位置 |
|--------|------|----------------|
| `user.registered` | 新用户注册成功 | `createUserAsync`（含邮箱注册与 OAuth 创建用户） |
| `user.first_conversation` | 用户首次创建会话（每用户仅一次） | `POST /api/v1/conversations` 且已 Bearer 登录 |
| `user.first_valuable_reply` | 用户首次获得 Agent 成功回复（每用户仅一次） | 会话路径 `invocation.completed`、确认后完成、编排步骤 `requestAgent` 成功 |
| `conversation.created` | 创建会话 | 同上（需登录创建者） |
| `conversation.message_sent` | 用户发送消息 | `appendMessageAsync` 且 `sender_type = user` |
| `agent.invoked` | 一次 Agent 调用成功（A2A 返回写入会话或编排步骤） | 多路/单路会话完成、编排每步成功 |
| `agent.invoked_multi_step` | 多 Agent 编排（步数大于 1）或同一条用户消息多 `@` 且多路成功 | `orchestrations/execute` 启动；会话多 target 完成 |
| `trust.blocked` | Trust 策略拒绝（非 `need_confirmation`） | 会话调用 trust `deny` |
| `trust.confirmed` | 用户确认高风险/待审调用并执行成功 | `POST /api/v1/invocations/:id/confirm` 成功 |
| `trust.human_reviewed` | 审核队列批准或拒绝 | `review-queue/.../approve` 成功委派 confirm；`.../deny` |
| `connector.authorized` | 云连接器 OAuth 授权落库成功 | Google Calendar / Notion 回调 |
| `connector.action_executed` | 云连接器对外动作成功 | list-events、create-event、notion search 成功路径 |
| `orchestration.started` | 编排运行开始 | `POST /api/v1/orchestrations/execute` 新建 run |
| `orchestration.completed` | 编排正常结束 | 编排引擎 `finishRun(..., completed)` |
| `orchestration.failed` | 编排失败/部分失败/取消等终态 | trust 拒绝、边界拒绝、契约失败、取消、Agent 不存在等 |

## 漏斗（与官网的关系）

- **官网 CTA → 注册 → …**：曝光与转化仍由 `packages/website` 的 Analytics（`page_view`、`cta_click`、`consumer_*` 等）与 `GET /api/analytics/funnel` 承载。
- **注册之后的主线路**：本表事件 + `GET /api/v1/founder-metrics/snapshot` 中的 `funnel` 字段（窗口内去重用户交集）。

## API 与 UI

- `GET /api/v1/founder-metrics/snapshot?days=7`：JSON 快照（需 Bearer；生产需 `FOUNDER_DASHBOARD_USER_IDS`）。
- `GET /api/v1/founder-metrics/export.csv`：原始事件 CSV（UTF-8 BOM）。
- 网站内只读页：`/{locale}/app/founder-metrics`（经 BFF `/api/mainline/founder-metrics/*` 转发）。

## 运维

- 迁移：`0025_product_events_e10.sql`；`db:reset` 已包含 `product_events` 截断。
- 测试环境：`VITEST=true` 时任意登录用户可访问 Founder API（与目录排序 admin 策略一致）。
