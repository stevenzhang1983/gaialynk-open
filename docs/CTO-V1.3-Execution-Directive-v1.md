# GaiaLynk V1.3 执行指令 v1

> **签发人**：CTO  
> **签发日期**：2026-03-22  
> **执行团队**：主线开发团队、官网开发团队  
> **依据文档**：`CTO-V1.3-Product-and-Web-Release-Spec.md`（主规格）、`CTO-V1.3-Product-and-Web-Release-Spec-Supplement-v1.md`（补充规格 v1.2）、`Agent-IM-Product-Plan.md`（长期规划）  
> **性质**：**指令文档，各团队按序执行，完成后逐项向 CTO 报告验收**

---

## 0. 阅读须知

### 0.1 文档定位

本文档是 V1.3 的 **唯一执行权威**。它将 V1.3 主规格 + 补充规格中的产品定义，翻译为 **可按序执行、可逐项验收** 的 Epic/Task 清单，供两个团队并行推进。

### 0.2 阅读规则

- 标记 `[主线]` 的任务由主线开发团队执行，标记 `[官网]` 的由官网开发团队执行，标记 `[协同]` 的需两个团队配合。
- 每个任务包含：**做什么**、**怎么做**、**交付物**、**验收条件**、**依赖项**。
- **分期标记**：`V1.3` = 最小发布门槛，`V1.3.1` = 可在首版之后 1-2 周内补齐。
- 没有绝对时间限定，但 **依赖关系是硬性的**，不可跳过。

### 0.3 V1.3 vs V1.3.1 发布门槛定义

| V1.3（最小发布线） | V1.3.1（首版后补齐） |
|---|---|
| 单 Agent 全链路真实可用（旅程第一章） | B 类定时召回完整版 |
| 多 Agent 官方动态拓扑至少一条链路（第二章） | 拓扑包安装/执行（开发者向） |
| 至少 1 个 SaaS 连接器端到端（Google Calendar） | 第 2 个 SaaS 连接器（Notion） |
| Space + 多人会话基础（第三章 MVP） | 完整 Presence + typing indicator |
| Trust 确认/人审的会话内卡片 | 收据用户可见切片完整字段权限矩阵 |
| 认证方式定稿 + 登录/注册 | 企业 SSO |
| 浏览器文件能力 | 轻量桌面 Connector |
| 通知中心（产品内） | 邮件通知模板 |
| 最小埋点 + Founder 看板 | 完整事件字典 + 反滥用 |
| 官网应用场景/路线图重排 | 帮助中心完整 IA |

---

## 1. V1.3 决策登记表（Decision Register）

> 以下为分散在主规格与补充文档中的关键产品决策汇总。各 Epic 须以此表为单一事实来源。

| ID | 决策点 | 选定方案 | 来源 | 影响 Epic |
|----|--------|---------|------|----------|
| **D-AUTH-1** | V1.3 认证方式 | 邮箱+密码 + Google OAuth（GitHub 可选） | 补充§15 P0-2 | E-1 |
| **D-AUTH-2** | 企业 SSO | **不纳入 V1.3**，帮助中心标 In Progress | 补充§15 P0-2 | E-1 |
| **D-AUTH-3** | 用户–多 Space | 一人可属多 Space，首个为默认个人空间 | 补充§15 P0-1 | E-1, E-2 |
| **D-SPACE-1** | Space 角色矩阵 | `owner` / `admin` / `member` / `guest` | 补充§15 P0-1 | E-2 |
| **D-SPACE-2** | 邀请机制 | 链接邀请（V1.3）；邮件邀请（V1.3.1） | 补充§15 P0-1 | E-2 |
| **D-RT-1** | 实时通道 | WebSocket（SSE fallback） | 补充§15 P0-3 | E-3 |
| **D-RT-2** | 消息状态机 | 发送中 → 已送达服务器 → 失败可重试 | 补充§15 P0-3 | E-3 |
| **D-RT-3** | 已读回执 | V1.3.1 | 补充§15 P0-3 | — |
| **D-RT-4** | Typing indicator | V1.3.1 | 补充§15 P0-3 | — |
| **D-ORC-1** | 单步「完成」判定 | B: Agent 返回终态 + 输出契约校验 | 补充§17.1 D1 | E-5 |
| **D-ORC-2** | 步骤间数据流 | 结构化输出 → 字段映射模板；V1.3 不允许用户编辑中间稿 | 补充§17.1 D2 | E-5 |
| **D-ORC-3** | 部分成功策略 | A: 已交付步骤结果即时展示，后续失败不回收 | 补充§17.1 D3 | E-5 |
| **D-ORC-4** | 单步超时 | 超时后暂停 → 用户选「重试/换 Agent/放弃」 | 补充§17.1 D4 | E-5 |
| **D-ORC-5** | 重试语义 | 新 `run_id`、重复计量，有幂等键 | 补充§17.1 D5 | E-5 |
| **D-ORC-6** | 用户取消 | 正在执行步骤发中断信号；排队步骤丢弃 | 补充§17.1 D6 | E-5 |
| **D-ORC-7** | 拓扑包 vs 官方动态 | 共用同一套运行时语义 | 补充§17.1 D7 | E-5 |
| **D-ORC-8** | Trust 暂停/恢复 | 人审期间编排状态 `awaiting_human_review`，计时器暂停，通过后同 `run_id` 续接 | CTO 评审缺口 A | E-5, E-6 |
| **D-TRUST-1** | Trust 用户面呈现 | 拦截/确认卡片组件 + `reason_codes` 人话映射表 | 补充§15 P1-1 | E-6 |
| **D-AGENT-1** | 代理邀请授权模式 | 显式委托（用户授予 Agent「可邀请」权限） | 补充§17.2 A1 | E-2, E-5 |
| **D-AGENT-2** | 授权继承 | 被邀请 Agent 的 actor 记为代理 Agent + `delegating_user_id` | 补充§17.2 A2 | E-5, E-8 |
| **D-AGENT-3** | 上下文可见性 | 被拉入 Agent 默认仅可见邀请之后的消息子集 | 补充§17.2 A3 | E-5 |
| **D-AGENT-4** | 撤销后行为 | 仅禁止新邀请；已入群 Agent 保留至会话结束 | 补充§17.2 A6 | E-2 |
| **D-LISTING-1** | 调度模式 | V1.3 仅交付池化路由；租约模式 V1.3.1 | 主规格§5.1.6 | E-7 |
| **D-LISTING-2** | `Invocation-Context` | 每次转发自动附加 `gaia_user_id`, `conversation_id`, `run_id`, `invocation_source`, `trace_id` | 主规格§5.1.9 | E-7 |
| **D-CONN-1** | V1.3 SaaS 选型 | Google Calendar（V1.3）+ Notion（V1.3.1） | 主规格§1.1 B.3.1 | E-4 |
| **D-CONN-2** | 桌面 Connector | V1.3.1 | CTO 发布门槛 | — |
| **D-DATA-1** | 消息正文保留 | 待法务定稿；V1.3 须输出《数据保留矩阵》草案 | 补充§17.3 | E-8 |
| **D-RANK-1** | 目录默认排序 | 相关性 primary + 信任等级 tie-breaker | 补充§17.4 R1 | E-9 |
| **D-RANK-2** | 未验证 Agent | 不得进入「新手友好」运营位 | 补充§17.4 R2 | E-9 |
| **D-MOBILE-1** | 移动端策略 | Responsive Web；不承诺原生 App；PWA 可选 | 补充§7 | 全局 |

---

## 2. 主线开发团队 Epic 清单

> 按依赖顺序编排。前置依赖硬性不可跳过。

### E-1｜认证与身份基础设施 `[主线]` — V1.3

**前置依赖**：无（现有 T-5.3 auth 模块为基础）

**做什么**：统一认证方式，建立单一可信用户主体（`user_id`）贯穿产品登录、Space 成员、会话参与者、连接器授权、审计 actor。

**怎么做**：

1. **登录方式定稿**：邮箱+密码 + Google OAuth（沿用现有 `auth.routes.ts`）。GitHub OAuth 作为可选保留，V1.3 不硬性要求。
2. **注册流程精简**：邮箱注册 → 邮箱验证（可后补）→ 自动创建默认个人 Space → 进入产品区首屏。**删除角色选择步骤**（Provider/Consumer 身份由后续行为自动识别或在设置中切换）。
3. **用户–Space 归属模型**：
   - `users` 表增加 `default_space_id`
   - `spaces` 表新建（`id`, `name`, `type: personal|team`, `created_by`, `created_at`）
   - `space_members` 表新建（`space_id`, `user_id`, `role: owner|admin|member|guest`, `joined_at`）
   - 注册时自动创建 `type=personal` 的默认 Space，用户为 `owner`
4. **OAuth 浏览器落地**：完善 OAuth callback 支持 302 重定向至官网 `/{locale}/app/auth/callback`（沿用 T-5.3 / T-4.6 约定）
5. **会话 actor 类型**：审计中 `actor_type` 枚举增加 `user`（人类）、`agent`（Agent 代理），`actor_id` 指向 `users.id` 或 `agents.id`

**交付物**：
- DB 迁移：`0016_spaces_and_members.sql`
- `modules/spaces/space.store.ts`（Space CRUD + 成员管理）
- `modules/auth/` 更新（注册自动创建 Space、OAuth 302 重定向）
- API：`POST/GET /api/v1/spaces`、`POST /api/v1/spaces/:id/members`、`GET /api/v1/spaces/:id/members`
- 更新 `ACTOR_CONTEXT` 解析逻辑

**验收条件**：
- [ ] 邮箱注册 → 自动创建个人 Space → 登录后 `GET /api/v1/spaces` 返回至少一个 Space
- [ ] Google OAuth 浏览器场景 → 302 → 官网落地页 → cookie 写入 → 进入产品区
- [ ] 全链路审计中 `actor_id` 可解析到真实登录身份
- [ ] 现有 T-5.1 ~ T-5.6 API 不因本次改动而回归失败

---

### E-2｜Space / 多人协作 / RBAC `[主线]` — V1.3

**前置依赖**：E-1

**做什么**：支撑 §2 第三至五章的多人协作——用户可创建团队 Space、邀请成员、在 Space 内发起多人+Agent 会话，权限与 Trust 策略可控。

**怎么做**：

1. **Space 生命周期**：
   - 创建团队 Space（`type=team`，创建者为 `owner`）
   - 归档（`status=archived`，仅 owner/admin）
   - 离开（member 自行退出，owner 不可离开须先转让）
2. **邀请流程**：
   - `POST /api/v1/spaces/:id/invitations`：生成邀请链接（含 token、过期时间、预设角色）
   - `POST /api/v1/spaces/join`：接受邀请（校验 token → 加入 Space）
   - 邀请事件写入审计
3. **角色权限矩阵**：

   | 操作 | owner | admin | member | guest |
   |------|:-----:|:-----:|:------:|:-----:|
   | 邀请他人 | ✓ | ✓ | ✗ | ✗ |
   | 拉 Agent 入会话 | ✓ | ✓ | ✓ | ✗ |
   | 授予 Agent「可邀请」权限 | ✓ | ✓ | ✗ | ✗ |
   | 触发连接器 | ✓ | ✓ | ✓ | ✗ |
   | 审批高风险操作 | ✓ | ✓ | ✗ | ✗ |
   | 导出审计 | ✓ | ✓ | ✗ | ✗ |
   | 修改 Space 设置 | ✓ | ✓ | ✗ | ✗ |

4. **会话与 Space 绑定**：
   - `conversations` 表增加 `space_id`（nullable，个人对话可为空）
   - 会话内可见性规则：Space 成员可见该 Space 下的会话（按角色过滤）
   - 非成员不可访问（API 层校验）
5. **多人会话**：
   - `participants` 表支持多个 `user` 类型参与者
   - 系统消息模板：「{用户名} 加入了会话」「{用户名} 邀请了 {Agent名}」
   - @ 提及（`@user`、`@agent`）的解析与通知触发

**交付物**：
- DB 迁移：`0017_space_invitations_and_rbac.sql`
- `modules/spaces/invitation.store.ts`
- `modules/spaces/rbac.middleware.ts`（权限校验中间件）
- API：邀请、加入、角色变更、Space 设置
- 会话创建 API 增加 `space_id` 参数
- `participants` 表 + API 支持多 user
- 审计事件类型增量：`space.member_joined`、`space.member_left`、`conversation.participant_added`

**验收条件**：
- [ ] 端到端脚本：用户 A 创建团队 Space → 生成邀请链接 → 用户 B 接受 → 双方在同一 Space 下创建会话 → 双方消息互相可见
- [ ] guest 尝试邀请他人 → 403 + 人话原因
- [ ] 非 Space 成员尝试访问会话 → 403
- [ ] 审计中邀请/加入/退出事件完整

---

### E-3｜实时消息推送与 Presence `[主线]` — V1.3

**前置依赖**：E-1, E-2

**做什么**：多人会话的实时消息送达、消息状态机、基础 Presence。

**怎么做**：

1. **WebSocket 网关**（SSE fallback）：
   - 新建 `modules/realtime/ws.gateway.ts`
   - 连接时校验 JWT → 订阅用户所属会话的频道
   - 消息写入 DB 后广播到同会话所有已连接客户端
   - 断线重连：客户端带 `last_event_id`，服务端补推缺失消息
2. **消息状态机**（用户可见）：
   - `sending`（客户端发出、等待服务端 ACK）
   - `delivered`（服务端已持久化、广播已发出）
   - `failed`（超时或服务端拒绝，可重试）
   - `messages` 表增加 `status` 字段
3. **基础 Presence**：
   - `presence` 表或 Redis 存储（`user_id`, `space_id`, `status: online|away`, `last_seen_at`）
   - WebSocket 连接时标记 online，断开后 30s 标记 away
   - API：`GET /api/v1/spaces/:id/presence`
   - V1.3.1 再做 typing indicator 和精细状态
4. **性能指标**：同会话多设备消息送达 ≤3s P95

**交付物**：
- `modules/realtime/ws.gateway.ts`
- `modules/realtime/presence.store.ts`
- 消息写入路径增加广播逻辑
- `messages` 表增加 `status` 字段（迁移 `0018_message_status_and_presence.sql`）
- 客户端协议文档

**验收条件**：
- [ ] 两个浏览器 Tab 同一会话 → 一方发消息 → 另一方 ≤3s 内收到
- [ ] 断网 → 恢复 → 缺失消息补推
- [ ] Presence API 返回在线用户列表
- [ ] 消息发送失败 → 客户端可见 `failed` 状态 + 重试按钮

---

### E-4｜连接器：真实执行层 `[主线]` — V1.3（Google Calendar）/ V1.3.1（Notion）

**前置依赖**：E-1

**做什么**：将现有模拟执行升级为真实执行，V1.3 交付 Google Calendar 端到端。

**怎么做**：

1. **云代理架构**：
   - 新建 `modules/connectors/cloud-proxy/` 目录
   - `cloud-proxy.router.ts`：统一入口，根据 `connector_type` 分派
   - `google-calendar.adapter.ts`：Google Calendar OAuth + API
   - `notion.adapter.ts`（V1.3.1）
2. **Google Calendar 集成**：
   - OAuth 2.0 流程（scope: `calendar.readonly` 或 `calendar.events`）
   - 至少一类可核验 API 调用：列出近期事件 **或** 创建日历事件
   - 所有 client_secret 存于服务端环境变量，**禁止**暴露到浏览器
   - Token 刷新、撤销与过期处理
3. **与 connector 模型对齐**：
   - `connector_authorizations` 表扩展：`connector_type: local|cloud_saas`、`provider: google_calendar|notion|...`、`oauth_token_encrypted`（加密存储）、`oauth_refresh_token_encrypted`、`oauth_expires_at`
   - scope 语义扩展：`calendar.read`、`calendar.write` 等映射到现有 `scope_level` + `scope_value`
4. **收据**：
   - 每次对外 API 调用产生 `external_action_receipt`（`receipt_id`, `connector_authorization_id`, `action`, `request_hash`, `response_status`, `timestamp`, `env_signature`）
   - 与审计事件关联
5. **浏览器文件能力**（V1.3）：
   - `POST /api/v1/connectors/file-upload`：接收用户上传文件 → 存对象存储（或本地临时存储）→ 返回 `file_ref_id`
   - 会话消息可携带 `file_ref_id`，Agent 可读取

**交付物**：
- DB 迁移：`0019_connector_cloud_saas.sql`
- `modules/connectors/cloud-proxy/` 全套
- `modules/connectors/file-upload.ts`
- API：OAuth 发起、OAuth 回调、执行 Calendar 动作、文件上传
- 收据表与查询 API

**验收条件**：
- [ ] 用户在产品内完成 Google Calendar OAuth → 列出近期日程 **或** 创建一条日历事件 → 结果写回会话
- [ ] 撤销授权后再次调用 → 提示重新授权
- [ ] 每次 API 调用有对应收据记录
- [ ] client_secret 不在浏览器可见
- [ ] 用户可上传文件 → Agent 可基于文件内容响应（至少一条路径）

---

### E-5｜多 Agent 编排运行时 `[主线]` — V1.3

**前置依赖**：E-1, E-3

**做什么**：实现官方动态拓扑推荐 + 编排运行时，让 §2 第二章「多步拓扑」可用。

**怎么做**：

1. **意图路由引擎**：
   - `modules/orchestration/intent-router.ts`
   - 输入：用户自然语言消息 + 目录可用 Agent 集合
   - 输出：推荐的 Agent 链路（步骤 1→2→...→N），每步含 `agent_id`、`expected_input`、`expected_output`
   - V1.3 实现：基于 LLM 分析 + Agent 能力标签匹配（不需要复杂 DAG）
2. **编排运行时**：
   - `modules/orchestration/orchestration.engine.ts`
   - 顺序执行各步骤；每步调用 A2A Gateway
   - **步骤状态机**：`pending` → `running` → `completed` | `failed` | `awaiting_user` | `awaiting_human_review`
   - **D-ORC-1**：步骤完成判定 = Agent 返回终态 + 输出契约校验（schema 非空字段）
   - **D-ORC-3**：部分成功 → 已完成步骤结果即时展示
   - **D-ORC-4**：超时 → 暂停，等用户选择
   - **D-ORC-8**：Trust `need_human_review` → 编排状态 `awaiting_human_review`，计时器暂停
   - **D-ORC-5**：重试 → 新 `run_id`，重复计量
   - **D-ORC-6**：取消 → 中断信号 + 丢弃排队步骤
3. **编排数据模型**：
   - `orchestration_runs`（`id`, `conversation_id`, `user_id`, `topology_source: dynamic|package`, `steps_json`, `current_step`, `status`, `created_at`, `finished_at`）
   - `orchestration_steps`（`id`, `run_id`, `step_index`, `agent_id`, `status`, `input_json`, `output_json`, `run_id_per_step`, `started_at`, `finished_at`）
4. **API**：
   - `POST /api/v1/orchestrations/recommend`：触发意图路由 → 返回推荐链路
   - `POST /api/v1/orchestrations/execute`：确认链路 → 开始执行
   - `GET /api/v1/orchestrations/:id`：编排状态与各步进度
   - `POST /api/v1/orchestrations/:id/steps/:stepIndex/retry`：重试某步
   - `POST /api/v1/orchestrations/:id/cancel`：取消

**交付物**：
- DB 迁移：`0020_orchestration.sql`
- `modules/orchestration/` 全套（intent-router, engine, store）
- 编排与 Trust 引擎集成（`awaiting_human_review` 状态切换）
- API 完整
- 协议文档：编排步骤状态机

**验收条件**：
- [ ] 用户发送自然语言 → 系统推荐 2-3 步 Agent 链路 → 用户确认 → 顺序执行 → 各步结果逐步展示
- [ ] 某步失败 → 用户可见哪一步失败 + 重试/换 Agent 选项
- [ ] 某步触发人审 → 编排暂停 → 审批通过 → 续接执行
- [ ] 用户取消 → 正在执行步骤收到中断 → 排队步骤丢弃
- [ ] 审计中每步有独立 `run_id`，可追溯

---

### E-6｜Trust Policy 用户面 + 声誉闭环 `[主线]` — V1.3

**前置依赖**：E-5（与编排集成）

**做什么**：让 Trust 决策对用户可理解——确认/人审/拒绝的会话内卡片，`reason_codes` 人话翻译。

**怎么做**：

1. **Trust 决策用户面输出**：
   - `trust.engine.ts` 输出增加 `user_facing_message` 字段：由 `reason_codes` 映射到三语人话模板
   - 映射表：`modules/trust/reason-codes-i18n.ts`（如 `risk_high_requires_confirm` → 「该操作风险较高，需要您确认后才能继续」）
2. **确认/人审 API 增强**：
   - `GET /api/v1/review-queue` 增加 `user_facing_summary` 字段
   - `POST /api/v1/invocations/:id/confirm` 增加 `user_decision_reason`（可选）
3. **声誉闭环**：
   - 用户反馈（「有用/没用」+ 原因）→ `agent_run_feedback` 已有
   - 一定量「没用」+ 同类原因 → 自动触发复测队列
   - 举报成立 → 目录状态变更 + 历史用户通知
   - `modules/feedback/reputation-loop.service.ts`
4. **Agent 卡片信任徽章**：
   - `GET /api/v1/agents/:id` 增加 `trust_badge`（`unverified` | `consumer_ready` | `high_sensitivity_enhanced`）
   - 由上架分级 + 评测结果 + 近期声誉综合计算

**交付物**：
- `modules/trust/reason-codes-i18n.ts`
- `modules/feedback/reputation-loop.service.ts`
- API 增强：review-queue user_facing、agent trust_badge
- 通知触发：举报成立 → 历史用户通知

**验收条件**：
- [ ] 高风险操作触发 Trust 拦截 → 会话内卡片展示人话原因 + 确认/拒绝按钮
- [ ] Agent 卡片展示对应信任徽章
- [ ] 连续 N 次「没用」反馈 → 触发自动复测（队列可查）
- [ ] `reason_codes` 三语映射完整

---

### E-7｜Agent 调用网关增强（Invocation Context + 池化路由） `[主线]` — V1.3

**前置依赖**：E-1

**做什么**：实现 §5.1.9 的平台侧能力——Invocation Context 统一注入、池化路由、排队/超时/429。

**怎么做**：

1. **Invocation Context 注入**：
   - 每次 A2A 转发，网关自动附加 HTTP Header `X-GaiaLynk-Invocation-Context`（JSON）：
     ```json
     {
       "gaia_user_id": "...",
       "conversation_id": "...",
       "run_id": "...",
       "invocation_source": "session",
       "trace_id": "..."
     }
     ```
   - B 类调用额外携带 `subscription_id`
2. **逻辑 Agent 与多实例**：
   - `agents` 表增加 `max_concurrent`（默认 1）、`queue_behavior: queue|fast_fail`、`timeout_ms`
   - `agent_endpoints` 新表（`agent_id`, `endpoint_url`, `status: healthy|unhealthy`, `last_health_check_at`）
   - 消费者在目录中看到一张卡片；后台可有 N 个 endpoint
3. **池化路由**：
   - `modules/gateway/pool-router.ts`
   - 选取 `status=healthy` 的 endpoint，round-robin 或 least-connections
   - 失败自动切换下一个 endpoint
4. **排队与限流**：
   - 达到 `max_concurrent` 时：若 `queue_behavior=queue`，入公平队列（per-agent）；若 `fast_fail`，返回 429
   - 超时处理：`timeout_ms` 到期 → 取消调用 → 返回超时错误
   - 用户侧：429 → 「当前排队较长」+ 预估等待 **或** 「换低负载 Agent」
5. **上架表单字段**：
   - Provider 控制台增加：`max_concurrent`、`queue_behavior`、`timeout_ms`、`supports_scheduled`、`memory_tier`（none|session|user_isolated）
   - 未填项使用保守默认值

**交付物**：
- DB 迁移：`0021_agent_endpoints_and_listing.sql`
- `modules/gateway/pool-router.ts`
- `modules/gateway/invocation-context.ts`
- A2A Gateway 改造：注入 Context + 池化路由 + 排队
- Provider API 增强（endpoint 管理）
- 上架表单字段 API

**验收条件**：
- [ ] Agent 声明 `max_concurrent=1`，两个用户同时调用 → 一个正常响应，一个排队或 429
- [ ] 排队中的调用在超时内完成 → 正常返回
- [ ] 多 endpoint Agent → 一个 endpoint 挂掉 → 自动切换到另一个
- [ ] 每次调用的 `X-GaiaLynk-Invocation-Context` 头可在审计中查到

---

### E-8｜通知系统 + 数据保留矩阵 `[主线]` — V1.3

**前置依赖**：E-1, E-3

**做什么**：产品内通知中心（任务完成、待审批、配额告警等）；《数据保留矩阵》草案。

**怎么做**：

1. **通知中心**（沿用现有 `notifications` 模块增强）：
   - `notifications` 表增加 `type` 枚举（`task_completed`, `review_required`, `connector_expiring`, `quota_warning`, `agent_status_change`）
   - `deep_link`（产品内链接：跳到具体会话/run/审批）
   - `read_at`（已读标记）
   - API：`GET /api/v1/notifications`（分页、未读过滤）、`POST /api/v1/notifications/:id/read`、`POST /api/v1/notifications/read-all`
2. **触发器**：
   - 审批创建 → 通知
   - 编排步骤完成/失败 → 通知
   - 配额 80%/100% → 通知
   - 连接器即将过期 → 通知
3. **通知偏好**（沿用现有 `notification_preferences`）：
   - 勿扰时段、渠道开关
4. **数据保留矩阵草案**：产出 `docs/Data-Retention-Matrix-Draft-v1.md`，列出各数据类目的默认保留期占位（待法务定稿）

**交付物**：
- `notifications` 表扩展迁移
- 触发器集成到各模块
- 通知 API
- `docs/Data-Retention-Matrix-Draft-v1.md`

**验收条件**：
- [ ] 审批事件触发 → 通知中心出现未读通知 → 点击跳转到对应审批
- [ ] 标记已读后角标消失
- [ ] 数据保留矩阵草案覆盖所有 §17.3 列出的类目

---

### E-9｜目录排序与推荐策略 `[主线]` — V1.3

**前置依赖**：E-6（Trust 徽章）、E-7（Agent 数据模型增强）

**做什么**：实现 §17.4 的目录搜索排序、运营位、与信任等级一致的排序规则。

**怎么做**：

1. **搜索排序**：关键词相关性 primary + 信任等级 tie-breaker（`consumer_ready` > `unverified`）
2. **运营位**：「热门」「新手友好」「低延迟」各有入池条件（最低评测分、最近错误率、上架时长）
3. **新上架冷启动**：7 天「新上架」曝光位，capped 展示次数，须满足最低安全门槛
4. **未验证 Agent**：不得进入默认「新手友好」运营位；显式筛选「全部」时可见
5. **降级**：推荐服务失败 → 回退纯字母序 + 信任过滤

**交付物**：
- `modules/directory/ranking.service.ts`
- 运营位配置（admin 可配置入池条件）
- `docs/Directory-Ranking-Policy-v1.md`

**验收条件**：
- [ ] 同一查询下 `unverified` Agent 不排在 `consumer_ready` 之前
- [ ] 运营位「新手友好」中无 `unverified` Agent
- [ ] 推荐服务挂掉 → 列表回退到安全排序，不空白

---

### E-10｜埋点与 Founder 看板 `[主线]` — V1.3

**前置依赖**：E-1

**做什么**：最小事件采集 + 内部看板，支撑 Founder 周会决策。

**怎么做**：

1. **事件字典**（最小集）：
   - `user.registered`、`user.first_conversation`、`user.first_valuable_reply`
   - `conversation.created`、`conversation.message_sent`
   - `agent.invoked`、`agent.invoked_multi_step`
   - `trust.blocked`、`trust.confirmed`、`trust.human_reviewed`
   - `connector.authorized`、`connector.action_executed`
   - `orchestration.started`、`orchestration.completed`、`orchestration.failed`
2. **漏斗定义**：
   - 官网 CTA → 注册 → 首条有价值回复 → 首次连接器 → 首次多 Agent
3. **存储**：复用现有 `analytics` 模块或简单事件表
4. **看板**：内部只读页面，展示上述指标 + 导出 CSV

**交付物**：
- 事件字典文档
- 事件采集集成（各模块 emit）
- 内部看板 API + 最小 UI（可复用现有 analytics 页面）

**验收条件**：
- [ ] 连续 7 天无人工脚本可生成周报
- [ ] 漏斗各环节数据可查

---

## 3. 官网开发团队 Epic 清单

### W-1｜应用场景页重排（总旅程） `[官网]` — V1.3

**前置依赖**：无（内容依赖主规格 §2 已定稿）

**做什么**：重写 `/use-cases` 页面，以 §2 CompanyA 总旅程六章为唯一主轴。

**怎么做**：

1. 主页面以「章节递进」版式呈现六章故事，每章一个可展开区域
2. 每章内容：场景描述、旅程画面（表格或流程图）、「这一章解锁了什么平台能力」
3. 第六章标注「愿景与展望」，子网互联/硬件不作为当期交付声明
4. 删除或重定向旧 `/use-cases/enterprise-governance` → 对应章节锚点
5. 与主应用口径一致，三语

**交付物**：
- `/use-cases/page.tsx` 重写
- 三语文案
- 旧页面重定向

**验收条件**：
- [ ] 六章叙事完整、递进清晰
- [ ] 第六章标注「展望」，不与当期能力冲突
- [ ] 三语切换无缺失

---

### W-2｜路线图页重排 `[官网]` — V1.3

**前置依赖**：无

**做什么**：重写 `/roadmap`，按 §2 用户旅程重排七大里程碑的呈现顺序，面向消费者可理解。

**怎么做**：

1. 呈现顺序不必等于 M1→M7 工程序；按「CompanyA 从单 Agent → 多 Agent → 人进群 → Agent 拉 Agent → 人裁决」排列
2. M5 子网互联工程 / M7 硬件标注为远期 / Research
3. 状态标签与主规格一致（Now / In Progress / Coming Soon / Planned / Research）
4. 内部映射参考表（工程编号 → 消费者一句话）在页内以 tooltip 或折叠区呈现

**交付物**：
- `/roadmap/page.tsx` 重写
- 里程碑数据结构更新（三语）

**验收条件**：
- [ ] 消费者能沿旅程理解「平台能力如何逐步解锁」
- [ ] M5/M7 不与当期交付混淆
- [ ] 三语完整

---

### W-3｜产品区 Space 与多人协作 UX `[官网]` — V1.3

**前置依赖**：W-3 依赖 E-1、E-2（API）

**做什么**：产品区支持 Space 切换、成员管理、多人会话 UI。

**怎么做**：

1. **Space 切换器**：顶栏或侧栏上方，显示当前 Space 名 + 下拉切换
2. **成员管理页**：`/app/settings/space/members`——成员列表、角色标签、邀请入口
3. **邀请 UI**：生成邀请链接 → 复制 → 分享
4. **多人会话 UI**：
   - 会话头部显示参与者头像列表
   - 系统消息（加入/退出/邀请）样式
   - @ 提及的自动完成（`@` 触发下拉列表）
5. **权限反馈**：无权限操作 → 灰显 + tooltip 说明

**交付物**：
- Space 切换组件
- 成员管理页面
- 邀请链接 UI
- 多人会话参与者 UI
- @ 提及自动完成

**验收条件**：
- [ ] 用户可在产品内创建团队 Space + 邀请链接
- [ ] 多人同一会话消息实时互见
- [ ] guest 操作受限 → 有清晰提示

---

### W-4｜Agent 发现与推荐 UX 升级 `[官网]` — V1.3

**前置依赖**：E-6（Trust 徽章）、E-9（排序策略）

**做什么**：升级现有 Agent 目录 UI——信任徽章、容量信号、意图路由交互。

**怎么做**：

1. **目录页增强**（沿用现有 `agent-directory.tsx`）：
   - 卡片增加信任徽章（`unverified` / `consumer_ready` / `high_sensitivity_enhanced`）
   - 容量信号：「排队预计」「低并发」（来自 E-7 `max_concurrent`）
   - 空搜索运营位：「热门」「新手友好」「低延迟」
2. **Agent 详情页增强**：
   - Tab：概览 | 能力与限制 | 隐私与数据 | 评价 | 开发者信息
   - `supports_scheduled`、记忆层级声明、超时建议
3. **意图路由交互**（支撑 E-5）：
   - 用户发送消息后，输入框上方出现「推荐方案条」（可收起）
   - 展示推荐链路（步骤 1→2→3）+ 每步 Agent 名 + 可替换下拉
   - 「确认执行」/「只要单 Agent」两个 CTA
   - 执行中：步骤进度条 + 每步可展开看状态
   - 失败：哪一步失败 + 「重试/换 Agent/反馈」

**交付物**：
- 目录页/卡片/详情页更新
- 意图路由 UI 组件
- 编排进度组件

**验收条件**：
- [ ] 从搜索到「加入会话」≤3 次点击
- [ ] 路由确认后，用户始终能回答「当前在跑哪一步、为什么卡住」
- [ ] 信任徽章与后端 `trust_badge` 一致

---

### W-5｜Trust 用户面 UI `[官网]` — V1.3

**前置依赖**：E-6

**做什么**：在会话内展示 Trust 拦截/确认/人审卡片，`reason_codes` 人话翻译。

**怎么做**：

1. **拦截/确认卡片组件**：
   - 标题 + 风险等级可视化（颜色/图标）
   - `reason_codes` 人话文案（从 E-6 的映射表读取）
   - CTA：确认 / 拒绝 / 查看详情
2. **人审任务入口**：
   - 通知中心中「待审批」类型
   - 会话内审批卡片（内嵌在消息流中）
3. **收据用户可见切片**：
   - 普通用户：收据 ID（截断）+ 时间 + 操作摘要 + 「复制完整 ID」
   - Space 管理员：额外可见 `reason_codes`、策略命中摘要

**交付物**：
- Trust 卡片组件（`components/product/chat/trust-card.tsx`）
- 人审消息卡片
- 收据摘要组件

**验收条件**：
- [ ] 可用性抽测：用户能区分「平台拦了」vs「Agent 挂了」vs「要自己点确认」
- [ ] 三语 reason_codes 映射完整

---

### W-6｜对话生命周期管理 `[官网]` — V1.3

**前置依赖**：E-3

**做什么**：对话列表、搜索、归档、导出（补充 §5）。

**怎么做**：

1. **对话列表增强**：
   - 分组：今天 / 7 天内 / 更早
   - 操作：置顶、归档、删除（二次确认）、标星
2. **全局搜索**：顶栏搜索框，按对话标题/参与者/关键词
3. **会话状态**：`active` → `archived`（只读 + 可恢复）→ `closed`（仅审计查看）
4. **导出**：Markdown / 纯文本；默认脱敏选项

**交付物**：
- 对话列表增强组件
- 搜索组件
- 导出功能

**验收条件**：
- [ ] 归档会话在默认列表不可见；搜索可选「包含归档」
- [ ] 导出内容与审计可见范围一致

---

### W-7｜错误状态与降级体验 `[官网]` — V1.3

**前置依赖**：E-5, E-7

**做什么**：所有错误 UI 有下一步动作，用户能区分平台故障/Agent 不可用/队列饱和/策略拦截。

**怎么做**：

1. **错误模式库**：按补充 §6.1 分类——平台故障、Agent 不可用、队列饱和、策略拦截、连接器问题
2. **部分成功（多步拓扑）**：汇总卡片 + 失败步可单独重试
3. **网络断线**：连接状态条 + 发送队列

**交付物**：
- 错误消息组件库
- 部分成功汇总卡片
- 离线状态条

**验收条件**：
- [ ] 所有错误 UI 带下一步动作（重试/替换/联系支持）
- [ ] 用户可区分「平台挂了」和「Agent 挂了」

---

### W-8｜通知中心 UI `[官网]` — V1.3

**前置依赖**：E-8

**做什么**：产品内通知列表、未读角标、deep link 跳转。

**怎么做**：

1. 顶栏铃铛图标 + 未读角标
2. 下拉面板：通知列表（类型图标 + 摘要 + 时间 + 已读状态）
3. 点击跳转到对应会话/run/审批
4. 「全部已读」按钮

**交付物**：
- 通知中心组件
- 与 E-8 API 对接

**验收条件**：
- [ ] 审批事件 → 通知出现 → 点击跳转到会话内审批卡片
- [ ] 关闭浏览器再打开 → 未读状态与服务器一致

---

### W-9｜新用户首启体验 `[官网]` — V1.3

**前置依赖**：E-1, W-4

**做什么**：重写 Consumer Onboarding——5 分钟内完成首次有价值对话，零前置配置。

**怎么做**：

1. **首启流程**（补充 §1.2）：
   - S0：注册/登录完成 → 产品区首屏
   - S1：（可选）一句话目标：「你今天想完成什么？」→ 预填首条消息
   - S2：二选一：「开始对话」/「浏览 Agent」
   - S3：进入主路径
2. **首屏信息架构**：
   - 主区：当前会话或「新建对话」+ 输入框
   - 次区：推荐 Agent 3-5 张卡片
   - 弱提示：连接器入口为次要 CTA
3. **空状态**：无对话/无连接器/无订阅各有对应展示

**交付物**：
- 首启流程重写
- 首屏/空状态组件

**验收条件**：
- [ ] 新用户未绑 SaaS、未装 Connector 下完成 ≥1 条有价值回复
- [ ] 首启 ≤4 屏，无强制 OAuth

---

### W-10｜用户账户与配额 UI `[官网]` — V1.3

**前置依赖**：E-1, E-8

**做什么**：账户设置、用量/配额仪表、删除账号入口。

**怎么做**：

1. 账户页：个人资料、安全、通知偏好、连接器列表、数据与隐私
2. 用量仪表：本月对话数、Agent 调用数、连接器出站调用数、进度条 + 告警
3. 删除账号：冷静期或立即删除（法务定稿）

**交付物**：
- `/app/settings/` 页面套件
- 配额 UI 组件

**验收条件**：
- [ ] 用户可在单一设置区完成：关邮件通知、撤 Calendar、发起删除账号

---

### W-11｜帮助中心最小版 `[官网]` — V1.3

**前置依赖**：无

**做什么**：帮助中心最小 IA，覆盖高频问题。

**怎么做**：

1. **入门**：5 分钟上手、收据是什么、Trust Policy 人话版
2. **连接器**：浏览器边界 vs 桌面 Connector；Calendar 权限说明
3. **隐私与安全**：数据存哪、谁可见
4. **故障排查**：排队、503、OAuth 失效

**交付物**：
- `/help` 或 `/docs/help` 页面
- 文章带能力状态标签（Now / In Progress）

**验收条件**：
- [ ] 帮助搜索覆盖连接器、审批、额度三类高频问题

---

### W-12｜定价页完善 `[官网]` — V1.3

**前置依赖**：无

**做什么**：将 `/pricing` 从纯占位升级为「Coming Soon 产品化页」。

**怎么做**：

1. 说明为何未定 + 如何获得更新
2. 免费额度说明（对齐补充 §9）
3. 可选：邮箱订阅定价更新

**交付物**：
- `/pricing/page.tsx` 重写

**验收条件**：
- [ ] 页面解释清楚「目前免费使用 / 定价即将公布」
- [ ] 无虚假价格

---

### W-13｜开发者门户 UX `[官网]` — V1.3

**前置依赖**：E-7（上架表单字段）

**做什么**：开发者自助上架全流程 UI。

**怎么做**：

1. **Provider 控制台**：我的 Agent 列表、新建 Agent、endpoint 管理、用量/错误率
2. **上架表单**：对齐 E-7 字段（`max_concurrent`、`supports_scheduled`、`memory_tier` 等）
3. **审核状态**：待审 / 需补材 / 通过 / 驳回理由
4. **15 分钟最小接入**：读头 → 打一条 echo → 声明并发 1 → 上架

**交付物**：
- `/app/my-agents/` 页面增强
- 上架表单与 E-7 字段对齐
- 「15 分钟最小接入」文档页

**验收条件**：
- [ ] 假开发者账号可走完一遍无人工介入（staging 自动通过模式）
- [ ] 表单字段与 §5.1.9 一一对应

---

### W-14｜性能与 A11y `[官网]` — V1.3

**前置依赖**：所有 UI Epic

**做什么**：性能与可访问性门禁。

**怎么做**：

1. **性能**（补充 §10）：
   - LCP P75 < 2.5s、TTI P75 < 3.5s
   - 发送消息→首字节 P95 < 800ms（不含 Agent 思考）
   - 目录搜索 P95 < 500ms
2. **A11y**（补充 §11）：
   - 关键路径 WCAG 2.2 AA
   - 全键盘可达、焦点顺序合理、`aria-live` 覆盖新消息/错误

**验收条件**：
- [ ] Lighthouse Performance ≥ 90
- [ ] 每 Sprint 抽 1 条路径 VoiceOver 验证

---

## 4. 跨团队依赖矩阵

```
官网 Epic            依赖的主线 Epic       可 Mock 先行？
──────────────────────────────────────────────────────
W-1  应用场景重排     无                     ✓（纯内容）
W-2  路线图重排       无                     ✓（纯内容）
W-3  Space UX         E-1, E-2              ✓ 可 Mock 基础结构
W-4  目录 UX 升级     E-6, E-9              ✓ 可 Mock 徽章/排序
W-5  Trust UI         E-6                   ✓ 可 Mock reason_codes
W-6  对话生命周期     E-3                   ✓ 可 Mock 消息状态
W-7  错误/降级        E-5, E-7              ✓ 可 Mock 错误类型
W-8  通知中心         E-8                   ✓ 可 Mock 通知列表
W-9  首启体验         E-1, W-4              部分可 Mock
W-10 账户/配额        E-1, E-8              ✓ 可 Mock 用量
W-11 帮助中心         无                     ✓（纯内容）
W-12 定价页           无                     ✓（纯内容）
W-13 开发者门户       E-7                   部分可 Mock
W-14 性能/A11y        全部                   ✗ 需真实页面
```

---

## 5. 执行顺序建议

### 5.1 主线团队推荐序列

```
第 1 周    E-1 认证与身份
第 2 周    E-2 Space/RBAC  +  E-7 调用网关（可并行）
第 3 周    E-3 实时推送     +  E-4 连接器 Calendar（可并行）
第 4 周    E-5 编排运行时（依赖 E-1, E-3）
第 5 周    E-6 Trust 用户面 +  E-8 通知系统（可并行）
第 6 周    E-9 目录排序     +  E-10 埋点看板（可并行）
第 7 周    联调 + 回归 + V1.3 发布门槛验收
```

### 5.2 官网团队推荐序列

```
第 1 周    W-1 应用场景 + W-2 路线图 + W-11 帮助中心 + W-12 定价（纯内容并行）
第 2 周    W-9 首启体验 + W-6 对话生命周期（Mock 先行）
第 3 周    W-3 Space UX + W-4 目录升级（Mock 先行，等 E-2/E-6 联调）
第 4 周    W-5 Trust UI + W-7 错误降级 + W-8 通知中心
第 5 周    W-10 账户配额 + W-13 开发者门户
第 6 周    W-14 性能/A11y + 联调 + 三语核查
第 7 周    联调 + 回归 + V1.3 发布门槛验收
```

### 5.3 协同联调窗口

| 联调点 | 主线交付 | 官网对接 | 预计时间 |
|--------|---------|---------|---------|
| 认证 + Space | E-1, E-2 | W-3, W-9 | 第 2-3 周 |
| 实时消息 | E-3 | W-6 | 第 3 周 |
| 连接器 Calendar | E-4 | W-10（连接器管理） | 第 3-4 周 |
| 编排运行时 | E-5 | W-4（意图路由 UI）、W-7 | 第 4-5 周 |
| Trust + 通知 | E-6, E-8 | W-5, W-8 | 第 5 周 |
| 目录排序 | E-9 | W-4 | 第 6 周 |

---

## 6. V1.3 验收场景包

> 每章至少需要的最小场景配置，用于端到端验收。

| 旅程章节 | 最小 Agent 配置 | 最小用户配置 | 关键验收路径 |
|---------|----------------|-------------|-------------|
| **第一章** 单 Agent | 平台预置种子 Agent ×2（文本生成类 + 结构化输出类） | 1 个注册用户 | 输入需求 → Agent 响应 → 收据可查 |
| **第二章** 多 Agent | 种子 Agent ×3（形成一条 2-3 步链路） | 1 个用户 | 自然语言 → 推荐链路 → 确认 → 逐步执行 → 部分成功/全成功 |
| **第三章** 人进群 | 种子 Agent ×1 | 2 个注册用户（同 Space） | A 创建会话 → 邀 B → B 可见消息 → B @Agent → Agent 响应 |
| **第四章** Agent 拉 Agent | 种子 Agent ×2（一个有「可邀请」权限） | 1 个用户 | Agent A 在策略下邀请 Agent B → 系统消息可见 → 审计归因可查 |
| **第五章** 人裁决 | 种子 Agent ×1（触发高风险操作） | 1 个用户 + 1 个 admin | 高风险调用 → Trust 拦截 → admin 审批 → 续接执行 |

**种子 Agent 要求**：主线团队在 V1.3 发布前 **预置 3 个种子 Agent**（部署在平台托管运行时或 Mock A2A 端点），覆盖上述场景。这是验收基础设施，不是产品功能。

---

## 7. V1.3.1 待补清单（首版后 1-2 周）

| 编号 | 内容 | 来源 |
|------|------|------|
| V1.3.1-1 | Notion SaaS 连接器端到端 | 主规格 §1.1 B.3.1 |
| V1.3.1-2 | 轻量桌面 Connector | 主规格 §1.1 B.4 |
| V1.3.1-3 | B 类定时召回完整版 | 主规格 §5.1.8 |
| V1.3.1-4 | 已读回执 | 补充 §15 P0-3 |
| V1.3.1-5 | Typing indicator | 补充 §15 P0-3 |
| V1.3.1-6 | 租约调度模式 | 主规格 §5.1.6 |
| V1.3.1-7 | 邮件通知模板 | 补充 §2 |
| V1.3.1-8 | 收据用户可见完整字段权限矩阵 | 补充 §15 P1-1 |
| V1.3.1-9 | Agent 版本/更新 UX | 补充 §15 P1-2 |
| V1.3.1-10 | 完整反滥用策略 | 补充 §15.4 P2-4 |
| V1.3.1-11 | UGC 治理 | 补充 §15.4 P2-1 |
| V1.3.1-12 | Cookie/同意横幅合规 | 补充 §15.4 P2-3 |

---

## 8. 总验收清单

### 8.1 V1.3 发布门槛（全部通过才可发布）

**产品旅程**：
- [ ] 第一章：新用户 5 分钟内完成「输入需求 → 经验证 Agent 响应 → 收据可查」
- [ ] 第二章：至少一条多 Agent 链路端到端可演示（推荐 → 确认 → 逐步执行）
- [ ] 第三章：两人 + 一 Agent 同会话端到端可演示
- [ ] 第四章：Agent 代邀请端到端可演示（含审计归因）
- [ ] 第五章：高风险调用 → Trust 拦截 → 人审 → 续接

**连接器**：
- [ ] 浏览器文件上传 → 真实处理 → 会话可感知结果
- [ ] Google Calendar OAuth → 真实 API 调用 → 结果写回
- [ ] 撤销/过期/scope 越权拒绝至少一条负例可演示

**Trust + 质量**：
- [ ] Trust 拦截卡片三语人话展示
- [ ] 目录中 `unverified` 不排在 `consumer_ready` 之前

**基础设施**：
- [ ] 认证方式可走通（邮箱+密码 + Google OAuth）
- [ ] 通知中心未读角标 + deep link
- [ ] Founder 看板可出周报

**官网**：
- [ ] 应用场景页六章叙事完整
- [ ] 路线图页按旅程重排
- [ ] 帮助中心覆盖三类高频问题
- [ ] 三语完整无缺失

**非功能**：
- [ ] LCP P75 < 2.5s
- [ ] 关键路径 WCAG 2.2 AA
- [ ] iOS Safari + Android Chrome 核心路径无横向滚动

### 8.2 V1.3 不纳入（明确排除）

- M5 子网互联工程交付
- M7 硬件 / 物理世界工程交付
- 企业 SSO
- 完整编排 DSL / 可视化编排
- IM 桥
- 白标
- TEE

---

*文档版本：v1（2026-03-22）*  
*签发：CTO（联合创始人/技术最高负责人）*  
*状态：即刻生效，两团队按本文档 §5 推荐序列启动*
