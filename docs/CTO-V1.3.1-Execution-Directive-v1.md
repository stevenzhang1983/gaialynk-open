# GaiaLynk V1.3.1 执行指令 v1

> **签发人**：CTO  
> **签发日期**：2026-03-24  
> **执行团队**：主线开发团队、官网开发团队  
> **依据文档**：`CTO-V1.3-Release-Acceptance-Report-v1.md`（验收报告）、`CTO-V1.3-Execution-Directive-v1.md` §7（V1.3.1 待补清单）、`CTO-V1.3-Product-and-Web-Release-Spec-Supplement-v1.md` §15–§17（产品语义补缺）  
> **性质**：**指令文档，各团队按序执行，完成后逐项向 CTO 报告验收**

---

## 0. 阅读须知

### 0.1 文档定位

本文档是 V1.3.1 的 **唯一执行权威**。它将 V1.3 验收报告中识别的差异（GAP-1~5）、技术债（SCALE-DEBT）、V1.3 指令 §7 的 12 项待补清单、以及补充规格 §17 的 4 个产品语义缺口，翻译为 **可按序执行、可逐项验收** 的 Epic/Task 清单。

### 0.2 阅读规则

- 标记 `[主线]` 的任务由主线开发团队执行，标记 `[官网]` 的由官网开发团队执行，标记 `[协同]` 的需两个团队配合。
- 每个任务包含：**做什么**、**怎么做**、**交付物**、**验收条件**、**依赖项**。
- V1.3.1 完成后与 V1.3 **统一执行** 发布前运维/部署清单（见本文 §8），不单独发布。

### 0.3 V1.3.1 目标与范围

| 目标 | 说明 |
|------|------|
| **补齐 V1.3 验收差异** | GAP-1~5 全部闭合 |
| **消解关键 SCALE-DEBT** | 并发闸门、WS 广播、配额去重迁移至 Redis |
| **真实多人体验** | 已读回执 + Typing + WS 通道官网接入 |
| **第二连接器** | Notion 端到端 |
| **编排完整度** | B 类定时召回 + 租约调度 + 产品语义定稿 |
| **合规与安全** | 反滥用最小集 + Cookie/同意横幅 + 数据保留矩阵 |
| **感知可信** | 收据权限矩阵 + Agent 生命周期 + 邮件通知 |
| **轻量桌面 Connector** | 安装 → 绑定工作区 → Web 触发本机文件操作 → 审计/收据（主规格 §1.1 B.4） |

### 0.4 明确不纳入 V1.3.1

- 企业 SSO
- M5 子网互联工程交付
- M7 硬件/物理世界工程交付
- 完整编排 DSL / 可视化编排
- IM 桥、白标、TEE

---

## 1. V1.3.1 需求溯源矩阵

> 每条需求均标注来源，确保可追溯。

| 来源 | 编号 | 内容 | 对应 Epic |
|------|------|------|----------|
| V1.3 验收 GAP-1 | `actor_type` enum 缺失 | 主线 E-11 |
| V1.3 验收 GAP-2 | RBAC 矩阵未全部挂到业务路由 | 主线 E-11、官网 W-15 |
| V1.3 验收 GAP-3 | 连接器 CI 需真实 OAuth | 主线 E-13（staging 验证） |
| V1.3 验收 GAP-4 | 成员列表仅展示 `user_id` | 主线 E-11、官网 W-15 |
| V1.3 验收 GAP-5 | 官网未接入 WS 通道 | 官网 W-16 |
| V1.3.1-1 | Notion 连接器端到端 | 主线 E-13 |
| V1.3.1-3 | B 类定时召回完整版 | 主线 E-14 |
| V1.3.1-4 | 已读回执 | 主线 E-12、官网 W-16 |
| V1.3.1-5 | Typing indicator | 主线 E-12、官网 W-16 |
| V1.3.1-6 | 租约调度模式 | 主线 E-14 |
| V1.3.1-7 | 邮件通知模板 | 主线 E-16、官网 W-19 |
| V1.3.1-8 | 收据用户可见完整字段权限矩阵 | 主线 E-17、官网 W-18 |
| V1.3.1-9 | Agent 版本/更新 UX | 主线 E-15、官网 W-18 |
| V1.3.1-10 | 完整反滥用策略 | 主线 E-18 |
| V1.3.1-11 | UGC 治理 | 主线 E-18 |
| V1.3.1-12 | Cookie/同意横幅合规 | 官网 W-19 |
| 补充 §17.1 | 编排产品语义定稿 | 主线 E-14 |
| 补充 §17.2 | Agent 拉 Agent 授权链 | 主线 E-11（RBAC 扩展行） |
| 补充 §17.3 | 数据保留矩阵 | 主线 E-17 |
| SCALE-DEBT | 并发闸门/WS 广播/配额去重 Redis 化 | 主线 E-12 |
| SCALE-DEBT | reason_codes 前后端共享 | 协同 E-15 + W-18 |
| V1.3.1-2 | 轻量桌面 Connector | 主线 E-19 + E-20、官网 W-22 |
| 主规格 §1.1 B.4 | Connector 安装→配对→目录挂载→本机执行→审计 | 主线 E-19 + E-20 |
| 主规格 §1.1 C.3 | Connector 端到端验收路径 | 协同 E-19 + E-20 + W-22 |

---

## 2. 主线开发团队 Epic（E-11 ~ E-20）

---

### E-11 `[主线]` RBAC 完整接入 + 身份模型补齐

**来源**：GAP-1、GAP-2、GAP-4、补充 §17.2（A1–A6）

#### 做什么

1. 在 `actor-context.ts` 增加 `actor_type` 显式枚举：`human | agent | system | service`
2. 将 `rbac.middleware.ts` 中角色矩阵的每一行（`invite_member`、`add_agent`、`trigger_connector`、`approve_trust`、`export_audit`、`grant_agent_invite`）**全部挂到对应业务路由的中间件**
3. 扩展 `space.store.ts` / `user.store.ts`，支持查询成员 `display_name` 和 `email`（脱敏版），供成员列表 API 返回
4. 在 RBAC 矩阵增加 `agent_invite_agent` 行——当 `actor_type === 'agent'` 时，须校验 `delegating_user_id` 对应用户是否拥有 `grant_agent_invite` 权限

#### 怎么做

- **迁移 0027**：`ALTER TABLE users ADD COLUMN display_name TEXT`；`ALTER TABLE space_members ADD COLUMN invited_by_actor_type TEXT DEFAULT 'human'`
- **actor-context.ts**：增加 `ActorType` 枚举并强类型约束 `ActorContext.actor_type`
- **rbac.middleware.ts**：为每条权限导出独立中间件函数（如 `requireTriggerConnector`、`requireExportAudit`），路由层直接 `.use()`
- **space.routes.ts / connector.store.ts / audit.store.ts**：在对应 POST/GET 路由前插入 RBAC 中间件
- **成员列表 API**：`GET /api/v1/spaces/:id/members` 返回增加 `display_name`、`email_masked`（仅展示前 2 字符 + `***` + 域名）

#### 交付物

| 产物 | 路径 |
|------|------|
| 迁移文件 | `packages/server/src/infra/db/migrations/0027_rbac_identity_v131.sql` |
| actor_type 枚举 | `packages/server/src/infra/identity/actor-context.ts` |
| RBAC 中间件挂载 | 各业务路由文件 |
| 成员信息扩展 | `space.store.ts`、`user.store.ts` |
| 测试 | `packages/server/tests/e11-rbac-full-binding.test.ts` |

#### 验收条件

- [ ] `guest` 角色请求 `trigger_connector` → 403 + `reason_code` 人话
- [ ] `member` 角色请求 `export_audit` → 403
- [ ] Agent 类型 actor 发起 `agent_invite_agent` 但 `delegating_user_id` 无 `grant_agent_invite` → 403 + 审计事件 `agent.invitation_denied_policy`
- [ ] 成员列表 API 返回 `display_name` 和 `email_masked`
- [ ] `actor_type` 枚举在 TypeScript 层为 `string literal union`，任何新增类型须编译期可发现

#### 依赖项

- 无前置依赖，可立即启动

---

### E-12 `[主线]` 实时增强——已读回执 + Typing + Redis 广播

**来源**：V1.3.1-4、V1.3.1-5、SCALE-DEBT（WS 扇出进程内、配额通知去重）

#### 做什么

1. **已读回执**：客户端发送 `message_read` 事件 → 服务端持久化 `message_read_receipts` 表 → 广播给同会话所有在线成员
2. **Typing indicator**：客户端发送 `typing_start` / `typing_stop` → 服务端 **不持久化**，仅广播 → 含 10s 自动超时
3. **Redis Pub/Sub 广播**：WS 事件（新消息、回执、Typing、Presence）全部走 Redis channel 扇出，支持多副本部署
4. **并发闸门 Redis 化**：`invocation-capacity.ts` 从进程内 Map 迁移至 Redis `INCR/DECR` + TTL 回收
5. **配额通知去重**：`notification-triggers.ts` 的阈值触发增加 Redis `SET NX` 去重键（TTL = 1h）

#### 怎么做

- **迁移 0028**：`CREATE TABLE message_read_receipts (message_id UUID, user_id UUID, read_at TIMESTAMPTZ, PRIMARY KEY(message_id, user_id))`
- **ws.gateway.ts**：注册 `message_read`、`typing_start`、`typing_stop` 事件处理器
- **ws.registry.ts**：重构 `broadcastToConversation` 为 Redis Pub/Sub——`PUBLISH conv:{id} payload`；每个进程实例 `SUBSCRIBE` 已知会话
- **invocation-capacity.ts**：`acquireSlot` → `INCR agent:{id}:concurrent`（TTL 兜底）；`releaseSlot` → `DECR`
- **新增依赖**：`ioredis`（若尚未引入）；环境变量 `REDIS_URL`

#### 交付物

| 产物 | 路径 |
|------|------|
| 迁移文件 | `packages/server/src/infra/db/migrations/0028_read_receipts_v131.sql` |
| Redis 广播模块 | `packages/server/src/modules/realtime/redis-pubsub.ts` |
| 已读回执处理 | `packages/server/src/modules/realtime/read-receipt.handler.ts` |
| Typing 处理 | `packages/server/src/modules/realtime/typing.handler.ts` |
| 并发闸门 Redis 版 | `packages/server/src/modules/gateway/invocation-capacity.ts`（重构） |
| 配额去重 | `packages/server/src/modules/notifications/notification-triggers.ts`（重构） |
| 测试 | `packages/server/tests/e12-realtime-enhanced.test.ts` |

#### 验收条件

- [ ] 两客户端同一会话，A 读消息 → B 在 ≤2s 收到 `message_read` 广播
- [ ] A 开始打字 → B 收到 `typing_start`；A 停止 10s 后 B 自动收到 `typing_stop`
- [ ] 模拟两进程实例（两次 `SUBSCRIBE`），消息在两个实例的客户端都可收到
- [ ] 并发闸门：`max_concurrent = 2` 时第 3 个请求返回 429 或进入队列
- [ ] 配额通知：1 小时内同一用户同一阈值仅发送 1 次通知

#### 依赖项

- 需要 Redis 实例（开发环境可用 `redis://localhost:6379`，CI 可使用 `ioredis-mock`）
- 无 Epic 间前置依赖，可立即启动

---

### E-13 `[主线]` Notion 连接器端到端

**来源**：V1.3.1-1、GAP-3

#### 做什么

1. **Notion OAuth 流程**：复用 `cloud-proxy.router.ts` OAuth 框架，适配 Notion OAuth 2.0
2. **Notion Adapter 完整化**：`notion.adapter.ts` 从当前桩代码扩展为真实 API 调用——至少支持 `list_databases`、`query_database`、`create_page`、`search`
3. **收据闭环**：每次 Notion API 调用生成 `external_action_receipt`，含 `provider: 'notion'`、`action`、`status`、`response_summary`
4. **CI Stub + Staging 真实**：CI 中 Notion 调用走 `NOTION_MOCK=true` 桩模式；staging 配置真实 OAuth 凭证

#### 怎么做

- **notion.adapter.ts**：
  - `authorizeAsync(code, state)` → 交换 access_token → 加密存储（复用 `token-crypto.ts`）
  - `listDatabasesAsync(userId)` → `GET https://api.notion.com/v1/search` (filter: database)
  - `queryDatabaseAsync(userId, dbId, filter?)` → `POST https://api.notion.com/v1/databases/{id}/query`
  - `createPageAsync(userId, parentDbId, properties)` → `POST https://api.notion.com/v1/pages`
  - 所有方法包含 token 过期自动刷新（Notion access_token 无过期但可被用户撤销 → 处理 401）
- **cloud-proxy.router.ts**：增加 `GET /api/v1/connectors/cloud/notion/authorize`、`GET .../callback`、`POST .../databases/:id/query`、`POST .../pages`
- **receipt**：每个 adapter 方法 return 前调用 `insertExternalActionReceiptAsync`

#### 交付物

| 产物 | 路径 |
|------|------|
| Notion Adapter | `packages/server/src/modules/connectors/cloud-proxy/notion.adapter.ts`（重构） |
| 路由扩展 | `packages/server/src/modules/connectors/cloud-proxy/cloud-proxy.router.ts`（新增） |
| Mock 模式 | `packages/server/src/modules/connectors/cloud-proxy/notion.mock.ts`（新增） |
| 测试 | `packages/server/tests/e13-notion-connector.test.ts` |

#### 验收条件

- [ ] Notion OAuth → 回调 → token 加密存储 → 列出数据库 → 查询 → 创建页面 → 每步生成收据
- [ ] token 被用户撤销后 → 下次调用返回 `connector_expired` + 系统消息提示重新授权
- [ ] CI 在 mock 模式下全部通过
- [ ] Staging 环境真实 OAuth 走通至少一条完整链路（列出 + 查询 + 创建）

#### 依赖项

- 无 Epic 间前置依赖
- Staging 需配置 `NOTION_CLIENT_ID`、`NOTION_CLIENT_SECRET`、`NOTION_OAUTH_REDIRECT_URI`

---

### E-14 `[主线]` 编排产品语义 + B 类定时召回 + 租约调度

**来源**：V1.3.1-3、V1.3.1-6、补充 §17.1（D1–D7）

#### 做什么

1. **产品语义定稿**（文档先行）：填写 §17.1 的 D1–D7 决策表，形成 `《编排运行时产品语义 v1》` 文档
2. **步骤完成判定**（D1）：引入 `output_schema` 可选字段，Agent 返回 `completed` 后若 schema 校验失败则标记 `completed_with_warnings`
3. **步骤间数据流**（D2）：`orchestration_steps` 增加 `input_mapping` 和 `output_snapshot` JSON 字段
4. **部分成功**（D3）：已交付步骤结果即时展示，后续步骤失败不回收（低敏默认策略 A）
5. **B 类定时召回**：`orchestration_runs` 增加 `schedule_cron` 和 `next_run_at` 字段；新增 `orchestration-scheduler.ts` 基于轮询（每分钟）检查 `next_run_at ≤ now()` 的 run → 按既有引擎执行
6. **租约调度**（D4 延伸）：步骤超时后进入 `lease_expired` 状态，允许用户选择重试/换 Agent/放弃；`orchestration_steps` 增加 `lease_expires_at` 字段

#### 怎么做

- **文档**：先产出 `docs/Orchestration-Product-Semantics-v1.md`（D1–D7 决策表 + 状态机图），CTO 审批后才开始编码
- **迁移 0029**：`ALTER TABLE orchestration_steps ADD COLUMN output_schema JSONB, ADD COLUMN input_mapping JSONB, ADD COLUMN output_snapshot JSONB, ADD COLUMN lease_expires_at TIMESTAMPTZ`；`ALTER TABLE orchestration_runs ADD COLUMN schedule_cron TEXT, ADD COLUMN next_run_at TIMESTAMPTZ`
- **orchestration.engine.ts**：重构 `executeStepAsync` 增加 schema 校验、数据映射、lease 管理
- **orchestration-scheduler.ts**（新增）：`startSchedulerLoop()` 每 60s 查一次 `WHERE next_run_at <= now() AND status = 'scheduled'` → fork 执行 → 更新 `next_run_at` 为下一个 cron 时间点

#### 交付物

| 产物 | 路径 |
|------|------|
| 产品语义文档 | `docs/Orchestration-Product-Semantics-v1.md` |
| 迁移文件 | `packages/server/src/infra/db/migrations/0029_orchestration_enhanced_v131.sql` |
| 引擎重构 | `packages/server/src/modules/orchestration/orchestration.engine.ts` |
| 调度器 | `packages/server/src/modules/orchestration/orchestration-scheduler.ts`（新增） |
| 类型扩展 | `packages/server/src/modules/orchestration/orchestration.types.ts` |
| 测试 | `packages/server/tests/e14-orchestration-semantics.test.ts` |

#### 验收条件

- [ ] 产品语义文档 D1–D7 全部填写并经 CTO 签字
- [ ] Agent 返回 `completed` 但 output 不匹配 schema → `completed_with_warnings` + 用户可见提示
- [ ] 多步编排第 2 步失败 → 第 1 步结果仍对用户可见（部分成功策略 A）
- [ ] B 类定时任务：创建 cron run → 模拟时间推进 → 引擎自动执行 → 收据可查
- [ ] 步骤超时（lease_expires_at 过期）→ `lease_expired` 状态 → 用户可选重试

#### 依赖项

- **文档先行**：编码须在语义文档 CTO 签字后启动
- 无 Epic 间依赖

---

### E-15 `[主线]` Agent 生命周期 + reason_codes 共享包

**来源**：V1.3.1-9、SCALE-DEBT（reason_codes 双源）

#### 做什么

1. **版本模型**：`agents` 表增加 `current_version TEXT`、`changelog JSONB`（数组，每项含 `version`、`summary`、`breaking`、`created_at`）
2. **下架/维护中语义**：
   - `listing_status` 新增 `maintenance` 枚举值
   - `maintenance` 状态：拒绝新请求但允许跑完当前 `run`；排队请求收到 `agent_maintenance` 错误码
   - `delisted`（已有）：立即拒绝所有请求
3. **reason_codes 共享包**：将 `reason-codes-i18n.ts` 提取为 `packages/shared/reason-codes.ts`，主线和官网共同引用
4. **变更通知**：Agent 变更（版本更新、维护中、下架）→ 向最近 7 天内调用过该 Agent 的用户发送应用内通知（复用 E-8 通知系统）

#### 怎么做

- **迁移 0030**：`ALTER TABLE agents ADD COLUMN current_version TEXT DEFAULT '1.0.0', ADD COLUMN changelog JSONB DEFAULT '[]'::jsonb`；`UPDATE ... SET listing_status = ... 扩展 CHECK 约束`
- **agent.store.ts**：增加 `updateAgentVersionAsync`、`setMaintenanceModeAsync`
- **gateway/a2a.gateway.ts**：`maintenance` 状态拦截逻辑
- **共享包**：新建 `packages/shared/src/reason-codes.ts`（从 `packages/server` 迁移）；`tsconfig` 增加 path alias
- **通知钩子**：`agent.store.ts` 版本变更后调用 `notification-triggers.ts` 新方法 `notifyAgentChangeAsync`

#### 交付物

| 产物 | 路径 |
|------|------|
| 迁移文件 | `packages/server/src/infra/db/migrations/0030_agent_lifecycle_v131.sql` |
| Agent store 扩展 | `packages/server/src/modules/directory/agent.store.ts` |
| 网关拦截 | `packages/server/src/modules/gateway/a2a.gateway.ts` |
| 共享包 | `packages/shared/src/reason-codes.ts`（新建） |
| 通知钩子 | `packages/server/src/modules/notifications/notification-triggers.ts` |
| 测试 | `packages/server/tests/e15-agent-lifecycle.test.ts` |

#### 验收条件

- [ ] Agent 进入 `maintenance` → 新请求返回 `agent_maintenance` + 人话消息 → 正在执行的 run 不受影响
- [ ] Agent `delisted` → 所有请求立即拒绝 + `agent_delisted` 错误码
- [ ] 版本更新后，最近 7 天内调用用户收到应用内通知（含 deep link 到 Agent 详情）
- [ ] `packages/shared/reason-codes.ts` 被 `packages/server` 和 `packages/website` 同时引用，`tsc` 无错误
- [ ] changelog 可通过 API 查询（`GET /api/v1/agents/:id` 返回 `changelog` 字段）

#### 依赖项

- 无前置依赖
- 共享包创建须与官网团队 W-18 协同确认 import 路径

---

### E-16 `[主线]` 邮件通知模板

**来源**：V1.3.1-7

#### 做什么

1. **邮件发送基础设施**：集成邮件服务（Resend / SendGrid / SES，选择 Resend 作为 V1.3.1 默认——API 简洁且有免费额度）
2. **通知分发升级**：`notification-triggers.ts` 在写入应用内通知后，检查用户邮件偏好 → 若启用则异步发送邮件
3. **模板集**：至少覆盖以下 6 种场景的 HTML 邮件模板：
   - 任务完成（`task_completed`）
   - 人审请求（`human_review_required`）
   - 配额告警（`quota_warning`）
   - Agent 状态变更（`agent_status_changed`）
   - 连接器过期（`connector_expired`）
   - Space 邀请（`space_invitation`）
4. **用户偏好**：在 `users` 表增加 `notification_preferences JSONB`（默认全开）

#### 怎么做

- **迁移 0031**：`ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{"email_enabled": true, "email_types": ["task_completed", "human_review_required", "quota_warning", "agent_status_changed", "connector_expired", "space_invitation"]}'::jsonb`
- **新增 `email.service.ts`**：封装 Resend API，`sendTemplateEmailAsync(to, templateId, data)`
- **模板**：6 个 HTML 模板置于 `packages/server/src/modules/notifications/templates/`，使用简单的字符串模板替换（不引入重型模板引擎）
- **notification-triggers.ts 重构**：每个触发函数增加 `→ maybeEmailAsync(userId, type, data)` 调用

#### 交付物

| 产物 | 路径 |
|------|------|
| 迁移文件 | `packages/server/src/infra/db/migrations/0031_notification_preferences_v131.sql` |
| 邮件服务 | `packages/server/src/modules/notifications/email.service.ts`（新增） |
| HTML 模板 | `packages/server/src/modules/notifications/templates/*.html`（6 个） |
| 偏好 API | `packages/server/src/modules/notifications/notification.router.ts`（扩展 `PUT /preferences`） |
| 测试 | `packages/server/tests/e16-email-notifications.test.ts` |

#### 验收条件

- [ ] 人审请求触发 → 用户收到邮件（Resend Dashboard 可查）
- [ ] 用户关闭 `quota_warning` 邮件偏好 → 配额告警仅应用内通知，无邮件
- [ ] 6 个模板在三语（zh/en/ja）下文案完整（i18n 字段自动切换）
- [ ] 邮件发送失败 → 静默记录错误日志，不阻塞应用内通知

#### 依赖项

- 需配置 `RESEND_API_KEY` 环境变量
- 依赖 E-15 的 `agent_status_changed` 通知类型

---

### E-17 `[主线]` 收据权限矩阵 + 数据保留矩阵定稿

**来源**：V1.3.1-8、补充 §17.3

#### 做什么

1. **收据权限矩阵**：定义不同角色对收据/审计字段的可见性
   - `user`：可见自己发起的调用收据摘要（Agent 名、时间、状态、输入/输出摘要）
   - `space_admin`：可见该 Space 全部调用收据 + 输入/输出全文 + 信任决策详情
   - `developer`（Agent 提供者）：可见自己 Agent 被调用的收据统计 + 错误详情，**不可见** 用户输入原文
   - `platform_admin`：全部可见
2. **字段级过滤**：`invocation.store.ts` 的查询方法增加 `visibilityFilter(role)` 参数，SQL 层按角色裁剪字段
3. **数据保留矩阵文档**：将 `Data-Retention-Matrix-Draft-v1.md` 从草案升级为正式版，填写全部类目的具体保留期（占位值待产品/法务确认）
4. **软删除与归档作业**：实现 `data-retention.job.ts`——每日执行，按矩阵中定义的 TTL 将过期数据标记为 `archived`（软删除），保留 `archived_at` 时间戳

#### 怎么做

- **invocation.store.ts**：增加 `ReceiptVisibility` 类型和 `getInvocationWithVisibilityAsync(id, role)` 方法
- **data-retention.job.ts**（新增）：参数化配置各类数据的 TTL（从环境变量或 DB 配置读取），执行 `UPDATE ... SET archived = true, archived_at = now() WHERE created_at < now() - interval '${ttl}'`
- **文档**：更新 `Data-Retention-Matrix-Draft-v1.md` → `Data-Retention-Matrix-v1.md`

#### 交付物

| 产物 | 路径 |
|------|------|
| 权限矩阵实现 | `packages/server/src/modules/gateway/invocation.store.ts`（重构） |
| 数据保留作业 | `packages/server/src/modules/data-retention/data-retention.job.ts`（新增） |
| 数据保留文档 | `docs/Data-Retention-Matrix-v1.md`（从草案升级） |
| 帮助中心文案 | 「数据保存多久」文案供官网团队使用 |
| 测试 | `packages/server/tests/e17-receipt-visibility.test.ts` |

#### 验收条件

- [ ] `user` 角色查询他人发起的调用 → 404（而非空字段）
- [ ] `space_admin` 可查 Space 内全部收据含输入/输出全文
- [ ] `developer` 查自己 Agent 的收据 → 可见错误详情 + 统计，输入原文为 `[redacted]`
- [ ] 数据保留文档全部类目有明确数值（哪怕是待确认占位值也须标注）
- [ ] 归档作业 dry-run 模式可列出将被归档的记录数

#### 依赖项

- 无前置依赖
- 数据保留矩阵的具体数值需产品/法务签字（可先用占位值开发）

---

### E-18 `[主线]` 反滥用最小集 + UGC 治理

**来源**：V1.3.1-10、V1.3.1-11

#### 做什么

1. **分级限流**：
   - 注册：同一 IP 每小时最多 10 次尝试
   - 发消息：同一用户每分钟最多 30 条
   - 目录搜索：同一用户每分钟最多 60 次
   - Agent 调用：复用 E-12 Redis 并发闸门 + 每用户每小时上限（可配置）
2. **挑战策略**：超频请求返回 `429 Too Many Requests` + `Retry-After` header + 用户可见文案 `「操作过频，请稍后再试」`
3. **UGC 举报**：多人会话中用户消息的举报能力——`POST /api/v1/messages/:id/report`（`reason`、`detail`），写入 `user_content_reports` 表
4. **UGC 管理**：Space `admin` 可对被举报消息执行 `hide`（软删除，对话中显示 `[该消息已被管理员隐藏]`）

#### 怎么做

- **rate-limiter.ts**（新增）：基于 Redis 的滑动窗口限流器——`checkRateLimit(key, maxRequests, windowSeconds)` 返回 `{ allowed, retryAfterMs }`
- **中间件**：在 `app.ts` 全局注册 `rateLimitMiddleware`，按路由前缀匹配不同限流规则
- **迁移 0032**：`CREATE TABLE user_content_reports (id UUID, message_id UUID, reporter_id UUID, reason TEXT, detail TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now())`
- **message-moderation.store.ts**（新增）：`reportMessageAsync`、`hideMessageAsync`、`getReportsAsync`

#### 交付物

| 产物 | 路径 |
|------|------|
| 限流器 | `packages/server/src/infra/rate-limiter.ts`（新增） |
| 迁移文件 | `packages/server/src/infra/db/migrations/0032_abuse_ugc_v131.sql` |
| UGC 模块 | `packages/server/src/modules/moderation/message-moderation.store.ts`（新增） |
| 路由 | `packages/server/src/modules/moderation/moderation.router.ts`（新增） |
| 测试 | `packages/server/tests/e18-abuse-ugc.test.ts` |

#### 验收条件

- [ ] 同一 IP 第 11 次注册尝试 → 429 + `Retry-After` + 「操作过频」文案
- [ ] 同一用户每分钟第 31 条消息 → 429
- [ ] 用户举报消息 → `user_content_reports` 记录可查
- [ ] Space admin 隐藏消息 → 其他成员看到 `[该消息已被管理员隐藏]`
- [ ] 限流配置支持环境变量覆盖（如 `RATE_LIMIT_MESSAGE_PER_MIN=60`）

#### 依赖项

- 依赖 E-12 的 Redis 基础设施
- 路由注册须在 `app.ts` 全局中间件层

---

### E-19 `[主线]` 轻量桌面 Connector——运行时与通信协议

**来源**：V1.3.1-2、主规格 §1.1 B.4

#### 做什么

1. **Tauri 托盘应用**：基于 Tauri 2.x 构建跨平台（macOS + Windows）托盘/菜单栏级常驻组件，体积目标 < 15MB
2. **配对协议**：首次运行生成一次性 6 位配对码 → 用户在 Web App 输入 → 服务端验证后颁发 `device_token`（JWT，含 `user_id` + `device_id`）→ 后续通信凭此 token 双向认证
3. **本地回环 HTTP 服务**：Connector 在 `127.0.0.1:{随机端口}` 启动受控 HTTP API，仅接受来自 `device_token` 持有者的请求（请求头校验 Origin + Bearer token）
4. **目录挂载**：用户在 Connector 托盘 UI 中显式选择工作区根目录（≤5 个）→ 写入本地配置 → 仅允许在已挂载根目录树内的文件操作
5. **文件操作 API**：
   - `GET /fs/list?path=` — 列出目录内容（仅挂载根内）
   - `GET /fs/read?path=` — 读取文件内容（大小限制 10MB）
   - `POST /fs/write` — 写入文件（须 `confirmed: true` 头或走 Trust 确认流）
   - `GET /fs/watch?path=` — SSE 流监视目录变更
6. **与主网通信**：每次本机文件操作完成后，Connector 向主线 API `POST /api/v1/connectors/desktop/receipts` 回传执行收据（含 `device_id`、`action`、`path_hash`、`status`、`env_signature`）

#### 怎么做

- **技术选型**：Tauri 2.x（Rust 后端 + 系统 WebView 前端），而非 Electron——二进制体积小、启动快、安全沙箱原生支持
- **项目结构**：新建 `packages/connector/`，含 `src-tauri/`（Rust）和 `src/`（前端 UI，极简——仅托盘菜单 + 配对输入 + 挂载目录选择）
- **配对流程**：
  1. Connector 启动 → 生成 6 位 OTP → 展示在托盘 UI
  2. 用户在 Web App 「设置 → 连接器 → 桌面 Connector」输入配对码
  3. Web App BFF → 主线 `POST /api/v1/connectors/desktop/pair` → 校验 OTP → 颁发 `device_token`
  4. Connector 轮询 `GET /api/v1/connectors/desktop/pair-status` → 收到 `device_token` → 配对完成
- **安全边界**：
  - 文件操作严格限定在挂载根目录内（path traversal 防御：`realpath` 校验）
  - 写操作默认走 Trust 确认（`risk_level: 'medium'`）—— Web 端展示确认卡片
  - 所有文件操作收据含 `HMAC-SHA256(payload, device_secret)` 签名
- **更新机制**：内嵌 Tauri updater → 检查 GitHub Releases → 下载签名验证后自动更新

#### 交付物

| 产物 | 路径 |
|------|------|
| Tauri 项目 | `packages/connector/`（新建） |
| Rust 文件操作模块 | `packages/connector/src-tauri/src/fs_ops.rs` |
| 配对协议模块 | `packages/connector/src-tauri/src/pairing.rs` |
| 本地 HTTP 服务 | `packages/connector/src-tauri/src/local_server.rs` |
| 托盘 UI | `packages/connector/src/` |
| 威胁模型文档 | `docs/Desktop-Connector-Threat-Model-v1.md` |
| 测试 | `packages/connector/tests/` |

#### 验收条件

- [ ] macOS + Windows 构建产出可执行文件，体积 < 15MB
- [ ] 配对流程：6 位码 → Web 输入 → 双向认证建立 → Connector 状态变为「已连接」
- [ ] 目录挂载：选择工作区 → 只能访问该目录树内文件 → 访问外部路径返回 403
- [ ] 文件列表 + 读取端到端：Web 触发 → Connector 本机执行 → 结果返回 Web → 主网收据可查
- [ ] 文件写入须经 Trust 确认（Web 端弹出确认卡片）
- [ ] 更新签名验证：篡改更新包 → Connector 拒绝安装
- [ ] 威胁模型文档覆盖：本机恶意软件滥用、用户误授权、更新劫持、path traversal

#### 依赖项

- 需安装 Rust 工具链（`rustup`）+ Tauri CLI
- 无 Epic 间前置依赖，可立即启动（与其他 Epic 并行）
- 配对 API 需主线 E-4 连接器基础设施支持（已在 V1.3 完成）

---

### E-20 `[主线]` 桌面 Connector 主网集成——配对 API + 收据 + 审计

**来源**：V1.3.1-2、主规格 §1.1 B.4–B.5

#### 做什么

1. **配对 API**：
   - `POST /api/v1/connectors/desktop/pair` — 接收配对码，校验后颁发 `device_token`
   - `GET /api/v1/connectors/desktop/pair-status` — Connector 轮询配对状态
   - `DELETE /api/v1/connectors/desktop/devices/:id` — 解绑设备
2. **设备注册表**：`connector_desktop_devices` 表——`device_id`、`user_id`、`device_name`、`paired_at`、`last_seen_at`、`status`（active/revoked）
3. **收据端点**：`POST /api/v1/connectors/desktop/receipts` — 接收 Connector 回传的执行收据 → 校验 HMAC 签名 → 持久化 → 关联审计事件
4. **代理执行端点**：`POST /api/v1/connectors/desktop/execute` — Web App 或 Agent 请求本机操作 → 主线记录意图 → 通过 WS/SSE 推送到 Connector → 收集结果
5. **Trust 集成**：文件写入操作走 Trust 引擎——`risk_level: 'medium'`（目录内写入）或 `'high'`（首次在新目录写入）

#### 怎么做

- **迁移 0033**：`CREATE TABLE connector_desktop_devices (...)`；`ALTER TABLE external_action_receipts ADD COLUMN device_id UUID REFERENCES connector_desktop_devices(id)`
- **desktop-connector.router.ts**（新增）：配对、设备管理、收据、执行代理全部路由
- **desktop-connector.store.ts**（新增）：设备 CRUD、收据持久化
- **WS 推送**：复用 E-12 的 Redis Pub/Sub，新增 `desktop_execute` 事件类型 → 推送到用户设备对应的 WS 连接 → Connector 本地 HTTP 服务执行 → 回传结果

#### 交付物

| 产物 | 路径 |
|------|------|
| 迁移文件 | `packages/server/src/infra/db/migrations/0033_desktop_connector_v131.sql` |
| 路由 | `packages/server/src/modules/connectors/desktop/desktop-connector.router.ts`（新增） |
| Store | `packages/server/src/modules/connectors/desktop/desktop-connector.store.ts`（新增） |
| Trust 规则 | `packages/server/src/modules/trust/trust.engine.ts`（扩展桌面文件操作规则） |
| app.ts 注册 | `registerDesktopConnectorRoutes` |
| 测试 | `packages/server/tests/e20-desktop-connector.test.ts` |

#### 验收条件

- [ ] 配对 API：生成 device_token → 设备表有记录 → `last_seen_at` 随请求更新
- [ ] 收据端点：HMAC 签名校验通过 → 持久化 → 审计事件 `connector.desktop.file_read` / `file_write` / `file_list`
- [ ] 签名校验失败 → 400 + 审计事件 `connector.desktop.receipt_rejected`
- [ ] 执行代理：Web 请求文件列表 → WS 推送到 Connector → Connector 执行 → 结果回传 → Web 展示
- [ ] Trust 集成：文件写入 → Trust 引擎判定 `need_confirmation` → 用户确认后执行
- [ ] 设备解绑：`DELETE` 后 Connector 无法再通过 device_token 访问任何 API
- [ ] reset.ts 包含新表 TRUNCATE

#### 依赖项

- 依赖 E-12 的 Redis Pub/Sub 基础设施（WS 推送）
- 与 E-19 协同：E-19 实现 Connector 端，E-20 实现主网端，需约定 API 契约后并行开发

---

## 3. 官网开发团队 Epic（W-15 ~ W-22）

---

### W-15 `[官网]` RBAC 路由 UI + 成员信息增强

**来源**：GAP-2（UI 侧）、GAP-4

#### 做什么

1. **成员列表增强**：`space-members-panel.tsx` 调用新版成员 API → 展示 `display_name`（主）+ `email_masked`（次）+ 角色徽章 + 在线状态指示灯
2. **权限受控 UI**：
   - 连接器触发按钮——非 `owner`/`admin`/`member` 不展示
   - 审计导出按钮——仅 `owner`/`admin` 可见
   - Agent 邀请权限切换——仅 `owner`/`admin` 可在成员详情中勾选
3. **权限不足提示**：点击受限功能 → Toast「你的角色无此权限，请联系 Space 管理员」（三语）
4. **角色管理 UI**：`owner` 可在成员列表中修改其他成员角色（下拉选择）、移除成员

#### 怎么做

- BFF 代理：`GET /api/mainline/spaces/:id/members` 透传新版 API 的 `display_name` + `email_masked`
- 组件：`space-members-panel.tsx` 重构，增加角色下拉、权限勾选、移除确认弹窗
- 条件渲染：根据当前用户角色（从 Space context 获取）控制按钮可见性

#### 交付物

| 产物 | 路径 |
|------|------|
| 成员面板重构 | `packages/website/src/components/product/space-members-panel.tsx` |
| BFF 代理 | `packages/website/src/app/api/mainline/spaces/[id]/members/route.ts`（扩展） |
| 权限控制 hook | `packages/website/src/hooks/use-space-permissions.ts`（新增） |
| 测试 | `packages/website/tests/w15-rbac-ui.test.ts` |

#### 验收条件

- [ ] `guest` 角色进入 Space → 无「触发连接器」按钮、无「导出审计」按钮
- [ ] 成员列表展示 `display_name` 而非 `user_id`；邮箱脱敏显示
- [ ] `owner` 修改成员角色 → API 调用成功 → 列表即时刷新
- [ ] 三语权限不足 Toast 文案完整

#### 依赖项

- 依赖主线 E-11 完成（成员 API 扩展）

---

### W-16 `[官网]` WS 通道接入 + 已读回执 / Typing UI

**来源**：GAP-5、V1.3.1-4、V1.3.1-5

#### 做什么

1. **WS 客户端**：替换当前 SSE 轮询为 WebSocket 连接——复用主线 E-3 的 WS 协议；SSE 保留为 fallback（WS 连接失败自动降级）
2. **已读回执 UI**：消息气泡底部展示「已读 / 已送达」状态——双勾 ✓✓ 图标
3. **Typing indicator UI**：会话底部展示「XXX 正在输入…」动画（气泡省略号动画）
4. **Presence UI**：成员头像旁展示在线状态圆点（绿/灰/橙）

#### 怎么做

- **ws-client.ts**（新增）：
  - 创建 `WebSocketManager` 类——自动重连（指数退避）、心跳保活（30s ping）、事件分发
  - 事件注册：`message_new`、`message_read`、`typing_start`、`typing_stop`、`presence_update`
  - 初始化时传入 JWT token 作为 `?token=` query param（与主线 ws.gateway.ts 对齐）
- **chat 组件**：消息组件增加 `readBy` 属性渲染；底部增加 typing 区域
- **降级逻辑**：`WS_FALLBACK_TO_SSE` 环境变量 + 自动检测

#### 交付物

| 产物 | 路径 |
|------|------|
| WS 客户端 | `packages/website/src/lib/product/ws-client.ts`（新增） |
| 消息已读 UI | `packages/website/src/components/product/chat/message-read-indicator.tsx`（新增） |
| Typing UI | `packages/website/src/components/product/chat/typing-indicator.tsx`（新增） |
| Presence 指示 | `packages/website/src/components/product/chat/presence-dot.tsx`（新增） |
| SSE 降级 | `packages/website/src/lib/product/sse-fallback.ts`（重构） |
| 测试 | `packages/website/tests/w16-ws-realtime.test.ts` |

#### 验收条件

- [ ] WS 连接建立后，新消息在 ≤1s 渲染（不含 Agent 思考时间）
- [ ] A 用户阅读消息 → B 用户看到该消息从单勾变双勾
- [ ] A 用户开始输入 → B 用户看到「A 正在输入…」动画 → 10s 无输入自动消失
- [ ] WS 断开 → 自动切换 SSE → 用户无感知中断（消息不丢失）
- [ ] 在线状态圆点与主线 Presence 数据一致

#### 依赖项

- 依赖主线 E-12 完成（已读回执 + Typing + Redis 广播）
- BFF 层需暴露 WS 代理或直连主线 WS 端点

---

### W-17 `[官网]` Notion 连接器授权 UI

**来源**：V1.3.1-1（UI 侧）

#### 做什么

1. **连接器设置页增强**：`settings/connectors/page.tsx` 增加 Notion 连接器卡片——Logo + 授权状态 + 连接/断开按钮
2. **OAuth 流程 UI**：点击「连接 Notion」→ 弹窗跳转 Notion 授权页 → 回调后更新状态
3. **已连接状态展示**：显示连接的 Notion Workspace 名称 + 连接时间 + 「断开」按钮
4. **对话中 Notion 操作反馈**：当 Agent 执行 Notion 操作时，消息中展示 Notion 操作收据卡片（类似 Google Calendar 卡片）

#### 怎么做

- 复用 Google Calendar 连接器的 UI 组件结构，适配 Notion 字段
- BFF 代理：`POST /api/mainline/connectors/cloud/notion/authorize`、`DELETE .../revoke`

#### 交付物

| 产物 | 路径 |
|------|------|
| 连接器卡片 | `packages/website/src/components/product/settings/notion-connector-card.tsx`（新增） |
| 收据卡片 | `packages/website/src/components/product/chat/notion-receipt-card.tsx`（新增） |
| BFF 代理 | `packages/website/src/app/api/mainline/connectors/notion/[...path]/route.ts`（新增） |
| 测试 | `packages/website/tests/w17-notion-ui.test.ts` |

#### 验收条件

- [ ] 连接器设置页展示 Notion 卡片——未连接时显示「连接」按钮，已连接时显示 Workspace 名 + 「断开」
- [ ] OAuth 流程完成后自动关闭弹窗并刷新连接状态
- [ ] 对话中 Notion 操作后展示收据卡片（含操作类型、目标数据库名、状态）
- [ ] 三语文案完整

#### 依赖项

- 依赖主线 E-13 完成

---

### W-18 `[官网]` Agent 生命周期 UX + 收据详情 + reason_codes 共享

**来源**：V1.3.1-9、V1.3.1-8、SCALE-DEBT（reason_codes 共享）

#### 做什么

1. **Agent 详情页增强**：
   - 展示 `current_version` + changelog 列表（折叠展开）
   - `maintenance` 状态：Agent 卡片显示黄色「维护中」徽章 + 提示文案
   - `delisted` 状态：卡片灰化 + 「已下架」标签
2. **收据详情页**：
   - 新增 `app/receipt/[id]/page.tsx`——按当前用户角色展示对应字段
   - 普通用户：摘要视图
   - Space admin：完整视图含输入/输出全文
   - 开发者：统计视图 + 错误详情（输入脱敏）
3. **reason_codes 共享包迁移**：将 `packages/website` 中的 reason_codes 硬编码替换为 `packages/shared/reason-codes.ts` 引用

#### 怎么做

- Agent 详情：扩展现有 Agent 详情组件，增加 version + changelog + status badge
- 收据页：新增页面组件，根据 BFF 返回的角色过滤字段渲染
- 共享包：更新 `tsconfig.json` 的 `paths` 配置，引用 `@gaialynk/shared/reason-codes`

#### 交付物

| 产物 | 路径 |
|------|------|
| Agent 详情扩展 | `packages/website/src/components/product/agent-detail-enhanced.tsx`（新增或重构） |
| 收据详情页 | `packages/website/src/app/[locale]/(product)/app/receipt/[id]/page.tsx`（新增） |
| 收据 BFF | `packages/website/src/app/api/mainline/invocations/[id]/route.ts`（新增） |
| 共享包引用 | 全局替换 reason_codes 硬编码 |
| 测试 | `packages/website/tests/w18-agent-lifecycle-receipt.test.ts` |

#### 验收条件

- [ ] Agent 维护中 → 目录卡片显示黄色「维护中」+ 详情页显示 changelog
- [ ] 收据详情页：普通用户看不到输入全文；Space admin 可看到
- [ ] reason_codes 从共享包引入后，`tsc` + `next build` 无错误
- [ ] 三语文案完整

#### 依赖项

- 依赖主线 E-15（Agent 生命周期 + 共享包）、E-17（收据权限矩阵）

---

### W-19 `[官网]` 邮件通知偏好 + Cookie/同意横幅

**来源**：V1.3.1-7（UI 侧）、V1.3.1-12

#### 做什么

1. **通知偏好页增强**：`settings/notifications/page.tsx` 增加邮件通知开关——总开关 + 按类型细分开关（6 种场景与主线 E-16 对齐）
2. **Cookie/同意横幅**：
   - 首次访问官网 → 底部展示 Cookie 同意横幅——「必要」（默认开启不可关）+ 「分析」（可选）+ 「营销」（可选）
   - 选择结果存入 `localStorage` + 发送到 BFF（未来用于合规审计）
   - 「必要」Cookie 仅含 session/auth；「分析」控制是否加载 PostHog 等；「营销」暂无用途但预留
3. **隐私政策页**：增加 Cookie 使用说明段落（三语）

#### 怎么做

- 通知偏好：调用 `PUT /api/mainline/notifications/preferences` BFF 代理
- Cookie 横幅：纯前端组件 `cookie-consent-banner.tsx`，使用 `localStorage` 键 `gaialynk_cookie_consent`
- PostHog 条件加载：`layout.tsx` 中 `if (cookieConsent.analytics) { loadPostHog() }`

#### 交付物

| 产物 | 路径 |
|------|------|
| 通知偏好 | `packages/website/src/app/[locale]/(product)/app/settings/notifications/page.tsx`（重构） |
| BFF 代理 | `packages/website/src/app/api/mainline/notifications/preferences/route.ts`（新增） |
| Cookie 横幅 | `packages/website/src/components/cookie-consent-banner.tsx`（新增） |
| 隐私政策段落 | 三语 i18n 文件更新 |
| 测试 | `packages/website/tests/w19-prefs-cookie.test.ts` |

#### 验收条件

- [ ] 通知偏好页：关闭「配额告警」邮件 → 保存 → 刷新后仍为关
- [ ] 首次访问 → Cookie 横幅出现 → 选择「仅必要」→ 横幅消失 → PostHog 不加载
- [ ] 选择「全部接受」→ PostHog 加载 → `analytics_consent: true` 存入 localStorage
- [ ] 三语切换后横幅文案一致
- [ ] 再次访问 → 横幅不出现（localStorage 已记录）

#### 依赖项

- 通知偏好依赖主线 E-16 完成
- Cookie 横幅无前置依赖，可立即启动

---

### W-20 `[官网]` B 类定时召回 UI + 编排增强

**来源**：V1.3.1-3（UI 侧）、补充 §17.1

#### 做什么

1. **定时任务创建 UI**：在对话内或 Agent 详情页增加「创建定时任务」入口 → 弹窗选择 cron 频率（预设选项：每天、每周、自定义 cron）
2. **定时任务管理**：`settings/` 或独立页面展示用户所有定时任务——状态（活跃/暂停/完成）、下次执行时间、历史执行记录
3. **编排进度增强**：`orchestration-plan-bar.tsx` 增加步骤间数据流可视化——箭头 + 输出摘要气泡
4. **部分成功 UI**：多步编排中间步骤失败时，已完成步骤保持绿色 + 可展开查看输出；失败步骤显示红色 + 重试/换 Agent 按钮
5. **Lease 超时 UI**：步骤 `lease_expired` → 显示橙色「超时」标签 + 三个操作按钮（重试本步 / 更换 Agent / 放弃）

#### 怎么做

- BFF 代理：`POST /api/mainline/orchestrations/schedule`（创建定时任务）、`GET .../scheduled`（列表）、`PATCH .../scheduled/:id`（暂停/恢复）
- 组件：`scheduled-task-manager.tsx`（任务列表）、`cron-picker.tsx`（cron 选择器）
- `orchestration-plan-bar.tsx` 重构：增加数据流线条 + 点击步骤展开输出

#### 交付物

| 产物 | 路径 |
|------|------|
| 定时任务管理 | `packages/website/src/components/product/scheduled-task-manager.tsx`（新增） |
| Cron 选择器 | `packages/website/src/components/product/cron-picker.tsx`（新增） |
| 编排进度增强 | `packages/website/src/components/product/chat/orchestration-plan-bar.tsx`（重构） |
| BFF 代理 | `packages/website/src/app/api/mainline/orchestrations/schedule/route.ts`（新增） |
| 测试 | `packages/website/tests/w20-scheduled-orchestration.test.ts` |

#### 验收条件

- [ ] 用户创建「每天 9:00 执行」定时任务 → 列表显示下次执行时间
- [ ] 暂停定时任务 → 状态变为「已暂停」→ 恢复后继续执行
- [ ] 多步编排第 2 步失败 → 第 1 步保持绿色可展开 → 第 2 步红色 + 重试按钮
- [ ] Lease 超时 → 橙色「超时」→ 用户点击「重试本步」→ 步骤重新执行
- [ ] 三语文案完整

#### 依赖项

- 依赖主线 E-14 完成

---

### W-21 `[官网]` 帮助中心增量 + 合规文案 + UGC 举报 UI

**来源**：V1.3.1-11（UI 侧）、补充 §12、§17.3

#### 做什么

1. **帮助中心增量文章**：
   - 「数据保存多久」——按数据保留矩阵用人话解释各类目保留期
   - 「助理能替我拉别的 Agent 吗？」——解释代理邀请机制与撤销
   - 「为什么停在第二步？」——编排部分成功的用户解释
   - 「什么是定时任务？」——B 类定时召回说明
   - 「如何举报不当消息？」——UGC 举报流程
2. **UGC 举报 UI**：消息长按/右键菜单增加「举报」选项 → 弹窗选择原因 → 提交
3. **管理员内容管理**：Space admin 在消息上看到「隐藏」选项 → 确认后消息变为 `[该消息已被管理员隐藏]`

#### 怎么做

- 帮助中心：在 `help/page.tsx` 增加文章条目（三语 i18n）
- 举报 UI：`message-context-menu.tsx` 增加「举报」项 → 弹出 `report-dialog.tsx`
- BFF 代理：`POST /api/mainline/messages/:id/report`、`POST .../messages/:id/hide`

#### 交付物

| 产物 | 路径 |
|------|------|
| 帮助中心文章 | 三语 i18n 文件更新 + `help/page.tsx` 扩展 |
| 举报弹窗 | `packages/website/src/components/product/chat/report-dialog.tsx`（新增） |
| 消息隐藏 | `packages/website/src/components/product/chat/message-item.tsx`（扩展） |
| BFF 代理 | `packages/website/src/app/api/mainline/messages/[id]/report/route.ts`（新增） |
| 测试 | `packages/website/tests/w21-help-ugc.test.ts` |

#### 验收条件

- [ ] 帮助中心搜索「数据保存」→ 命中对应文章
- [ ] 用户右键消息 → 「举报」→ 选择原因 → 提交成功 Toast
- [ ] Space admin 隐藏消息 → 其他成员看到占位文案
- [ ] 所有新增帮助文章三语完整
- [ ] 帮助文章中能力状态标签（Now / In Progress）与路线图一致

#### 依赖项

- 举报/隐藏依赖主线 E-18 完成
- 帮助中心「数据保存」依赖主线 E-17 数据保留文档

---

### W-22 `[官网]` 桌面 Connector 下载/配对/管理 UI

**来源**：V1.3.1-2（UI 侧）、主规格 §1.1 B.4

#### 做什么

1. **下载入口**：`settings/connectors/page.tsx` 增加「桌面 Connector」卡片——展示当前状态（未安装 / 已配对 / 已断开）+ macOS / Windows 下载按钮（指向 GitHub Releases）
2. **配对 UI**：点击「配对新设备」→ 弹窗引导：① 说明「请打开桌面 Connector，找到 6 位配对码」→ ② 输入框（6 位数字/字母）→ ③ 提交 → 成功/失败反馈
3. **已配对设备管理**：展示已配对设备列表——设备名、配对时间、最近在线时间、在线/离线状态 → 「解绑」按钮
4. **对话中文件操作 UI**：当 Agent 请求本机文件操作时：
   - Connector 在线 → 展示 Trust 确认卡片（「Agent 请求读取 `/work/report.docx`，是否允许？」）
   - Connector 离线 → 展示引导卡片（「需要桌面 Connector 在线才能执行此操作」+ 「查看如何连接」链接）
5. **帮助中心增量**：「什么是桌面 Connector？」「如何安装与配对？」「浏览器能力 vs 桌面 Connector」

#### 怎么做

- BFF 代理：
  - `POST /api/mainline/connectors/desktop/pair` — 提交配对码
  - `GET /api/mainline/connectors/desktop/devices` — 已配对设备列表
  - `DELETE /api/mainline/connectors/desktop/devices/:id` — 解绑
- 组件：`desktop-connector-card.tsx`（设置页卡片）、`pairing-dialog.tsx`（配对弹窗）、`desktop-device-list.tsx`（设备列表）
- 对话组件：扩展 `trust-card.tsx` 支持 `connector_desktop_*` 类型的确认卡片
- 移动端处理：在 `< 768px` 视口下隐藏「桌面 Connector」卡片或显示灰化状态 + 「请在桌面浏览器操作」（与补充 §7.3 对齐）

#### 交付物

| 产物 | 路径 |
|------|------|
| 设置页卡片 | `packages/website/src/components/product/settings/desktop-connector-card.tsx`（新增） |
| 配对弹窗 | `packages/website/src/components/product/settings/pairing-dialog.tsx`（新增） |
| 设备列表 | `packages/website/src/components/product/settings/desktop-device-list.tsx`（新增） |
| 对话确认卡片 | `packages/website/src/components/product/chat/trust-card.tsx`（扩展） |
| BFF 代理 | `packages/website/src/app/api/mainline/connectors/desktop/[...path]/route.ts`（新增） |
| 帮助文章 | 三语 i18n 文件更新 |
| 测试 | `packages/website/tests/w22-desktop-connector-ui.test.ts` |

#### 验收条件

- [ ] 设置页展示桌面 Connector 卡片——未配对时显示下载链接 + 配对按钮
- [ ] 配对流程：输入 6 位码 → 成功后卡片状态变为「已连接 — 设备名」
- [ ] 已配对设备列表展示在线/离线状态 + 最近在线时间
- [ ] 解绑设备 → 列表更新 → Connector 端断开连接
- [ ] 对话中文件操作确认卡片展示操作类型 + 文件路径 + 确认/拒绝按钮
- [ ] Connector 离线 → 引导卡片展示 + 帮助链接
- [ ] 移动端视口 → 灰化或隐藏（与补充 §7.3 一致）
- [ ] 三语文案完整（包含帮助中心 3 篇文章）

#### 依赖项

- 依赖主线 E-19（Connector 运行时）+ E-20（主网 API）完成
- Trust 确认卡片扩展可提前开发（约定好事件类型即可）

---

## 4. 跨团队协同任务

| 协同项 | 主线 | 官网 | 交付标准 |
|--------|------|------|---------|
| **reason_codes 共享包** | E-15 创建 `packages/shared` | W-18 迁移引用 | `tsc` + `next build` 零错误 |
| **成员 API 字段扩展** | E-11 返回 display_name + email_masked | W-15 渲染 | 两端联调通过 |
| **WS 协议对齐** | E-12 Redis 广播 + 新事件类型 | W-16 WS 客户端 | 两浏览器已读/Typing 端到端 |
| **Notion 收据格式** | E-13 receipt 字段定义 | W-17 卡片渲染 | 收据卡片可展示操作类型、目标、状态 |
| **编排语义** | E-14 步骤状态机 + B 类 cron | W-20 进度条 + 定时任务 UI | 部分成功 + Lease 超时 UI 与后端状态一致 |
| **Agent 生命周期** | E-15 changelog + maintenance | W-18 版本展示 + 状态徽章 | 维护中 Agent 对话内可见提示 |
| **收据权限矩阵** | E-17 字段过滤 | W-18 角色视图 | 不同角色看到不同字段集 |
| **邮件通知偏好** | E-16 偏好 API | W-19 偏好 UI | 关闭某类邮件后不再收到 |
| **UGC 举报/隐藏** | E-18 API + 限流 | W-21 UI | 举报 → 管理员隐藏 → 占位文案 |
| **桌面 Connector 通信** | E-19 Tauri 运行时 + E-20 主网 API | W-22 配对/管理 UI | 配对 → 挂载 → Web 触发文件读 → 结果返回 → 收据 |

---

## 5. 推荐执行序列（2~2.5 周）

> **桌面 Connector 为独立并行线**：E-19（Tauri 运行时）无主线 Web 依赖，Day 1 即可启动；E-20（主网 API）依赖 E-12 Redis 但可在 Day 3 后并行；W-22（UI）在 E-20 完成后联调。Connector 不阻塞其他 Epic 的关键路径。

### 第 1 周前半：基础设施 + 无依赖项

| 时段 | 主线 | 官网 |
|------|------|------|
| Day 1-2 | **E-11** RBAC + 身份、**E-12** Redis + 已读 + Typing、**E-19** Tauri 项目初始化 + 配对 + 目录挂载 | **W-19** Cookie 横幅（无依赖）、W-15 成员面板可先做 UI 框架 |
| Day 3 | **E-13** Notion 连接器、**E-14** 语义文档 CTO 审批、**E-19** 文件操作 API + 本地 HTTP 服务 | **W-16** WS 客户端（E-12 完成后联调） |

### 第 1 周后半：连接器 + 编排 + 生命周期

| 时段 | 主线 | 官网 |
|------|------|------|
| Day 4 | **E-14** 编排编码、**E-15** Agent 生命周期 + 共享包、**E-20** 配对 API + 设备表 | **W-15** 联调 E-11、**W-17** Notion UI |
| Day 5 | **E-16** 邮件通知、**E-20** 收据端点 + 执行代理 + Trust 集成 | **W-18** Agent 详情 + 收据 + 共享包迁移 |

### 第 2 周前半：收据 + 合规 + Connector 联调

| 时段 | 主线 | 官网 |
|------|------|------|
| Day 6 | **E-17** 收据权限 + 数据保留、**E-19** 更新签名 + 威胁模型文档 | **W-19** 通知偏好联调 E-16、**W-22** 配对 UI + 设备管理 |
| Day 7 | **E-18** 反滥用 + UGC | **W-20** B 类 UI + 编排增强、**W-22** 对话确认卡片扩展 |

### 第 2 周后半：收尾 + 联调 + 回归

| 时段 | 主线 | 官网 |
|------|------|------|
| Day 8-9 | 全量测试 + Connector 端到端联调 + 修 Bug | **W-21** 帮助中心 + UGC UI、**W-22** 联调 E-19/E-20 |
| Day 10-12 | 跨团队联调 + Connector 构建签名 + CTO 验收 | 跨团队联调 + CTO 验收 |

### 依赖关系图（关键路径加粗）

```
E-11 ──────────────────────► W-15
E-12 ──────────────────────► W-16
E-12 ──────────────────────► E-20 (Redis Pub/Sub)
E-13 ──────────────────────► W-17
E-14 (文档先行) ───────────► W-20
**E-15 ──────────────────────► W-18**（共享包为关键路径）
E-16 ──────────────────────► W-19 (通知偏好部分)
E-17 ──────────────────────► W-18 (收据部分)
E-18 ──────────────────────► W-21 (UGC 部分)
**E-19 + E-20 ────────────────► W-22**（桌面 Connector 全链路）
E-19 ──── 无前置依赖，Day 1 并行启动
W-19 Cookie 横幅 ──── 无依赖，Day 1 启动
```

---

## 6. V1.3.1 验收清单

### 6.1 产品旅程增强验收

- [ ] 第三章增强：两人同会话可见已读回执 + Typing indicator + 实时 Presence
- [ ] 第二章增强：多步编排部分成功 → 已完成步骤可查 → 失败步骤可重试/换 Agent
- [ ] 第二章增强：B 类定时任务创建 → 自动执行 → 历史可查
- [ ] 第四章增强：Agent 代邀请 → RBAC 拦截 → 审计归因含 `delegating_user_id`
- [ ] 第五章增强：Trust 拦截 → Lease 超时 → 用户可选重试/放弃

### 6.2 连接器增强

- [ ] Notion OAuth → 列出数据库 → 查询 → 创建页面 → 收据可查
- [ ] Notion token 撤销 → 系统消息提示 → 可重新授权
- [ ] Google Calendar + Notion 在 Staging 走真实 OAuth 全链路
- [ ] **桌面 Connector 安装** → 配对码配对 → 设备表有记录 → Connector 状态「已连接」
- [ ] **桌面 Connector 目录挂载** → 仅允许挂载根内文件操作 → 越权路径 403
- [ ] **桌面 Connector 端到端** → Web 触发文件列表 → Connector 本机执行 → 结果返回 Web → 主网收据+审计可查
- [ ] **桌面 Connector 写入** → Trust 确认卡片 → 用户确认 → 文件写入 → 收据
- [ ] **桌面 Connector 解绑** → Web 解绑设备 → Connector 端断开 → 后续请求拒绝
- [ ] **桌面 Connector 离线** → 对话中展示引导卡片（非静默失败）
- [ ] 构建产出 macOS + Windows 签名包，体积 < 15MB

### 6.3 Trust + 安全

- [ ] RBAC 全部 6 行权限均有路由绑定 + 403 测试
- [ ] 分级限流（注册/消息/搜索/调用）均有 429 + 人话文案
- [ ] UGC 举报 + 管理员隐藏端到端

### 6.4 通知

- [ ] 邮件通知 6 种模板三语可发
- [ ] 用户可按类型关闭邮件通知
- [ ] Agent 状态变更通知（应用内 + 邮件）

### 6.5 数据与合规

- [ ] 收据权限矩阵：3 种角色看到不同字段集
- [ ] 数据保留矩阵文档全部类目有值
- [ ] Cookie 同意横幅首次访问展示 → 选择后不再出现
- [ ] PostHog 仅在用户同意分析 Cookie 后加载

### 6.6 Agent 生命周期

- [ ] Agent 维护中 → 新请求拒绝 + 进行中 run 不受影响
- [ ] 版本更新 → changelog 可查 → 近期用户收到通知
- [ ] reason_codes 共享包编译通过

### 6.7 非功能

- [ ] Redis 广播：模拟多副本 WS 扇出成功
- [ ] 并发闸门 Redis 化：多副本下限流一致
- [ ] `tsc --noEmit` 零错误
- [ ] `next build` 成功
- [ ] 全量测试通过率 ≥ 97%

### 6.8 官网

- [ ] 帮助中心新增 5 篇文章三语完整
- [ ] 成员列表展示 display_name + email_masked
- [ ] WS 通道接入 + SSE fallback

---

## 7. V1.3.1 不纳入（明确排除）

| 排除项 | 原因 |
|--------|------|
| 完整编排 DSL / 可视化编排 | V1.4+ 范围 |
| 企业 SSO | V1.4+ 范围 |
| RTL 布局 | P2-2，依赖 i18n 策略成熟 |
| IM 桥 / 白标 / TEE | 远期规划 |
| 完整反滥用（验证码、行为分析） | V1.3.1 仅做分级限流最小集 |

---

## 8. 发布前运维/部署清单（V1.3 + V1.3.1 统一执行）

> **执行时机**：V1.3.1 全部 Epic 完成 + CTO 验收通过后，统一执行以下清单。

### 8.1 数据库

- [ ] 执行 `npm run db:migrate` 应用 0016~0033 全部迁移（V1.3 + V1.3.1）
- [ ] 验证迁移幂等性——对已迁移库重跑不报错
- [ ] 确认 `reset.ts` 包含所有新建表的 TRUNCATE

### 8.2 环境变量

| 变量 | 用途 | 必须 |
|------|------|------|
| `GOOGLE_OAUTH_CLIENT_ID` | Google Calendar OAuth | ✅ |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google Calendar OAuth | ✅ |
| `GOOGLE_OAUTH_REDIRECT_URI` | Google Calendar OAuth | ✅ |
| `NOTION_CLIENT_ID` | Notion OAuth | ✅ |
| `NOTION_CLIENT_SECRET` | Notion OAuth | ✅ |
| `NOTION_OAUTH_REDIRECT_URI` | Notion OAuth | ✅ |
| `CONNECTOR_TOKEN_ENCRYPTION_KEY` | 连接器 token 加密（≥32 字符） | ✅ |
| `JWT_SECRET` | 认证 | ✅ |
| `REDIS_URL` | Redis 连接（默认 `redis://localhost:6379`） | ✅ |
| `RESEND_API_KEY` | 邮件通知 | ✅ |
| `FOUNDER_DASHBOARD_USER_IDS` | 逗号分隔 UUID | ✅ |
| `DIRECTORY_RANKING_ADMIN_USER_IDS` | 逗号分隔 UUID | ✅ |
| `RATE_LIMIT_MESSAGE_PER_MIN` | 消息限流（默认 30） | 可选 |
| `RATE_LIMIT_SEARCH_PER_MIN` | 搜索限流（默认 60） | 可选 |
| `RATE_LIMIT_REGISTER_PER_HOUR` | 注册限流（默认 10） | 可选 |
| `CONNECTOR_UPLOAD_DIR` | 文件上传目录 | 可选 |
| `WS_FALLBACK_TO_SSE` | WS 降级开关 | 可选 |
| `DESKTOP_CONNECTOR_PAIRING_SECRET` | 配对码 HMAC 密钥 | ✅ |
| `DESKTOP_CONNECTOR_DEVICE_SECRET` | 收据签名校验密钥 | ✅ |
| `DESKTOP_CONNECTOR_DOWNLOAD_URL_MAC` | macOS 下载链接（GitHub Releases） | ✅ |
| `DESKTOP_CONNECTOR_DOWNLOAD_URL_WIN` | Windows 下载链接（GitHub Releases） | ✅ |

### 8.3 Staging 联调

- [ ] Google Calendar OAuth → 真实 API → 收据全链路
- [ ] Notion OAuth → 列出数据库 → 查询 → 创建页面 → 收据全链路
- [ ] 连接器撤销/过期/scope 越权负例各一条
- [ ] WS 广播：两终端同会话已读 + Typing
- [ ] B 类定时任务：创建 → 等待执行 → 收据产生
- [ ] 桌面 Connector：配对 → 目录挂载 → 文件列表 → 文件读取 → 文件写入（含 Trust 确认） → 收据全链路
- [ ] 桌面 Connector：解绑后请求被拒 → 重新配对可恢复

### 8.4 性能实测

- [ ] `npm run lighthouse:gate` 确认 Performance ≥ 90
- [ ] 消息 WS 送达 P95 < 3s
- [ ] 目录搜索 P95 < 500ms

### 8.5 A11y 抽检

- [ ] 至少一条关键路径 VoiceOver / NVDA 人工验证
- [ ] 新增模态（定时任务弹窗、举报弹窗、Cookie 横幅）焦点管理正确

### 8.6 移动端抽检

- [ ] iOS Safari 核心路径无横向滚动
- [ ] Android Chrome 核心路径无横向滚动
- [ ] Cookie 横幅在移动端可正常交互

### 8.7 种子数据 & 演示

- [ ] 预置 3 个种子 Agent 覆盖 §6 验收场景
- [ ] 创建演示用 Space + 2 个测试用户
- [ ] 配置至少 1 个 B 类定时任务作为演示

### 8.8 安全

- [ ] 所有环境变量中的 secret 不出现在前端 bundle
- [ ] `CONNECTOR_TOKEN_ENCRYPTION_KEY` 使用强随机值（非默认值）
- [ ] 限流生效验证（手动触发 429）
- [ ] 桌面 Connector 更新包签名验证（篡改后拒绝安装）
- [ ] 桌面 Connector path traversal 防御（`../../etc/passwd` 类请求被拦截）
- [ ] 桌面 Connector 威胁模型文档 `docs/Desktop-Connector-Threat-Model-v1.md` 完成且经安全评审

### 8.9 回滚预案

- [ ] 数据库迁移有对应的 rollback SQL 或确认 `ALTER TABLE ADD COLUMN` 可忽略
- [ ] Redis 不可用时的降级逻辑（WS 回退 SSE、限流回退进程内、并发闸门回退进程内）
- [ ] 邮件服务不可用 → 静默降级至仅应用内通知
- [ ] 桌面 Connector 不可用时 → 对话内展示引导卡片而非静默失败

---

*文档版本：v1（2026-03-24）*  
*签发：CTO（联合创始人 / 首席技术官）*  
*状态：即刻生效，两团队按本文档 §5 推荐序列启动，V1.3.1 全部完成后统一执行 §8 发布前清单*
