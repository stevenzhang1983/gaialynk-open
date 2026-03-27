# 主线 Epic 交付完成后的「特别说明」集合

> **用途**：记录各阶段（E-1、E-2…）开发收尾时、**未纳入当次交付范围**或**建议后续补齐**的说明，便于运维、产品接力与范围对齐。  
> **依据**：`CTO-V1.3-Execution-Directive-v1.md` 与当次实现差异说明。

---

## E-1｜认证与身份基础设施（V1.3）

**交付完成后特别说明：**

- **运维 / 环境变量**：若需要，可再补一版「运维 / env 示例」文档（例如 `OAUTH_WEBAPP_CALLBACK_URL`、`JWT_SECRET`、数据库连接等），便于部署与联调。
- **API Meta**：`GET /api/v1/meta` 中的 `quickstart_endpoints` **当前未加入** Space、认证相关路由说明；当时**有意未改 meta**，避免超出 E-1 交付范围。若希望官网/控制台与发现页一致，可在后续小版本中把 Space 与 auth 相关入口写进 `quickstart_endpoints` 或单独维护「开发者快速入口」页。

---

## E-2｜Space / 多人协作 / RBAC（V1.3）

**交付完成后特别说明：**

- **与 E-11 的关系**：E-2 交付时矩阵工具已就绪，但连接器/审计/审批等路由级绑定在 **E-11（V1.3.1）** 才全部对齐主线；实现位置见 **§ E-11**。
- **Space 路由内建 RBAC**：邀请、加成员、改设置、归档等仍在 `space.routes.ts` 内联校验，与 E-11 的共享 helper 并存。

---

## E-3｜实时消息推送与 Presence（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0018_message_status_and_presence.sql`（`messages.status`、`space_presence` 表）；`db:reset` 已包含 `space_presence` 截断。
- **WebSocket**：`GET` 升级为 `ws://…/api/v1/realtime/ws`（Query：`token` 或 `access_token`、`conversation_id`、可选 `last_event_id` 补推）；入口仅在 **`packages/server/src/index.ts`** 通过 `@hono/node-ws` 注入，与 `createApp()` 分离。
- **广播**：`publishConversationRealtime`（`conversation-realtime.ts`）= 进程内 SSE 订阅 + WS 扇出；REST 发消息与各路径 `appendMessage` 后均已走该发布。
- **Presence**：`GET /api/v1/spaces/:id/presence`（成员 + `online` / `away` / `offline`）；WS 连接 Space 会话时标 online，断线约 30s 后标 away。实现见 `modules/realtime/presence.store.ts`。
- **消息状态**：成功落库的发送默认为 `delivered`；`sending` / `failed` 的语义与客户端行为见 `packages/server/docs/realtime-client-protocol.md`。
- **测试**：`packages/server/tests/e3-realtime-presence.test.ts`（Presence API、消息 `status`、WS 补推与实时帧）。

**交付完成后特别说明：**

- **PostgreSQL 环境**：上线或本地全量库需执行 `npm run db:migrate` 应用 `0018`，否则 `messages.status` / `space_presence` 不存在会导致读写失败。
- **Vitest 与 WS**：`createApp()` **不会**注册 WS 路由；需要测 WS 时需在同文件内 `createNodeWebSocket({ app })` + `registerRealtimeWebSocketRoutes` + `injectWebSocket(serve 返回的 server)`（与 E-3 测试文件写法一致）。
- **多进程 / 多实例**：**E-12** 起在配置 `REDIS_URL` 时 WS 会话帧（消息、已读、Typing、`presence_update`）经 **Redis `conv:{id}`** 扇出；**SSE** `message-stream` 与无 Redis 环境仍为进程内扇出（SCALE-DEBT 残余见 **§ E-12**）。
- **安全与运维**：WS 无法在标准握手中带 `Authorization`，当前用 **query 传 JWT**；生产建议 **WSS**、短 TTL、并注意代理访问日志可能记录 query（协议文档已提示）。指令中的 **typing indicator** 明确为 **V1.3.1**，本次未实现。
- **`GET /api/v1/meta`**：未新增 realtime / presence 相关 `quickstart_endpoints`；若官网或控制台要一键发现 WS URL，可在后续小版本写入 meta 或独立开发者页。

---

## E-4｜连接器：真实执行层（V1.3 Google Calendar / V1.3.1 Notion）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0019_connector_cloud_saas.sql` — `connector_authorizations` 扩展 `connector_type`（`local` \| `cloud_saas`）、`provider`、`oauth_*_encrypted`、`oauth_expires_at`；新表 `external_action_receipts`、`connector_uploaded_files`。`db:reset` 已纳入 `external_action_receipts`、`connector_uploaded_files` 截断顺序。
- **云代理目录**：`modules/connectors/cloud-proxy/` — `google-calendar.adapter.ts`、`notion.adapter.ts`、`cloud-proxy.router.ts`；在 `createApp()` 末尾通过 `registerCloudProxyRoutes` 挂载。
- **Google Calendar**：OAuth 发起 `GET /api/v1/connectors/cloud/google-calendar/oauth/start`（Bearer；Query `scope_mode=read|write`）；回调 `GET /api/v1/connectors/cloud/oauth/callback/google-calendar`；动作 `POST .../google-calendar/actions/list-events`、`POST .../google-calendar/actions/create-event`（写操作需授权 `scope_value=google_calendar.write`）。可选 `conversation_id` 将摘要 **系统消息** 写回会话并走实时发布。
- **Notion（V1.3.1）**：OAuth 与完整动作 API、401→`connector_expired` 行为见 **§ E-13**；E-4 交付时最小能力为 search，E-13 补齐 list-databases / query / create page 与收据字段约定。
- **令牌与 state**：`token-crypto.ts`（`CONNECTOR_TOKEN_ENCRYPTION_KEY`）、`oauth-state.ts`（`CONNECTOR_OAUTH_STATE_SECRET` 或 `JWT_SECRET`）。**client_secret 仅环境变量**，不暴露给浏览器。
- **外部收据**：每次对外 API 调用写入 `external_action_receipts`；查询 `GET /api/v1/connectors/external-action-receipts/:id`（Bearer + 授权属主校验）。审计事件类型含 `connector.cloud_action.completed` / `connector.cloud_action.failed`。
- **文件上传**：`POST /api/v1/connectors/file-upload`（multipart 字段 `file`）；`GET .../file-upload/:id/excerpt` 供已登录属主取摘录。会话 `POST .../messages` 支持可选 `file_ref_id`，**转发给 Agent 的文本**会附带附件摘录（`buildUploadExcerptForAgentAsync`）。
- **Stub 模式**：`VITEST=true` 或 `CONNECTOR_CLOUD_STUB=1` 或 **Notion 专用** `NOTION_MOCK=true`（见 **§ E-13**）时云连接器网络调用由适配器返回固定数据，便于 CI；生产需配置真实 OAuth 与密钥。

**交付完成后特别说明：**

- **PostgreSQL**：上线务必 `npm run db:migrate` 应用 `0019`；否则 cloud 列与收据/上传表不存在会导致运行失败。
- **运维环境变量（摘要）**：`GOOGLE_OAUTH_CLIENT_ID`、`GOOGLE_OAUTH_CLIENT_SECRET`、`GOOGLE_OAUTH_REDIRECT_URI`；Notion：`NOTION_CLIENT_ID`、`NOTION_CLIENT_SECRET`、`NOTION_OAUTH_REDIRECT_URI`；`CONNECTOR_TOKEN_ENCRYPTION_KEY`（建议 32+ 字符）；可选 `CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL`（OAuth 成功后浏览器重定向）、`CONNECTOR_UPLOAD_DIR`、`CONNECTOR_UPLOAD_MAX_BYTES`、`EXTERNAL_RECEIPT_SECRET`（收据 env 签名盐，生产请显式设置）。
- **scope 映射**：Google 读能力对应授权 `scope_value` `google_calendar.read`，写能力 `google_calendar.write`（与 Calendar API scope 一致由 OAuth `scope_mode` 选择）；Notion 使用 `notion.workspace` 与 `connector=notion`。
- **加密与合规**：OAuth access/refresh 以 AES-256-GCM 落库；**日志与审计 payload 仍应避免记录明文 token**。轮换密钥属 TRUST-DEBT，需另行设计重加密任务。
- **本地执行器**：现有 `POST /api/v1/connectors/local-actions/execute` 与 cloud 路径并存；产品内「撤销授权后再调」对 cloud 返回 `409 authorization_revoked` 或 `401 reauth_required`（令牌失效/刷新失败），与验收「提示重新授权」对齐。
- **`GET /api/v1/meta`**：仍未写入 cloud 连接器入口；控制台若需一键跳转 OAuth，可后续补 meta 或文档链接。

---

## E-5｜多 Agent 编排运行时（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0020_orchestration.sql` — 表 `orchestration_runs`、`orchestration_steps`；`invocations` 增加 `orchestration_run_id`、`orchestration_step_index`（无 FK 至 runs，避免 truncate 环）。`db:reset` 已加入 `orchestration_steps`、`orchestration_runs` 截断顺序。
- **模块**：`packages/server/src/modules/orchestration/` — `intent-router.ts`（关键词排序 + 可选 `OPENAI_API_KEY` / `OPENAI_ORCHESTRATION_MODEL` 拓扑排序）、`orchestration.engine.ts`（顺序执行、Trust、超时暂停、取消 Abort、人审续跑）、`orchestration.store.ts`、`orchestration.schema.ts`、`orchestration.router.ts`。
- **API**（均需 Bearer JWT；带 `space_id` 的会话需 Space 成员且为参与者，否则需为会话参与者）：
  - `POST /api/v1/orchestrations/recommend`
  - `POST /api/v1/orchestrations/execute`（可选 `idempotency_key`，同用户同 key 返回最近一次 run 的 `200` + `idempotent_replay`）
  - `GET /api/v1/orchestrations/:id`
  - `POST /api/v1/orchestrations/:id/cancel`（`actor_id` 须与 JWT 用户一致）
  - `POST /api/v1/orchestrations/:id/steps/:stepIndex/retry`
  - `POST /api/v1/orchestrations/:id/resume`（`retry_after_timeout` / `abandon_run`）
- **Trust 与人审续跑**：步骤 `need_confirmation` 时创建 `invocations` 并写入编排关联字段；`POST /api/v1/invocations/:id/confirm` 成功后在 `app.ts` 中调用 `continueOrchestrationAfterInvocationConfirmAsync`，**同一 run_id** 续跑后续步骤（D-ORC-8）。
- **A2A**：`requestAgent` 支持 `signal` / `timeoutMs`，供编排取消与单步超时。
- **收据**：每成功一步签发 `receiptType: orchestration_step_completed`（payload 含 `run_id_per_step`）。
- **协议说明**：`packages/server/docs/orchestration-runtime-protocol.md`（Run/Step 状态机、审计字段）。
- **测试**：`packages/server/tests/e5-orchestration-runtime.test.ts`（两 mock 顺序完成、高人审链路 + confirm 续跑、人审态 cancel）。

**交付完成后特别说明：**

- **PostgreSQL**：上线需 `npm run db:migrate` 应用 `0020`；否则编排表与 `invocations` 新列不存在会导致失败。
- **D-ORC-4 / D-ORC-6 的「硬」验收**：取消在 `awaiting_human_review` 已覆盖；**执行中**步骤的中断依赖内存 `AbortController` + `cancel_requested` 与 `fetch` abort；多副本下需共享取消信号（SCALE-DEBT）。超时暂停依赖 `A2A_REQUEST_TIMEOUT_MS` 或每 run 的 `step_timeout_ms`；极快 mock Agent 不易稳定测「超时 UI」，建议联调用慢端点或集成环境验收。
- **D-ORC-2 字段映射**：V1.3 仅模板占位 `{{user_message}}` / `{{prev}}`（`prev` 为前一步 `output_json` 的 JSON 字符串）。**V1.3.1（E-14）** 起支持 `input_mapping` / `field_mapping` 将上一步输出 **点路径** 映射为额外 `{{占位符}}`；详见 **§ E-14**。
- **意图路由**：无 `OPENAI_API_KEY` 时为能力关键词启发式 + 最多 3 步；与指令「LLM + 标签」对齐的可调开关为环境变量，非强制联网单测。
- **`GET /api/v1/meta`**：仍未写入 orchestration 端点；若官网/控制台要一键发现，可后续补 meta 或链到本协议文档。

---

## E-6｜Trust Policy 用户面 + 声誉闭环（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **三语 reason_codes 映射**：`@gaialynk/shared`（源码 `packages/shared/src/reason-codes.ts`；官网可同包或经 `reason-codes-user-facing.ts` 再导出）；单测 `reason-codes-i18n.test.ts` 校验每条映射三语非空。网关生命周期码 `agent_maintenance` / `agent_delisted` 见 **§ E-15**。
- **Trust 决策用户面字段**：`evaluateTrustDecision` 返回的 `TrustDecision` 增加必填 `user_facing_message`（由 `reason_codes` 组合生成）；会话发消息、`meta.trust_decision`、审计中的 `trust_decision` JSON 均携带该字段。
- **审批队列摘要**：`GET /api/v1/review-queue` 每条待审项增加 `user_facing_summary`（与 `user_facing_message` 同结构），优先来自 `invocation.pending_confirmation` 审计事件中的 `trust_decision`，否则回退 `payload.reason_codes` / 默认 `trust_review_pending`；解析逻辑见 `modules/trust/invocation-user-facing.ts`。
- **确认与人审理由**：`POST /api/v1/invocations/:id/confirm` 支持可选 `user_decision_reason`（≤500 字符），写入 `invocation.confirmed` 审计 `payload`；`POST /api/v1/review-queue/:id/approve` 与 `POST /api/v1/approvals/:id/confirm` 可透传同一字段（`approvalConfirmSchema` 已扩展）。
- **Agent 信任徽章**：`GET /api/v1/agents/:id` 响应增加 `trust_badge`：`unverified` \| `consumer_ready` \| `high_sensitivity_enhanced`；计算见 `modules/directory/agent-directory.service.ts` 的 `computeTrustBadge`（综合 `status`、身份校验、`agentMaxRiskLevel`；`deprecated` 一律视为 `unverified`）。
- **迁移**：`packages/server/src/infra/db/migrations/0021_trust_reputation_e6.sql` — `agent_run_feedback` 扩展 `usefulness`、`reason_code`；新表 `agent_retest_queue`、`agent_user_reports`。`db:reset` 已加入上述两表截断顺序。
- **声誉闭环**：`modules/feedback/reputation-loop.service.ts` — 结构化反馈在 `usefulness=not_helpful` 且带 `reason_code` 时，滑动窗口内（默认 30 天，条数阈值默认 3，可由 `AGENT_FEEDBACK_RETEST_THRESHOLD`、`AGENT_FEEDBACK_RETEST_WINDOW_DAYS` 覆盖）达到阈值则入队复测并写审计 `trust.reputation.retest_enqueued`；`POST /api/v1/feedback/agent-runs` 可选字段 `usefulness`、`reason_code`，响应 `data.retest_enqueued`。
- **复测队列查询**：`GET /api/v1/trust/retest-queue`（需 `actor_id` 或可信 JWT actor，与 review-queue 相同约定），返回 `pending` 复测项。
- **用户举报与通知**：`POST /api/v1/agents/:id/user-reports` 创建举报；`POST /api/v1/agent-user-reports/:reportId/uphold`（`arbitrator_id` 须 `ops-` 或 `reviewer-` 前缀）将举报标为成立：Agent `status` → `deprecated`，并对近期审计中与该 Agent 相关的用户 `actor_id`（`invocation.pending_confirmation` / `invocation.confirmed` / `invocation.completed`）发送应用内通知 `trust.agent_report.upheld`；实现见 `listDistinctUserActorIdsForAgentAsync`（`audit.store.ts`）。
- **测试**：`packages/server/tests/e6-trust-reputation.test.ts`（用户面、徽章、反馈→复测、举报成立、确认理由）；`trust.engine.test.ts` 覆盖高风险三语文案。

**交付完成后特别说明：**

- **PostgreSQL**：上线需 `npm run db:migrate` 应用 `0021`；否则 `usefulness` / `reason_code` 列及新表不存在会导致反馈与声誉 API 失败。
- **历史用户通知范围**：当前从 **审计事件** 中推断「曾与 Agent 产生调用/待审关系」的用户 ID，**未**扫描全量会话参与者；若需「所有聊过该 Agent 的成员」均通知，需后续接会话参与表或消息审计（可标 `AUDIT-DEBT`）。
- **前端会话卡片**：后端已提供 `user_facing_message` / `user_facing_summary` 三语对象；UI 可按 `Accept-Language` 或用户设置选一条展示，拦截/确认按钮仍由现有 `need_confirmation` 与 review API 驱动。
- **`GET /api/v1/meta`**：仍未写入 trust/retest/report 等新端点；若控制台要一键发现，可后续补 meta 或链到本文档。

---

## E-7｜Agent 调用网关增强：Invocation Context + 池化路由（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0022_agent_gateway_listing_e7.sql`（指令草案曾写 `0021_agent_endpoints_and_listing.sql`，仓库中 `0021` 已由 E-6 占用，故本 Epic 使用 **`0022`**）。`agents` 增加 `max_concurrent`（默认 1）、`queue_behavior`（`queue` \| `fast_fail`）、`timeout_ms`（可空，空则走 `A2A_REQUEST_TIMEOUT_MS` / 请求级 `timeoutMs`）、`supports_scheduled`、`memory_tier`（`none` \| `session` \| `user_isolated`）；新表 `agent_endpoints`（`endpoint_url`、`status` healthy/unhealthy、可选 `last_health_check_at`）。`db:reset` 的 `TRUNCATE` 已包含 `agent_endpoints`（位于 `agents` 之前）。
- **Invocation Context**：`modules/gateway/invocation-context.ts` — 每次非 mock 的 A2A `tasks.run` 请求自动带 HTTP 头 **`X-GaiaLynk-Invocation-Context`**（JSON），字段含 `gaia_user_id`、`conversation_id`、`run_id`、`invocation_source`（当前会话路径为 `session`）、`trace_id`；B 类定时可在同结构体上扩展 `subscription_id` + `invocation_source: "scheduled"`（`sessionInvocationContext` 仅封装 A 类；编排步骤使用 `run_id = orchestration_steps.run_id_per_step`）。`sessionInvocationContext` 供 `app.ts`、编排、`ask`、`Provider test-call` 统一构造。
- **池化与故障转移**：`listHealthyEndpointUrlsForAgentAsync`（`agent-endpoint.store.ts`）— 若该 Agent 无健康 endpoint 行，则回退 **`agents.source_url`**；`pool-router.ts` 对 URL 列表做 **round-robin 起点 + 失败则试下一 URL**。`a2a.gateway.ts` 内 `requestAgent` 在完成 Trust/业务逻辑后走上述列表与 failover。
- **并发与排队**：`invocation-capacity.ts` — **进程内**信号量 + FIFO 等待队列；`max_concurrent` 满且 `queue_behavior=fast_fail` 时抛出 `InvocationCapacityFastFailError`；排队等待随外层 `AbortSignal` 取消时抛出 `InvocationQueueTimeoutError`。与会话 `POST .../messages`、人审确认 `POST .../invocations/:id/confirm` 集成：**429** `invocation_capacity_exceeded`、**504** `invocation_queue_timeout`（单 Agent 路径）；多 `@` Agent 路径将容量事件记入 `failed_agents` 并写审计 `invocation.capacity_denied` / `invocation.queue_timeout`。
- **审计**：`invocation.completed`、`invocation.failed` 等 payload 增加 **`invocation_context`** 对象（与头发送内容一致），便于检索「每次转发附带的上下文」。另见事件类型 `invocation.capacity_denied`、`invocation.queue_timeout`。
- **Provider API**（需 Provider 角色 JWT）：`PATCH /api/v1/agents/:id/gateway-listing`（上架/网关字段）；`GET/POST/DELETE /api/v1/agents/:id/endpoints`（多实例 URL 管理）。`register` 仍写 `source_url` 作为默认唯一端点；额外 URL 仅在有 `agent_endpoints` 行且 `healthy` 时参与池化。
- **测试**：`packages/server/tests/e7-gateway-invocation-context.test.ts`（Context 序列化、并发 gate、pool failover）。

**交付完成后特别说明：**

- **PostgreSQL**：上线需 `npm run db:migrate` 应用 **`0022`**；否则 SELECT 新列 / `agent_endpoints` 会失败。
- **多副本**：并发槽与 round-robin 状态均为 **单机内存**（SCALE-DEBT）；多实例下排队与 RR 不一致，需后续 Redis 或集中式限流。
- **健康度**：endpoint `unhealthy` 仅影响池化选取；**自动将失败 URL 标为 unhealthy** 未在本版持久化（可避免抖动误杀），仅 failover 到下一 URL。
- **least-connections**：规格中的另一策略本版 **未实现**（仅 round-robin + failover）。
- **B 类 `scheduled` + `subscription_id`**：数据模型已支持 `supports_scheduled`；调度器下发调用需自行构造 `InvocationContextPayload`（`invocation_source: "scheduled"`）并接入 `requestAgent`，属后续调度 Epic 接线。
- **`GET /api/v1/meta`**：仍未写入 gateway-listing / endpoints 等新端点；若开发者门户要一键发现，可后续补 meta。

---

## E-8｜通知系统 + 数据保留矩阵（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0023_notifications_e8.sql` — `notification_events` 增加 `notification_type`（`task_completed` \| `review_required` \| `connector_expiring` \| `quota_warning` \| `agent_status_change` \| `legacy_event`）、`deep_link`；`read_at` 沿用 0009；`notification_preferences` 增加 `quiet_hours_start` / `quiet_hours_end` / `quiet_hours_timezone`（`HH:mm` 文本 + 时区名占位）。既有行按 `event_type` 回填类型（如 `trust.agent_report.upheld` → `agent_status_change`）。
- **存储与策略**：`modules/notifications/notification.store.ts` — `recordNotificationEventAsync` 支持 `notification_type`、`deep_link`；若用户偏好 **未** 包含 `in_app` 渠道则**不写入**应用内通知（与「渠道开关」一致）。列表分页 `listNotificationsPagedAsync`（`cursor` + `unread_only`）、`markNotificationReadAsync`、`markAllNotificationsReadAsync`、`countUnreadNotificationsAsync`。旧接口 `GET /api/v1/users/:id/notifications` 仍返回带 `type`、`deep_link` 的条目。
- **通知中心 API（需 Bearer JWT）**：`modules/notifications/notification.router.ts` — `GET /api/v1/notifications`（`limit`、`unread_only`、`cursor`；响应 `data.items`、`data.next_cursor`、`meta.unread_count`）、`POST /api/v1/notifications/:id/read`、`POST /api/v1/notifications/read-all`。在 `createApp()` 末尾 `registerNotificationCenterRoutes` 挂载。
- **触发器**：`notifyReviewRequiredAsync`（`notification-triggers.ts`）— 会话消息与编排路径在 `createPendingInvocationAsync` / 编排 `need_confirmation` 后写入 `review_required` + deep link `/conversations/{cid}/invocations/{iid}/review`。编排步骤成功/失败路径 `notifyOrchestrationStepOutcomeAsync` → `task_completed` + `/conversations/{cid}/orchestrations/{runId}`。`consumeQuotaAsync`（`quota.store.ts`）在用量跨越 **80%** 或耗尽（**100%**）时写 `quota_warning`。Google Calendar OAuth 回调在 access token **剩余 ≤7 天**时写 `connector_expiring`（Notion 回调无 `expires_at` 则跳过）。举报成立批量通知显式 `agent_status_change` + `/directory/agents/{id}`。
- **偏好 API**：`GET/PATCH /api/v1/users/:id/notification-preferences` 扩展读写勿扰字段（**勿扰窗口本期不拦截落库**，供 W-10 / 邮件渠道后续消费；与指令「勿扰时段、渠道开关」数据面一致）。
- **数据保留矩阵草案**：`docs/Data-Retention-Matrix-Draft-v1.md`（§17.3 类目齐全，保留期为 `TBD` 占位，待法务定稿）。
- **测试**：`packages/server/tests/e8-notifications-retention.test.ts`（Bearer 下列表、已读、全部已读、`review_required` + deep link、勿扰字段 PATCH）。

**交付完成后特别说明：**

- **PostgreSQL**：上线需 `npm run db:migrate` 应用 **`0023`**；否则 `notification_type` / `deep_link` / 勿扰列不存在会导致读写失败。
- **Deep link 格式**：为**产品内路由占位字符串**，与 W-8 前端路由对齐前可由控制台自行映射；审批类统一含 `invocations` 与 `review` 段便于联调。
- **配额通知**：`quota.store` 为进程内计数；多实例下阈值通知可能重复或遗漏（SCALE-DEBT），与 E-7 配额语义一致。
- **连接器过期**：仅在 OAuth **回调当时**根据 `expires_at` 判断；运行中 refresh 缩短 TTL 的重复提醒未做去重（可后续按 `authorization_id` + 天级去重）。
- **`GET /api/v1/meta`**：仍未写入通知中心端点；官网 W-8 可后续补 meta 或链到本文档。

---

## E-9｜目录排序与推荐策略（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0024_directory_ranking_e9.sql` — 表 `directory_ranking_config`（单行 `id=default`，`config` JSONB 补丁）、`directory_new_listing_impressions`（新上架槽位展示计数）。`db:reset` 的 `TRUNCATE` 已包含上述表（`directory_new_listing_impressions` 在 `agents` 之前）。
- **策略与排序**：`modules/directory/ranking.service.ts` — 关键词相关性、`trust_badge` tie-breaker（与 E-6 `computeTrustBadge` 一致）、`safeFallbackSortAgents`（字母序 + deprecated 置后）、`buildDiscoverySlots`（热门 / 新手友好 / 低延迟 / 新上架，阈值来自合并后的配置）。
- **指标批量查询**：`modules/directory/ranking-metrics.store.ts` — `audit_events` 聚合声誉等级与近 30 天错误率；新上架展示次数 `listNewListingImpressionsAsync` / `incrementNewListingImpressionsAsync`。
- **可配置阈值**：`modules/directory/directory-ranking-config.store.ts` — `defaultDirectoryRankingConfig()` + 库内补丁深度合并；`GET/PATCH /api/v1/directory-ranking/config`（PATCH 需 Bearer；**生产**须设置 `DIRECTORY_RANKING_ADMIN_USER_IDS` 为可改配置的用户 UUID 列表，**测试** `VITEST=true` 下任意登录用户可 PATCH）。
- **路由**：`modules/directory/directory-ranking.router.ts` — `registerDirectoryRankingRoutes` 在 `createApp()` 中与 Provider 路由一并注册。
- **目录列表**：`GET /api/v1/agents` 在存在 `search` 且未指定 `sort`（或 `sort=relevance_trust:desc`）时启用相关性 + 信任排序；失败时回退安全排序并 `meta.ranking_fallback`；`limit`/`cursor` 在排序后于内存分页。
- **意图推荐**：`GET /api/v1/agents/recommendations` 同分按信任 tie-breaker 排序。
- **空搜运营位**：`GET /api/v1/agents/discovery` 返回 `slots` + `meta`；`?simulate_ranking_failure=1` 用于验证降级非空（联调/测试）。
- **产品文档**：`docs/Directory-Ranking-Policy-v1.md`（R1–R6 与 API 摘要）。
- **测试**：`packages/server/tests/e9-directory-ranking.test.ts`（单元：排序与新手槽位；HTTP：搜索顺序、discovery 降级、配置 PATCH）。

**交付完成后特别说明：**

- **PostgreSQL**：上线需 `npm run db:migrate` 应用 **`0024`**；否则 discovery 展示计数与 admin 配置表不存在会导致相关路径失败（内存/无 PG 开发模式仍可用默认配置与空 impressions）。
- **新手友好槽位默认门槛**：`beginner_friendly.min_reputation_grade` 默认为 **B**，新 Agent 无审计时常为 **C**，槽位可能为空属预期；运营可通过 **PATCH 配置** 或积累评测数据后再验收「有卡片」类 UI。
- **`trust_visibility=all`**：当前仅在 discovery 的 `meta` 中占位；「全部」可见 **unverified** 的语义主要由 **`GET /api/v1/agents`** 列表/搜索承担（`deprecated` 仍建议过滤），与 W-4 前端显式 Tab 对齐时再收紧前后端契约。
- **`GET /api/v1/meta`**：仍未写入 `directory-ranking` / `agents/discovery`；若控制台要一键发现，可后续补 meta。

---

## E-10｜埋点与 Founder 看板（V1.3）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0025_product_events_e10.sql` — 表 `product_events`（`event_name`、`user_id`、`space_id`、`conversation_id`、`payload`、`occurred_at`、`correlation_id`）。`db:reset` 的 `TRUNCATE` 已包含 `product_events`（位于 `invocations` 之前、**`users` 之前**，满足 FK）。
- **事件字典**：`docs/Product-Events-Dictionary-v1.md`（与指令最小事件集对齐；并说明官网漏斗仍走 website Analytics）。
- **模块**：`packages/server/src/modules/product-events/` — `product-events.types.ts`（事件名常量）、`product-events.store.ts`（写入、聚合、CSV 行查询；**插入失败静默吞掉**以免迁移未跑时拖垮注册主路径）、`product-events.emit.ts`（通用 emit、会话创建/首会话、用户消息、`agent.invoked` + `user.first_valuable_reply`）、`product-events.orchestration.ts`（编排起止失败与步骤级 `agent.invoked`）、`product-events.router.ts`（Founder API）。
- **埋点挂接摘要**：
  - `user.registered`：`createUserAsync`（PG）。
  - `conversation.created` / `user.first_conversation`：`POST /api/v1/conversations` 且请求带 Bearer 创建者时。
  - `conversation.message_sent`：`appendMessageAsync` 且 `sender_type === "user"`。
  - `agent.invoked`、`user.first_valuable_reply`：会话单路/多路 `invocation.completed`；`invocations/:id/confirm` 成功（同时为请求者记一次 valuable reply）；编排每步 `requestAgent` 成功。
  - `agent.invoked_multi_step`：编排 `execute` 且步数大于 1 时与 `orchestration.started` 一并记；或同一条消息多 target 且多路成功时记一次。
  - `trust.blocked`：会话路径 Trust `deny`。
  - `trust.confirmed`：确认调用成功。
  - `trust.human_reviewed`：审核队列 `approve`（委派 confirm 成功）与 `deny`。
  - `connector.authorized` / `connector.action_executed`：云 OAuth 回调与各 cloud action 成功路径。
  - `orchestration.started` / `completed` / `failed`：编排路由与引擎终态（含取消、trust/边界/契约失败等）。
- **Founder API（需 Bearer JWT）**：
  - `GET /api/v1/founder-metrics/snapshot?days=7` — 事件总计、关键事件去重用户、主线路漏斗交集（注册 ∩ 首会话 / 首回复 / 连接器 / 多 Agent）。
  - `GET /api/v1/founder-metrics/export.csv` — 窗口内原始事件 UTF-8 BOM CSV。
  - **生产**须设置 `FOUNDER_DASHBOARD_USER_IDS`（逗号分隔用户 UUID）；**测试** `VITEST=true` 下任意登录用户可访问（与目录排序 admin 策略一致）。
- **网站 UI**：`/{locale}/app/founder-metrics` + BFF `GET /api/mainline/founder-metrics/snapshot`、`/export`；`Analytics Dashboard` 页增加指向 Founder 看板的链接。
- **测试**：`packages/server/tests/e10-founder-metrics.test.ts`（有 `DATABASE_URL` 时验注册落库与 snapshot/CSV；无库时跳过依赖 PG 的断言）。

**交付完成后特别说明：**

- **PostgreSQL**：上线务必 `npm run db:migrate` 应用 **`0025`**；否则 Founder 聚合查询可能报错，且「首事件」去重在插入失败时可能重复（插入被静默跳过）。
- **静默失败**：`product_events` 插入采用 try/catch 不冒泡，避免未迁移环境注册 500；**不应依赖此行为代替迁移**。
- **漏斗与官网**：指令中的「官网 CTA → 注册 → …」前半段仍以 **website** `analytics` 与 `/api/analytics/funnel` 为准；Founder 快照中的 `website_funnel` 字段仅作文案指引。
- **`GET /api/v1/meta`**：仍未写入 founder-metrics 端点；若控制台要一键发现，可后续补 meta。

---

## E-11｜RBAC 完整接入 + 身份模型补齐（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0027_rbac_identity_v131.sql` — `users.display_name`；`space_members.invited_by_actor_type`（默认 `human`）。`insertSpaceMemberRowAsync` 支持可选 `invitedByActorType`；个人/团队 Space 首成员写入显式 `'human'`。
- **Actor 类型**：`packages/server/src/infra/identity/actor-context.ts` — `ActorType = "human" | "agent" | "system" | "service"`；`X-Actor-Type` 解析；无类型时网关 actor 默认 `human`；Bearer JWT 注入的 `ActorContext` 带 `actor_type: "human"`。
- **RBAC 工具**：`packages/server/src/modules/spaces/rbac.middleware.ts` — 矩阵增加 `agent_invite_agent` 行；`rbacForbiddenJson` / `rbacReasonCodeForAction` / `forbiddenUnlessSpaceRbac` / `delegatingUserCanAuthorizeAgentInvite`。
- **成员列表 API**：`GET /api/v1/spaces/:id/members` 经 `listSpaceMembersPublicAsync` 返回 `display_name`、`email_masked`（`user.store` 的 `maskEmailForMemberList`）。
- **连接器 `trigger_connector`**：`POST /api/v1/connectors/local-actions/execute` 在提供可解析的 `space_id` 或 `conversation_id→space_id` 时，按授权属主用户校验 Space 角色；云代理 `google-calendar` / `notion` 动作在 body 含 `space_id` 或可从 `conversation_id` 解析到 Space 时校验；`file-upload` 可选 form 字段 `space_id`。
- **审计导出 `export_audit`**：当请求同时带 **Bearer** 与查询参数 **`space_id`** 时，`GET /api/v1/audit-events`、`GET /api/v1/audit/timeline`、`GET /api/v1/a2a/visualization/l3/export` 校验该用户在 Space 内是否为 owner/admin；**无 Bearer 或未带 space_id** 时保持原开放行为（便于 mock/演示）。
- **审批 `approve_high_risk`**：`POST /api/v1/invocations/:id/confirm` 及 `review-queue` 的 approve/deny/ask-more-info/delegate、`POST /api/v1/approvals/:id/reject` 在会话归属 Space 时按 `approver_id` 校验 owner/admin。
- **Agent 代邀请**：`POST /api/v1/conversations/:id/agents` 在可信头 `X-Actor-Type: agent` 且会话有 `space_id` 时要求 body `delegating_user_id`，且该用户须满足 `grant_agent_invite_permission`（当前即 owner/admin）；调用方 Agent 须已是会话参与者；拒绝时写审计 **`agent.invitation_denied_policy`**。
- **测试**：`packages/server/tests/e11-rbac-full-binding.test.ts`（guest 连接器、member 导出、Agent 代邀请审计、成员字段）。

**交付完成后特别说明：**

- **PostgreSQL**：上线务必 `npm run db:migrate` 应用 **`0027`**；否则 `users.display_name`、`space_members.invited_by_actor_type` 及依赖列的 `SELECT/INSERT` 会失败。
- **连接器 RBAC 上下文**：未提供 `space_id` 且 body 中 `conversation_id` 为空或非 Space 会话时，**不**做 `trigger_connector` 的 Space 角色校验（与既有无 Space 会话/演示路径兼容）。
- **审计导出**：生产上若要对匿名导出收紧，需另行产品决策（例如强制 Bearer + space_id 或按会话过滤）；当前实现为「有 Bearer+space_id 才套 RBAC」。
- **ACTOR_TRUST_TOKEN**：Agent 头身份仍依赖环境变量中的 trust token；未配置时仅 JWT 人类路径可用（与 E-1 一致）。
- **`grant_agent_invite_permission` 与成员角色**：当前「可授权代邀请」与 **owner/admin** 角色一致；若未来要对普通 member 发细粒度「代邀请」授权，需新增成员级标志位与 PATCH 契约（本版未加列）。

---

## E-12｜实时增强：已读回执 + Typing + Redis 广播（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0028_read_receipts_v131.sql` — 表 `message_read_receipts`（`PRIMARY KEY (message_id, user_id)`）。`db:reset` 的 `TRUNCATE` 已包含 `message_read_receipts`（位于 `messages` 之前）。
- **Redis 扇出**：`modules/realtime/redis-pubsub.ts` — `fanoutConversationPayload`；有 `REDIS_URL` 时 `PUBLISH conv:{conversation_id}`，进程内 `SUBSCRIBE` 与本地 WS 表驱动（`retain` / `release` 按连接数）；无 Redis 时仅本地 `deliverToLocalWebSockets`。`registerConversationFanoutLocalDelivery` 在 `ws.registry.ts` 加载时挂接，避免仅 `createApp` 的测试丢投递。
- **入口**：`index.ts` 调用 `startConversationRedisSubscriber()`（需先于业务扇出完成初始化时由 `REDIS_URL` 控制）。
- **已读**：`read-receipt.handler.ts` + `read-receipt.store.ts`；WS 上行 `message_read`（见 `realtime-client-protocol.md`）。
- **Typing**：`typing.handler.ts` — `typing_start` / `typing_stop`，10s 空闲自动 `typing_stop`；断线 `disposeTypingForUser`。
- **Presence WS**：Space 会话在 WS 鉴权成功后下行 `presence_update`（`online`）；断线触发原 30s away 逻辑后下行 `away`（`presence.store.ts` 扩展 `scheduleMarkUserAwayInSpace` 第三参 `conversationId`）。
- **并发闸门 Redis 化**：`invocation-capacity.ts` — `INCR`/`DECR` Lua + TTL；`inv:cap:free:{agentId}` `PUBLISH` 唤醒他实例/本机等待队列；无 `REDIS_URL` 时与 E-7 内存行为一致。
- **配额通知去重**：`notification-triggers.ts` — `recordQuotaWarningWithHourlyDedupAsync`（`SET NX` + `EX` 3600）；`quota.store.ts` 消费阈值时改调该 helper。
- **依赖**：根 `package.json` 增加 `ioredis`；单测 `ioredis-mock` + `vi.mock("ioredis")`（见 `e12-realtime-enhanced.test.ts`）。
- **测试**：`packages/server/tests/e12-realtime-enhanced.test.ts`（双 SUB 语义、并发闸门+Redis、配额去重、有 `DATABASE_URL` 时 WS 已读+Typing+假时钟）。

**交付完成后特别说明：**

- **PostgreSQL**：上线务必 `npm run db:migrate` 应用 **`0028`**；否则已读表不存在会导致 `message_read` 路径失败。
- **Redis**：生产/多副本需配置 **`REDIS_URL`**（如 `redis://localhost:6379`）；否则实时扇出、并发闸门计数、配额去重均退化为单机语义（与 E-7/E-8 原 SCALE-DEBT 说明一致）。
- **SSE**：`GET .../messages/stream` 仍不经 Redis；多副本下仅 WS 客户端保证跨实例一致，SSE 消费者属残余 SCALE-DEBT。
- **Typing / 已读**：恶意客户端可滥发上行帧；后续可在网关按用户限流（与指令 W-16 前端展示配合）。
- **`GET /api/v1/meta`**：仍未写入 WS 新事件说明；以 `packages/server/docs/realtime-client-protocol.md` 为准。

---

## E-13｜Notion 连接器端到端（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **适配器**：`packages/server/src/modules/connectors/cloud-proxy/notion.adapter.ts` — OAuth 换票（真实 `api.notion.com/v1/oauth/token`）、`notionSearch`、`notionListDatabases`（Search API + `filter: database`）、`notionQueryDatabase`（`POST /v1/databases/{id}/query`）、`notionCreatePage`（`POST /v1/pages`，`parent.database_id`）；非 2xx 抛出 `NotionProviderError`（含 HTTP 状态与响应片段）。
- **Mock**：`notion.mock.ts` — CI / 无凭证时的确定性桩数据；**桩模式**为 `NOTION_MOCK=true` **或** `CONNECTOR_CLOUD_STUB=1` **或** `VITEST=true`（与指令「CI 显式 `NOTION_MOCK`」兼容：流水线可只设 `NOTION_MOCK=true` 而不依赖 `VITEST` 字符串）。
- **路由**（`cloud-proxy.router.ts`）：
  - OAuth：`GET .../notion/oauth/start`、**别名** `GET .../notion/authorize`；回调 `GET .../oauth/callback/notion`、**别名** `GET .../notion/callback`。
  - 动作：`POST .../notion/actions/search`、`POST .../notion/actions/list-databases`、`POST .../notion/databases/:database_id/query`、`POST .../notion/pages`（均需 Bearer；可选 `conversation_id` / `space_id`，Space 会话走 `trigger_connector` RBAC，与 E-4/E-11 一致）。
- **收据**：每次对外调用写入 `external_action_receipts`；`response_summary` 含 `provider: "notion"`、`status`（`ok` / `connector_expired` / `error`）、`action` 及业务摘要（如 `database_count`、`result_count`、`page_id`）。动作名：`notion.search`、`notion.list_databases`、`notion.database.query`、`notion.page.create`。
- **401 / 撤销**：Notion 返回 **401** 时：吊销该条 `connector_authorizations`（`revoked`）、写失败收据与审计 `connector.cloud_action.failed`（`reason: connector_expired`）、向会话追加系统提示（若带 `conversation_id`）、HTTP **401** + `error.code: connector_expired`（对齐指令「重新授权」产品语义）。
- **测试**：`packages/server/tests/e13-notion-connector.test.ts`（桩下列库/查询/建页与收据、全局 `fetch` 模拟 401 → `connector_expired` + 授权吊销）。

**交付完成后特别说明：**

- **Staging**：需配置 `NOTION_CLIENT_ID`、`NOTION_CLIENT_SECRET`、`NOTION_OAUTH_REDIRECT_URI`；与 Notion Integration 后台回调 URL 完全一致。
- **创建页面**：`properties` 须与目标数据库 schema 一致（Notion 要求至少满足标题等列定义）；桩模式不校验 schema，真实环境错误将走 `provider_error` 与非 401 的 HTTP 状态。
- **无 refresh token**：Notion 集成令牌长期有效但可被用户在 Notion 侧撤销；除 401 外无「刷新令牌」路径（与官方模型一致）。
- **官网 W-17**：连接器设置页与对话收据卡片依赖本 Epic 的 API 与 `response_summary` 字段；实现见官网任务，不在本文件展开。

---

## E-14｜编排产品语义 + B 类定时召回 + 租约调度（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **产品语义文档**：`docs/Orchestration-Product-Semantics-v1.md`（D1–D7 决策表、步骤状态机、审计/收据映射摘要）。
- **迁移**：`packages/server/src/infra/db/migrations/0029_orchestration_enhanced_v131.sql` — `orchestration_steps` 增加 `output_schema`、`input_mapping`、`output_snapshot`、`lease_expires_at`；`orchestration_runs` 增加 `schedule_cron`、`next_run_at` 及调度索引。上线需 `npm run db:migrate`；`db:reset` 不改变截断表集合（仍为 `orchestration_steps` / `orchestration_runs`）。
- **引擎**：`orchestration.engine.ts` — 可选 `output_schema`（JSON Schema **子集**校验，见 `orchestration-json-schema-lite.ts`）失败 → 步骤 `completed_with_warnings` + 系统提示 + **续跑**；`mergeStepInputMapping` / `buildStepUserText`（`orchestration-step-input.ts`）实现步骤间占位符映射；步骤完成写入 `output_snapshot`；A2A 超时（abort）→ 步骤/Run `lease_expired`；B 类执行时 `X-GaiaLynk-Invocation-Context` 使用 `invocation_source: "scheduled"` 与 `subscription_id`（`scheduledInvocationContext`，`invocation-context.ts`）；带 `schedule_cron` 的 Run 在终态 `completed` / `failed` / `partial_completed` 后 **自动回到** `scheduled` 并计算下一 `next_run_at`（`orchestration-cron.ts` + `cron-parser`）。
- **调度器**：`orchestration-scheduler.ts` — `startOrchestrationSchedulerLoop`（默认 60s）在 **`packages/server/src/index.ts`** 启动，条件：`NODE_ENV !== "test"`、`VITEST !== "true"`、且未设 `DISABLE_ORCHESTRATION_SCHEDULER=1`。单轮可测 `runScheduledOrchestrationTickAsync`（claim → 重置步骤 → `executeOrchestrationRunAsync` + `invocationSource: "scheduled"`）。
- **Store**：`claimScheduledRunsDueAsync`、`resetOrchestrationStepsForRunAsync`（PostgreSQL 使用 `FOR UPDATE SKIP LOCKED`）。
- **API**：`POST /api/v1/orchestrations/execute` 可选 `schedule_cron`（合法 5 段表达式）；创建后 `202` 且 **不**立即执行（由调度器触发）。`POST .../cancel` 会清空 `schedule_cron` / `next_run_at`。`POST .../resume` 与步骤 `retry` 支持 `lease_expired`。
- **测试**：`packages/server/tests/e14-orchestration-semantics.test.ts`（软 schema 警告、B 类 tick、租约超时与重试、`partial_completed` 与第一步结果保留）。

**交付完成后特别说明：**

- **与 §E-5 关系**：E-5 描述 V1.3 基线编排；**步骤状态、租约、B 类调度与语义**以本节与 `Orchestration-Product-Semantics-v1.md` 为准。
- **多实例**：调度器为 **进程内轮询**；多副本部署时需单 leader 或外置调度（SCALE-DEBT），避免重复 claim（PG 侧已用 `SKIP LOCKED` 降低碰撞）。
- **`paused_timeout` / `awaiting_user`**：非 abort 类 A2A 错误仍为 `awaiting_user`；仅 **超时/abort** 路径收敛为 `lease_expired`（与语义文档 D4）。

---

## E-15｜Agent 生命周期 + reason_codes 共享包（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0030_agent_lifecycle_v131.sql` — `agents` 增加 `current_version`（默认 `1.0.0`）、`changelog`（JSONB 数组，项含 `version`、`summary`、`breaking`、`created_at`）、`listing_status`（`listed` \| `maintenance` \| `delisted`，默认 `listed`）。上线需 `npm run db:migrate`。
- **共享包**：`packages/shared`（`@gaialynk/shared`）— `src/reason-codes.ts`；根与 `packages/website` 以 `file:` 依赖引用；根 `tsconfig` paths、`vitest.config` alias、`website` `transpilePackages` 已配置。Trust 模块与 `reason-codes-i18n.test.ts` 从共享包导入；官网 `src/lib/product/reason-codes-user-facing.ts` 再导出以保持旧路径可用。
- **Agent store**：`agent.store.ts` — `getAgentListingStatusForGatewayAsync`、`updateAgentVersionByOwnerAsync`（CTO 别名 `updateAgentVersionAsync`）、`setAgentListingStatusByOwnerAsync`、`setMaintenanceModeAsync`（maintenance ↔ listed）；版本/上架状态变更后 **fire-and-forget** 调用 `notifyAgentLifecycleChangeAsync`（`notification-triggers.ts`）。
- **网关**：`a2a.gateway.ts` — `requestAgent` 在 **进入并发闸门前** 读库校验 `listing_status`；**获得执行槽后、发起 A2A 前** 再次校验，使已在队列中的请求在转入维护时可收到 `agent_maintenance`，正在执行的 run 不在中途打断。`AgentDelistedGatewayError` / `AgentMaintenanceGatewayError` 带三语 `user_facing_message`（reason_codes `agent_delisted` / `agent_maintenance`）。
- **HTTP / 审计**：`app.ts` 单 Agent 与多 `@` 路径、人审确认路径 — `agent_delisted` → **403**、`agent_maintenance` → **503**，并写审计 `invocation.denied`（payload 含 `reason_codes` 与 `user_facing_message`）；多路 `failed_agents` 可含 `error_code` / `user_facing_message`。编排 `orchestration.engine.ts` 将上述错误映射为 `agent_delisted` / `agent_maintenance` 写入步骤错误信息。
- **Provider API**：`PATCH /api/v1/agents/:id/version`（body：`version`、`summary`、`breaking?`）；`PATCH /api/v1/agents/:id/listing-status`（body：`listing_status`）。`POST .../test-call` 对网关错误返回结构化 `error.code` 与 `user_facing_message`。
- **通知**：`notifyAgentLifecycleChangeAsync` — 对 **最近 7 天** 在审计中与该 Agent 有过 `invocation.completed` / `pending_confirmation` / `confirmed` 的用户去重发应用内通知，`notification_type: agent_status_change`，`event_type` 前缀 `agent.lifecycle.*`，`deep_link`：`/app/my-agents?agent_id=...`。`notification.store` 的 `inferNotificationType` 已识别 `agent.lifecycle.*`。
- **目录 API**：`GET /api/v1/agents/:id` 响应在 `enriched.agent` 展开中已包含 `current_version`、`changelog`、`listing_status`（与既有 stats 字段并列）。
- **测试**：`packages/server/tests/e15-agent-lifecycle.test.ts`（共享码、网关闸、双段 gate、`parseAgentChangelog`）。

**交付完成后特别说明：**

- **`status` vs `listing_status`**：`status`（`active` / `deprecated` / `pending_review`）仍为信任徽章与审核语义；**网关拒流**以 `listing_status` 为准（`delisted` / `maintenance`）。Provider 可同时维护两套字段。
- **E-16 邮件**：见 **§ E-16**；`agent_status_changed` 等模板在 `recordNotificationEventAsync` 落库后由 `notification-email-dispatch` 异步发送（需 `RESEND_API_KEY`）。
- **npm**：若环境较旧不支持 `workspace:*`，仓库采用根 `file:packages/shared` 与 website `file:../shared` 链接共享包。

---

## E-16｜邮件通知模板（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0031_notification_preferences_v131.sql` — `users.notification_preferences` JSONB（`email_enabled`、`email_types` 六类、`email_locale` zh/en/ja）；`notification_events.notification_type` 扩展 **`space_invitation`**。上线需 `npm run db:migrate`。
- **邮件服务**：`email.service.ts` — Resend HTTP `POST https://api.resend.com/emails`；`RESEND_API_KEY` 未配置时不发邮件；`RESEND_FROM_EMAIL` 可选；失败仅 `console.error`，**不阻塞**应用内通知。
- **HTML 模板**：`packages/server/src/modules/notifications/templates/*.html`（六类：`task_completed`、`human_review_required`、`quota_warning`、`agent_status_changed`、`connector_expired`、`space_invitation`），占位符 `{{title}}` / `{{body}}` / `{{cta_url}}` / `{{cta_label}}`；三语文案由 `email-notification-copy.ts` 按 `email_locale` 选择。
- **分发**：`notification-email-dispatch.ts` — 在 `notification.store.ts` 的 `recordNotificationEventAsync` 成功写入后 `queueMicrotask` 调度；应用内 `notification_type` 与邮件模板 id 映射（如 `review_required` → `human_review_required`，`connector_expiring` → `connector_expired`）。
- **用户偏好**：`user.store.ts` — `getUserNotificationPreferencesJsonAsync` / `patchUserNotificationPreferencesJsonAsync`；内存模式下无 `users` 行时用 `memDetachedEmailPrefs` 存 JSON，避免测试/信任 actor id 丢偏好。
- **API**：`GET/PATCH /api/v1/users/:id/notification-preferences` 合并返回 `email_enabled`、`email_types`、`email_locale`；审计 `settings.notification_preferences_updated` payload 含上述邮件字段。
- **Space 邀请**：`POST /api/v1/spaces/:id/invitations` 可选 body **`invitee_user_id`**（UUID）— 向该已注册用户发应用内 `space_invitation` + 邮件（偏好允许时）；校验非本人、非已是成员。
- **应用内 deep link 拼进邮件 CTA**：`GAIALYNK_APP_BASE_URL`（默认 `https://app.example.com`）+ `/${email_locale}` + 相对 `deep_link`（如 `/app/join-space?token=…`）。
- **测试**：`packages/server/tests/e16-email-notifications.test.ts`（三语 subject 区分、Resend mock、关闭 `quota_warning` 后不发邮件、HTTP 错误不抛回写入路径）。

**交付完成后特别说明：**

- **与 W-19**：官网通知偏好 UI 与本节 API 字段对齐；邮件总开关与按类开关以 `users.notification_preferences` 为准，与既有 `notification_preferences.channels` 中的 `email` **并存**——产品可后续收敛为单一数据源（TRUST-DEBT/产品债）。
- **Resend 域名**：生产需配置发件域验证；开发可用 Resend 提供的测试发件地址。
- **未发邮件场景**：无 API Key、用户关闭 `email_enabled`、该类不在 `email_types`、或应用内通知因 `channels` 不含 `in_app` 未落库时，均不会发邮件（与指令「写入应用内后再发邮件」一致）。

---

## E-17｜收据权限矩阵 + 数据保留矩阵定稿（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **收据 / 调用可见性（CTO V1.3.1-8）**：`packages/server/src/modules/gateway/invocation-receipt-visibility.ts` — `getInvocationWithVisibilityAsync(invocationId, viewerUserId)`。角色解析顺序：`FOUNDER_DASHBOARD_USER_IDS` → **platform_admin**；会话 `space_id` 存在且成员为 **owner/admin** → **space_admin**；`agents.owner_id === viewer` → **developer**（Provider 看自己 Agent 被调记录）；否则仅当 `invocations.requester_id === viewer` → **user**；否则 **无访问权**（API **404**，不泄露存在性）。字段裁剪：`user` 为输入/输出 **摘要**且不返回 `trust_decision`；`developer` 将 `user_text` 固定为 **`[redacted]`**，附 `developer_invocation_stats.count_last_30d`；`space_admin` / `platform_admin` 返回 **全文** `user_text` 与 **pending** 链路上的 `trust_decision`，并从审计/消息补齐 `agent_output_text`（若已有 `invocation.completed`）。
- **HTTP**：`GET /api/v1/invocations/:id` **必须** `Authorization: Bearer`；无 token → **401**；无权限或不存在 → **404**（与 E-17 验收「user 查他人 → 404」一致）。`meta` 无变更；响应 `data` 为 `InvocationReceiptView`（较原裸 `Invocation` 增加 `agent_name`、`space_id`、`visibility_role`、可选 `trust_decision` / `agent_output_text` / `error_detail` / `developer_invocation_stats` 等）。
- **数据保留矩阵正式版**：`docs/Data-Retention-Matrix-v1.md`（草案 `Data-Retention-Matrix-Draft-v1.md` 已标注迁移指向 v1）。类目齐全，数值为 **可运行占位** 并脚注待法务/产品签字。
- **迁移**：`0032_data_retention_archived.sql` — `messages`、`audit_events`、`receipts`、`invocations`、`orchestration_runs`、`external_action_receipts` 增加 `archived`、`archived_at` 及索引。上线需 `npm run db:migrate`。
- **归档作业**：`packages/server/src/modules/data-retention/data-retention.job.ts` — `runDataRetentionArchivalAsync({ dryRun })`；**dry-run** 仅统计将归档条数，`updated_count` 恒为 0；非 dry-run 执行 `UPDATE … SET archived = TRUE, archived_at = NOW()`。TTL 默认见矩阵 v1，可用 `DATA_RETENTION_<TABLE>_DAYS` 覆盖。可选进程内 **24h** 周期：`DATA_RETENTION_JOB_ENABLED=1`（在 `packages/server/src/index.ts` 调用 `startDataRetentionJobLoop`，测试环境不启动）。
- **测试**：`packages/server/tests/e17-receipt-visibility.test.ts`（**需 `DATABASE_URL`**，否则整文件 skip）；覆盖成员 404、Space admin 全文 + trust、Provider developer 输入脱敏（`[redacted]`）、retention dry-run。另：`phase0-api-completeness`、`response-format-consistency` 中 `GET /invocations/:id` 已改为 **注册用户 + Bearer** 以适配 E-17。

**交付完成后特别说明：**

- **读路径未默认过滤 `archived`**：当前列表/会话历史仍以功能正确性为主；若产品要求「归档后对终端不可见」，需在对应查询加 `archived = FALSE`（后续小版本）。
- **帮助中心「数据保存多久」**（供官网 W 系列引用）：可采用摘要话术 — *「消息与调用收据等数据在账户内默认保留约一年（具体以设置与计划为准）；审计类记录可能更长。满保留期后系统会将数据标记为归档，您将无法在应用内查看；彻底删除策略见隐私政策。」* — 细节数字以 `Data-Retention-Matrix-v1.md` 为准更新。
- **与 W-18**：官网收据详情页应对齐本节的角色字段集；主线已提供 BFF/接口侧的权限模型参考（`GET /api/v1/invocations/:id`）。

---

## E-18｜反滥用最小集 + UGC 治理（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **限流**：`packages/server/src/infra/rate-limiter.ts` — Redis 滑动窗口（`ZSET` + Lua）；无 `REDIS_URL` 时回退**进程内** Map（单测与本地无 Redis）。`consumeRateLimitSlots` 用于同一条用户消息触发多 Agent 调用时**一次扣减多槽**。
- **中间件**：`packages/server/src/middleware/rate-limit.middleware.ts` — 挂在 `createApp()` 的 `/api/*`：`POST /api/v1/auth/register` 按 **客户端 IP**（`X-Forwarded-For` 首段 → `CF-Connecting-IP` → `X-Real-IP`）**每小时**上限；`GET /api/v1/agents` 且带非空 **`search`** 时按 **Bearer 用户** 或 **IP** **每分钟**上限。会话发消息在 `POST .../conversations/:id/messages` 解析 body 后调用 `enforceMessagePostRateLimit(sender_id)`（需 `sender_id`）。
- **环境变量覆盖**：`RATE_LIMIT_REGISTER_PER_HOUR`（默认 10）、`RATE_LIMIT_MESSAGE_PER_MIN`（默认 30）、`RATE_LIMIT_DIRECTORY_SEARCH_PER_MIN`（默认 60）、`RATE_LIMIT_INVOCATION_PER_HOUR`（默认 120）。
- **429 响应**：`error.code = rate_limit_exceeded`，`message = 「操作过频，请稍后再试」`，并设 **`Retry-After`**（秒）。
- **Agent 调用小时上限**：在 `app.ts` 中单/多目标调用路径上，在创建 `pending invocation` / `requestAgent` 之前对 `inv:user:hourly:{userId}` 扣槽；编排引擎 `orchestration.engine.ts` 在每步进入执行前亦做同键检查（与并发闸 **E-12** 并存）。
- **UGC**：迁移 **`0033_abuse_ugc_e18.sql`**（指令原稿写 `0032`，与既有 **`0032_data_retention_archived.sql`** 冲突，故顺延为 **0033**）— `messages.content_hidden`、`user_content_reports` 表及 `(message_id, reporter_id)` 唯一约束。
- **API**：`POST /api/v1/messages/:id/report`（`reason`、`detail`）；`POST /api/v1/messages/:id/hide`（Space **owner/admin**；仅 **有 `space_id` 的会话**）。`message-moderation.store.ts`：`reportMessageAsync`、`hideMessageAsync`、`getReportsAsync`。
- **列表与详情掩码**：`listMessagesAsync`、`listMessagesAfterMessageIdAsync`、`getConversationDetail(Async)` 在 `content_hidden` 时将正文替换为 **`[该消息已被管理员隐藏]`**（与 W-21 文案一致）。
- **`db:reset`**：已加入 `user_content_reports` 截断顺序（在 `messages` 之前）。
- **测试**：`packages/server/tests/e18-abuse-ugc.test.ts`（无 `DATABASE_URL` 时整文件或部分用例 skip）；覆盖注册 IP 限流、31 条消息限流、env 覆盖、`user_content_reports` 落库与隐藏后列表占位。

**交付完成后特别说明：**

- **上线**：除 `npm run db:migrate` 应用 **0033** 外，生产建议配置 **`REDIS_URL`**，否则限流仅为**单进程**有效（与 E-12 实时/并发闸一致）。
- **编排与消息双路径**：小时桶共享同一 Redis key 前缀 `inv:user:hourly:{userId}`，极端高频下编排与会话内调用会**互相计入**；若产品要拆分配额，需新增独立 key（可标 `SCALE-DEBT`）。
- **举报范围**：仅 **`sender_type = user`**、会话内 **≥2 名人类参与者**、且举报者为参与者；已 `content_hidden` 的不可再举报。

---

## E-19｜轻量桌面 Connector——运行时与通信协议（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **Tauri 2 包**：`packages/connector/` — `src-tauri/`（Rust）+ Vite/TS 极简 UI（配对码、主网 URL、本机 API 基址、挂载目录 ≤5）。
- **Rust 模块**：`fs_ops.rs`（挂载根内 `canonicalize` + 前缀校验、读上限 10MB、写需确认头）、`pairing.rs`（6 位数字配对码、`pair-status` 轮询、`desktop/receipts` 的 HMAC 签名体）、`local_server.rs`（`127.0.0.1:0` 随机端口、Axum 路由）、`config.rs`（`ProjectDirs` 配置落盘，无目录时回退临时目录）。
- **本机 HTTP**：`GET /fs/list`、`GET /fs/read`、`POST /fs/write`（`X-Gaialynk-Confirmed: true`）、`GET /fs/watch`（SSE + notify；连接级 watcher 线程为 TRUST-DEBT/SCALE-DEBT，见威胁模型）。
- **主网契约文档**：`packages/connector/PROTOCOL.md`（与 **E-20** 服务端实现需字段级一致）。
- **威胁模型**：`docs/Desktop-Connector-Threat-Model-v1.md`（本机恶意软件、误授权、更新劫持、path traversal、收据伪造）。
- **测试**：`pairing` / `fs_ops` 的 `cargo test`；仓库根 Vitest `packages/connector/tests/protocol-contract.test.ts` 校验协议文档关键段落。
- **脚本**：根目录 `dev:connector`、`build:connector`、`test:connector:rust`。
- **生产构建与打包（已在本机验证）**：`packages/connector` 下 `npm run build`（Vite）+ `npm run tauri:build`（`beforeBuildCommand` 会再跑一遍 Vite）可走通；**release** 二进制与 **macOS** `bundle` 需完整图标集。曾出现 `Failed to create app icon: No matching IconType`，已通过 `npx tauri icon src-tauri/icons/1024x1024.png` 生成 `icon.icns`、`icon.ico`、`128x128@2x.png` 等，并将 `tauri.conf.json` 的 `bundle.icon` 配为含上述条目后，可产出 **`.app`** 与 **`.dmg`**（默认路径：`src-tauri/target/release/bundle/macos/`、`bundle/dmg/`；若设置了 `CARGO_TARGET_DIR` 则以终端提示为准）。
- **构建脚本与 IDE 环境**：部分环境会注入 **`CI=1`**，导致旧版 CLI 对 `--ci` 解析失败；`packages/connector/package.json` 中 **`tauri:build`** 已用 `bash -c 'unset CI; exec tauri build'` 规避。`packages/connector/README.md` 已补充打包路径、`CI` 说明与 `tauri icon` 再生图标的步骤。

**交付完成后特别说明：**

- **Rust / Cargo**：本机需 **rustup** 安装 stable 工具链（示例：`rustc` / `cargo` 1.94.x）；建议在 `~/.zshrc` 中 `source` **`$HOME/.cargo/env`**（或与 `~/.profile` 保持一致），以便新开终端即可使用 `cargo`。无 Rust 的 CI 可仅跑 Vitest 协议用例，或将 Connector 构建列为**独立 job**并缓存 `~/.cargo`。
- **图形界面烟测**：建议在 `packages/connector` 执行 **`npm run tauri:dev`**，确认窗口、托盘菜单与挂载流程；主网 API 未就绪时配对轮询失败为预期行为。
- **与 E-20 的边界**：主线已实现配对/收据/执行下发与 WS（见 **§ E-20**）。Connector（E-19）侧仍需对接 **`GET .../desktop/ws`** 接收 `desktop_execute` 并在本机执行后调用 **`POST .../execute-result`**（当前以轮询配对 + 本机 HTTP 为主，主网 WS 客户端可后续迭代）。
- **与 W-22**：设置页配对 UI、下载入口依赖 E-20 API 与 GitHub Releases 配置；本机 `allowed_web_origins` 默认含 `localhost:3000` / `127.0.0.1:3000` 与 Vite `1420`，上线 Web  origin 需在配置或后续版本中扩展。
- **自动更新**：当前未启用 `tauri-plugin-updater`；威胁模型要求上线前配置 minisign 公钥与更新端点，并完成「篡改包拒装」验收。
- **体积小于 15MB**：需在 `release` 构建上配合 strip、可选 UPX，并对各目标三元组实测（指令验收项）。
- **收据 `path_hash`**：为路径字符串 SHA-256（hex），非文件内容哈希；与隐私表述一致。
- **图标与 Git**：执行 `tauri icon` 后 `src-tauri/icons/` 会新增多组平台资源文件；团队需约定是否全部入库，但 **`bundle.icon` 所列** `icns` / `ico` / PNG 须纳入版本控制或能从 CI 再生，否则 `tauri:build` 仍会失败。

---

## E-20｜桌面 Connector 主网集成：配对 API + 收据 + 审计（V1.3.1）

**已实现要点（便于对齐验收与代码位置）：**

- **迁移**：`packages/server/src/infra/db/migrations/0034_desktop_connector_v131.sql` — 表 `connector_desktop_devices`；`external_action_receipts.connector_authorization_id` 改为可空；`external_action_receipts.device_id`（FK → `connector_desktop_devices`）；约束 `external_action_receipts_source_chk`（云收据仅 `authorization_id`、桌面收据仅 `device_id`）。**说明**：CTO 指令原文写 `0033_desktop_connector`，与既有 **`0033_abuse_ugc_e18.sql`** 冲突，本仓库顺延为 **`0034`**。
- **路由**：`modules/connectors/desktop/desktop-connector.router.ts` — `registerDesktopConnectorRoutes` 在 `createApp()` 中与云代理路由一并注册。
  - `GET /api/v1/connectors/desktop/pair-status?pairing_code=`（无需 Bearer；Connector 轮询）
  - `POST /api/v1/connectors/desktop/pair`（用户 JWT；登记 `pending_pair` 设备）
  - `GET /api/v1/connectors/desktop/devices`、`DELETE /api/v1/connectors/desktop/devices/:id`
  - `POST /api/v1/connectors/desktop/receipts`（**设备 JWT**；HMAC 与 `packages/connector/PROTOCOL.md` / Rust `ReceiptSignEnvelope` 字段序一致）
  - `POST /api/v1/connectors/desktop/execute`（用户 JWT；`file_write` + `write_targets_new_path_prefix` 走 Trust `need_confirmation` → `POST .../write-challenges/:challengeId/confirm` 换取 `write_confirmation_token` 后再执行）
  - `POST /api/v1/connectors/desktop/execute-result`（设备 JWT）、`GET /api/v1/connectors/desktop/execute/:requestId/result`（用户 JWT）
- **设备 JWT**：`modules/auth/jwt.ts` — `signDesktopDeviceToken` / `verifyDesktopDeviceToken`（`token_use: desktop_device`，90 天 TTL）。
- **WS**：`GET /api/v1/connectors/desktop/ws?device_token=` — `desktop-ws.gateway.ts`；`index.ts` 与 realtime WS 同栈 `createNodeWebSocket` 注册。下行帧含 `desktop_connected`、**`desktop_execute`**（与 E-12 一致经 Redis `desktopu:{userId}` 扇出，无 `REDIS_URL` 时进程内投递）。
- **Redis**：`redis-pubsub.ts` — `fanoutDesktopUserPayload` / `retainDesktopUserRedisChannel` / `releaseDesktopUserRedisChannel`；`resetConversationChannelSubscriptionState` 同时清理 `conv:` 与 `desktopu:` 订阅 refcount。
- **Trust**：`trust.engine.ts` — `evaluateDesktopConnectorFileTrust`；共享包 `reason-codes.ts` 增加 `desktop_*` 三语文案。
- **执行态内存**：`desktop-execute.runtime.ts`（任务表、写确认 challenge）；`resetAllStores` 调用 `resetDesktopWebSocketRegistry` + `resetDesktopExecuteRuntime`。
- **云收据读取**：`cloud-proxy.router.ts` `GET .../external-action-receipts/:id` 在 `device_id` 路径下按设备属主校验（与桌面收据 XOR 模型一致）。
- **`db:reset`**：`reset.ts` 在 `external_action_receipts` 之后增加 `connector_desktop_devices`（先清子表收据再清设备）。
- **测试**：`packages/server/tests/e20-desktop-connector.test.ts`（需 **`DATABASE_URL`** 且库已 `npm run db:migrate` 含 **0034**）；无库时 PG 用例整体 skip，仅跑配对 hash 单测。

**交付完成后特别说明：**

- **PostgreSQL**：上线务必 `npm run db:migrate` 应用 **0034**；否则桌面设备表与 `external_action_receipts` 新列/约束不存在会导致配对与收据失败。
- **运维环境变量**：`DESKTOP_CONNECTOR_PAIRING_SECRET`（≥16 字符，配对码 HMAC；与 CTO 清单一致）；未设时 **测试**下使用固定测试密钥，**生产**须显式配置。
- **Connector 契约**：收据签名体与 **`packages/connector/PROTOCOL.md`** 一致；若改字段序须同步改 Rust `pairing.rs` 与主线 `buildReceiptSignJson`。
- **W-22**：设置页配对/设备列表/解绑应对齐上述 REST；桌面 WS 由 Connector 客户端后续接入（E-19 已具备本机 HTTP，主网 WS 为执行下发通道）。
- **多实例**：`desktop-execute.runtime` 为**进程内** Map；多副本下执行结果待命中 Redis/DB（SCALE-DEBT，与编排调度类似）。

---

## 修订记录

| 日期       | 说明 |
|------------|------|
| 2026-03-24 | 增补 **E-20** 桌面 Connector 主网：`0034`、`desktop-connector.router`、设备 JWT、收据 HMAC+`external_action_receipts.device_id`、`desktopu:` Redis + `desktop/ws`、`trust.engine` 桌面写策略、`e20-desktop-connector` 单测；说明与指令 **0033 文件名冲突**故迁移为 **0034** |
| 2026-03-24 | 修订 **§E-19**：补充 **Vite + `tauri:build`** 全量验证、`tauri icon` 与 `bundle.icon`（`icns`/`ico`/PNG）修复 **`No matching IconType`**、`tauri:build` 对 **`CI=1`** 的规避、产物路径与 `README`；Rust 环境（`rustup`、`~/.cargo/env` / zsh）说明 |
| 2026-03-24 | 增补 **E-19** 桌面 Connector：`packages/connector`（Tauri 2 + 回环 HTTP + 配对轮询 + 收据 HMAC）、`PROTOCOL.md`、`Desktop-Connector-Threat-Model-v1.md`、Vitest 协议用例与根脚本；说明与 **E-20/W-22** 边界及 updater 待启用 |
| 2026-03-24 | 增补 **E-18** 限流（`rate-limiter`、`rate-limit.middleware`、消息/调用扣槽）、**0033** UGC 表与 `content_hidden`、moderation 路由、`e18-abuse-ugc` 单测；说明与指令 **0032 文件名**冲突及迁移顺延 |
| 2026-03-24 | 增补 **E-17** 收据可见性（`invocation-receipt-visibility`、`GET /invocations/:id` Bearer）、`0032` 归档列、`data-retention.job` + dry-run、`Data-Retention-Matrix-v1.md`、`e17-receipt-visibility` 单测；同步 `phase0` / `response-format` 单测 |
| 2026-03-24 | 增补 **E-16** 邮件模板：`0031`、Resend、`templates/*`、`notification-email-dispatch`、`users.notification_preferences` API、Space `invitee_user_id`、`e16-email-notifications` 单测；更新 §E-15 与 W-19 对齐说明 |
| 2026-03-24 | 增补 **E-15** Agent 生命周期：`0030`、`listing_status` + version/changelog、共享包 `@gaialynk/shared`、`a2a.gateway` 双段闸、Provider PATCH、通知 `agent.lifecycle.*`、`e15-agent-lifecycle` 单测；修订 §E-6 reason_codes 路径说明 |
| 2026-03-24 | 增补 **E-14** 编排语义文档、`0029`、schema 软校验 / `input_mapping` / `lease_expired`、B 类 `schedule_cron` + `orchestration-scheduler`、`scheduledInvocationContext`、`e14-orchestration-semantics` 单测 |
| 2026-03-24 | 增补 **E-13** Notion 端到端：`notion.adapter` / `notion.mock`、OAuth 别名路由、list-databases / query / pages、收据字段、`connector_expired` 与 `e13-notion-connector` 单测 |
| 2026-03-24 | 增补 E-12 已读/Typing/Redis 扇出、`0028`、`invocation-capacity` Redis 与配额 `SET NX` 去重、`e12-realtime-enhanced` 单测；修订 §E-3 多实例说明与协议文档 E-12 段落 |
| 2026-03-24 | 增补 E-11 RBAC 全挂载、actor_type、成员展示字段、Agent 代邀请与 `0027` 迁移、`e11-rbac-full-binding` 单测 |
| 2026-03-23 | 初版：收录 E-1、E-2 交付收尾特别说明 |
| 2026-03-23 | 增补 E-3 实时推送与 Presence：实现要点、运维/测试/扩展与安全特别说明 |
| 2026-03-23 | 增补 E-4 云连接器（Google Calendar + Notion）、外部收据、文件上传与消息 `file_ref_id`：实现要点与运维/安全特别说明 |
| 2026-03-23 | 增补 E-5 多 Agent 编排运行时：迁移、API、Trust/Invocation 续跑、协议文档、测试与范围/运维特别说明 |
| 2026-03-23 | 增补 E-6 Trust 用户面（三语映射、`user_facing_message` / review-queue 摘要、确认理由、trust_badge）、声誉复测队列与用户举报成立通知：迁移、API、审计与范围说明 |
| 2026-03-23 | 增补 E-7 调用网关：`0022` 上架字段与 `agent_endpoints`、`X-GaiaLynk-Invocation-Context`、池化 failover、进程内排队/429/504、Provider gateway-listing 与 endpoints API、审计 `invocation_context` 与单测 |
| 2026-03-23 | 增补 E-8 通知中心：`0023` 类型与 deep link、Bearer 下 `/api/v1/notifications` 与已读 API、审批/编排/配额/连接器/举报触发器、偏好勿扰字段、数据保留矩阵草案与 `e8-notifications-retention` 单测 |
| 2026-03-23 | 增补 E-9 目录排序与推荐：`0024`、ranking.service、discovery 运营位、目录搜索默认相关性+信任、recommendations tie-breaker、admin 配置 API、`Directory-Ranking-Policy-v1.md` 与 `e9-directory-ranking` 单测；顺带修正 e8 通知单测 items 类型含 `id` 以满足 `tsc` |
| 2026-03-23 | 增补 E-10 埋点与 Founder 看板：`0025` `product_events`、全链路 emit、Founder snapshot/CSV API、`FOUNDER_DASHBOARD_USER_IDS`、网站 `/app/founder-metrics` 与 BFF、`Product-Events-Dictionary-v1.md`、`e10-founder-metrics` 单测 |
