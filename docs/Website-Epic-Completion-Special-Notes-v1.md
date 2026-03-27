# 官网 Epic 交付「特别说明」集合（持续更新）

> **用途**：按 Epic（W-1、W-2、W-3、W-4…）记录官网各阶段收尾时的**实现位置**、**与指令/主规格的对应关系**，以及**未纳入当次范围**或**建议后续补齐**的说明，便于产品、运维与主线团队接力。本文档长期维护，文件名不绑定特定 Epic 编号范围。  
> **依据**：`CTO-V1.3-Execution-Directive-v1.md`、`CTO-V1.3-Product-and-Web-Release-Spec.md`（§2、§3）与当次实现差异说明。

---

## W-1｜应用场景页重排（总旅程）`[官网]` — V1.3

**已实现要点（便于对齐验收与代码位置）：**

- **入口页**：`packages/website/src/app/[locale]/(marketing)/use-cases/page.tsx` — 以 **CompanyA 六章** 为唯一主轴；`CompanyAJourneySection` + `RichLine`（`**…**` 强调）；与路线图交叉引流文案 `ROADMAP_CROSS`（三语）。
- **章节数据**：`packages/website/src/content/use-cases-company-a-journey.ts` — `getCompanyAJourneyChapters(locale)` 供三语章节标题、正文、能力解锁说明；第六章含 **愿景/展望** 表述，与主规格「子网互联 / 硬件非当期必交付」口径对齐（以该文件文案为准）。
- **章节 UI**：`packages/website/src/components/marketing/company-a-journey-section.tsx` — 可展开章节、表格/列表型「旅程画面」、能力块等（具体结构以组件实现为准）。
- **旧 URL 处理**：`packages/website/src/app/[locale]/(marketing)/use-cases/enterprise-governance/page.tsx` + `packages/website/src/components/marketing/use-cases-enterprise-redirect.tsx` — 原 `/use-cases/enterprise-governance` **保留路由**，客户端跳转至总页 **第五章锚点**（`#chapter-…`，以 redirect 组件为准），满足「重定向至对应章节锚点」。
- **元数据**：沿用 `getDictionary(locale).useCases` 与 `buildEntryPageMetadata`（`use-cases` 段）；具体 SEO 字段以 `dictionaries` 为准。

**交付完成后特别说明：**

- **文案与主应用一致性**：六章叙事与「能力解锁」表述以 **内容文件** 为源；主应用 Onboarding / 帮助中心若更新 §2 叙事，需 **人工回写** `use-cases-company-a-journey.ts` 与相关字典，避免双轨长期分叉（与主规格 §3.1 分工：**应用场景 = 故事与价值**）。
- **第六章边界**：页面已按规格区分「展望」与当期能力；若市场或法务对措辞有新约束，应优先改 **文案层**，不必改路由结构。
- **子页 `[slug]`**：`use-cases/[slug]/page.tsx` 若仍存在，需确认与 W-1「单页六章」策略是否冲突；运营链接应统一指向 **`/use-cases`** 及锚点。

---

## W-2｜路线图页重排 `[官网]` — V1.3

**已实现要点（便于对齐验收与代码位置）：**

- **页面**：`packages/website/src/app/[locale]/(marketing)/roadmap/page.tsx` — 结构顺序：**标题与副标题** → **工程编号说明便签**（M1–M7 与阅读顺序关系）→ **按旅程分组的里程碑卡片** → **折叠「旅程 ↔ 工程里程碑」对照表** → **Phase 0–4+ 工程时间线**（明确为「对照用」，不取代旅程阅读顺序）。
- **数据与顺序**：`packages/website/src/content/roadmap-full.ts` —  
  - 旅程分组 `journeySections`：呈现顺序为 **M1 → M3 → M4 → M2 → M6 → M5 → M7**（对齐「单 Agent → 流程/供给 → 协作风控与治理 → 网络/物理展望」）。  
  - 每张里程碑卡片含 **`consumerStatus`**（Now / In Progress / Coming Soon / Planned / Research），与主规格状态集一致。  
  - **M5 / M7** 描述中强调 **远期/研究、非 V1.3 必交付**，避免与当期 ship 混淆。  
  - 导出 `milestonesInOrder`、`milestoneById` 供页面按 `milestoneIds` 渲染。
- **卡片组件**：`packages/website/src/components/marketing/milestone-card.tsx` — `StatusBadge`（`vision-status` 三语）+ `RichLine` 支持描述中的 `**强调**`；类型与排版与 typeset 技能取向一致（正文 `text-base`、层次清晰）。
- **时间线**：`packages/website/src/components/marketing/roadmap-timeline.tsx` — 仍按 **工程 Phase** 展示，置于页尾；`roadmap-full.ts` 内 `phasesSectionHeading` / `phasesSectionLead` 三语说明用途。
- **对照表**：指令要求「tooltip 或折叠」— 当前为 **`<details>` 折叠表格**（三列表头与行数据均三语），满足可发现性与可读性。

**交付完成后特别说明：**

- **首页路线图预览**：`packages/website/src/content/roadmap-preview.ts` + `RoadmapPreviewSection` **可能仍为 Phase/工程视角**，与全页「旅程优先」叙事 **未强制统一**；若希望首页与 `/roadmap` 阅读顺序一致，可后续增加预览条目的旅程排序或简短说明。
- **与 `CTO-Product-Mainline-and-Roadmap-v1.md` 的关系**：消费者顺序以 **`roadmap-full.ts` + 主规格 §3.2** 为官网基准；主线文档修订时建议 **回写对照表** 或注明「官网已按旅程重排」。
- **验收勾选**：指令中的 checkbox 需在发布评审时由 **产品/CTO** 在指令文档或看板中手动勾选；本文档不替代正式验收记录。

---

## W-3｜产品区 Space 与多人协作 UX `[官网]` — V1.3

**依赖**：主线 **E-1（认证/JWT）**、**E-2（Space / 成员 / 邀请 / RBAC）**；网站通过 **Next.js BFF** 代理至 `MAINLINE` 的 `/api/v1/spaces/*` 等（Cookie / `Authorization` 透传见 `buildMainlineActorHeaders`）。

**已实现要点（便于对齐验收与代码位置）：**

- **BFF 代理**：  
  - `packages/website/src/app/api/mainline/spaces/route.ts`（GET/POST）  
  - `packages/website/src/app/api/mainline/spaces/join/route.ts`（POST）  
  - `packages/website/src/app/api/mainline/spaces/[id]/route.ts`（GET/PATCH）  
  - `packages/website/src/app/api/mainline/spaces/[id]/members/route.ts`（GET/POST）  
  - `packages/website/src/app/api/mainline/spaces/[id]/invitations/route.ts`（POST）  
  - `packages/website/src/app/api/mainline/conversations/[id]/agents/route.ts`（POST，会话拉 Agent）
- **Space 上下文**：`packages/website/src/components/product/space-context.tsx` — `SpaceProvider` + `useSpace()`；登录后拉取 Space 列表，`localStorage` 键 `gaialynk_current_space_id` 持久化当前 Space；`GET .../spaces/:id/members` 解析 **当前用户在本 Space 角色**（`myRole`），导出 `canInviteToSpace` / `isGuestInSpace`。
- **布局接入**：`packages/website/src/app/[locale]/(product)/layout.tsx` 在 `ProductShell` 外包一层 `SpaceProvider`。
- **顶栏切换器**：`packages/website/src/components/product/space-switcher.tsx` — 当前 Space 名下拉切换；支持 **创建团队 Space**（POST `/api/mainline/spaces`，`type: "team"`）。`packages/website/src/components/product/shell.tsx` 内嵌切换器；底部 `StatusBar` 传入 **当前 Space 名称**（替代纯 Demo 占位）。
- **会话列表 / 新建会话**：`packages/website/src/components/product/sidebar/conversation-list.tsx`、`packages/website/src/app/[locale]/(product)/app/chat/page.tsx` — 已登录且选中 Space 时，列表与「最近一条」查询带 **`space_id`**；新建会话 POST body 带 **`space_id`**（与主线 `POST /api/v1/conversations` 一致）。
- **成员与邀请**：`packages/website/src/app/[locale]/(product)/app/settings/space/members/page.tsx` + `packages/website/src/components/product/settings/space-members-panel.tsx` — 成员表、生成邀请（POST invitations）、**复制完整加入 URL**（`/{locale}/app/join-space?token=...`）。**Guest** 无法生成邀请：按钮 **disabled + `title` tooltip**（`guestNoInviteTooltip`）。**W-15** 起成员列表现 **`display_name` / `email_masked`、presence、owner 角色管理与移除、审计导出** — 细节见 **§ W-15**。
- **接受邀请**：`packages/website/src/app/[locale]/(product)/app/join-space/page.tsx` — 登录后 POST `spaces/join`；**`joinAttemptForToken` ref** 避免 Strict Mode / effect 重复提交；登录链接带 **`return_url`** 回到本页继续接受。
- **设置入口**：`/{locale}/app/settings`（W-10 套件侧栏）内 **Space & members** 导航链至 `/{locale}/app/settings/space/members`（原聚合 `settings-panel` 已拆分为多子页，见 **W-10**）。
- **会话头部与提及**：  
  - `packages/website/src/components/product/chat/chat-participant-bar.tsx` — 标题、参与者 **头像缩写**、Agent ID 输入 + 加入（guest **灰显 + tooltip**）。  
  - `packages/website/src/components/product/chat/input-bar.tsx` — `@` **提及自动完成**；插入格式与主线一致：`@user:<uuid>`、`@agent:<uuid>`（见主线 `mention-utils`）。  
  - `packages/website/src/components/product/chat/chat-window.tsx` — 拉取 `GET .../conversations/:id` 填充参与者与标题；SSE 收到 **`system` 消息**时刷新参与者元数据。  
  - `packages/website/src/components/product/chat/message-bubble.tsx` — 系统消息样式增强（含加入/邀请/离开等关键词时的视觉区分）。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `SpaceUiCopy` + `getSpaceUiCopy`；含 `mentionUserPrefix` / `mentionAgentPrefix` 等。

**交付完成后特别说明：**

- **环境与联调**：网站侧代理依赖 **`getMainlineApiUrl()`** 与浏览器 **HttpOnly Cookie**（access token）或等价鉴权；本地若未起主线或 `MAINLINE` 不可达，Space 列表/成员/邀请会失败，表现与既有 mainline proxy **502 / 错误 JSON** 一致。
- **加入 Space 后的当前 Space**：成功 join 后当前实现 **`router.replace` 至 `/app/chat`**，**未自动**将 `SpaceProvider` 切换到新 Space；用户可能需在顶栏 **手动切换** 或刷新后依赖列表顺序再选。若产品要求「加入后自动聚焦新团队 Space」，需在 join 成功回调中调用 **`refreshSpaces` + `setCurrentSpaceId(space_id)`**（需从 join 响应取 `space_id` 并暴露方法，属小版本增强）。
- **成员展示**：W-15 起已对接 E-11 的 **`display_name` / `email_masked`** 与在线状态（见 **§ W-15**）；历史说明保留作里程碑对照。
- **实时互见**：会话消息仍以网站现有 **`EventSource`（SSE）** 为准；主线 **E-3 WebSocket** 若未在网站 BFF 暴露或前端未接 WS，则「多 Tab / 多设备」实时性与主线全量能力可能不一致，验收时需 **声明范围**。
- **Guest 权限的「端到端」**：前端已对 **邀请链接生成**、**向会话添加 Agent** 做禁用与 tooltip；其他操作（如发消息）是否限制 guest 取决于 **主线各路由的 RBAC**，若存在漏网路由，应以 **服务端强制** 为准（参见 `Mainline-Epic-Completion-Special-Notes.md` E-2 说明）。
- **提及与通知**：正文中的 `@user:` / `@agent:` 由主线解析并可能触发通知；网站侧负责 **插入正确格式**，不负责投递逻辑。
- **自动化测试**：当前 **未** 为 spaces BFF 或 Space UI 增补与 `mainline-proxy.test.ts` 同级的用例；若 CI 要求覆盖，可后续对 `GET/POST /api/mainline/spaces` 等做与现有 proxy 测试相同的 **502 / 透传** 用例。

---

## W-4｜Agent 发现与推荐 UX 升级 `[官网]` — V1.3

**依赖**：主线 **E-6（trust_badge）**、**E-9（目录排序 / discovery）**、**E-5（orchestrations recommend/execute）**；列表 `trust_badge` 由主线 `GET /api/v1/agents` 在返回前批量附加（与 ranking metrics 上 `trustBadgeForRanking` 一致）。

**已实现要点（便于对齐验收与代码位置）：**

- **主线列表增强**：`packages/server/src/app.ts` — `attachTrustBadgesToAgents`，在默认列表与搜索排序路径上为每条 Agent 增加 `trust_badge` 字段。
- **BFF 代理**：  
  - `packages/website/src/app/api/mainline/agents/discovery/route.ts` → `GET /api/v1/agents/discovery`  
  - `packages/website/src/app/api/mainline/agents/[id]/route.ts` → `GET /api/v1/agents/:id`（详情拉取）  
  - `packages/website/src/app/api/mainline/orchestrations/recommend/route.ts`  
  - `packages/website/src/app/api/mainline/orchestrations/execute/route.ts`  
  - `packages/website/src/app/api/mainline/orchestrations/[id]/route.ts`  
  - `packages/website/src/app/api/mainline/orchestrations/[id]/cancel/route.ts`  
  - `packages/website/src/app/api/mainline/orchestrations/[id]/steps/[stepIndex]/retry/route.ts`
- **目录页**：`packages/website/src/components/product/agent-directory.tsx` — 解析 `trust_badge`、`max_concurrent`、`queue_behavior`；**运营位**调用 discovery，展示「热门 / 新手友好 / 低延迟」横向精选行（`ranking_fallback` 时显示降级说明）；搜索与分类筛选沿用 T-4.1。
- **卡片**：`packages/website/src/components/product/agent-card.tsx` — 信任徽章（三语文案）+ 容量/排队文案；`text-base` 标题与 `leading-relaxed` 正文，符合 typeset 可读性取向。
- **右栏 Agent 详情**：`packages/website/src/components/product/context-panel/agent-context.tsx` — Tab：**概览 | 能力与限制 | 隐私与数据 | 评价 | 开发者**；数据以 `GET .../agents/:id` 为准，含 `supports_scheduled`、`memory_tier`、`timeout_ms`、反馈汇总等。
- **会话内编排条**：`packages/website/src/components/product/chat/orchestration-plan-bar.tsx`，由 `packages/website/src/components/product/chat/chat-window.tsx` 在**发送消息成功**且会话内 **≥2 个 Agent 参与者**时触发推荐；支持收起、步骤下拉替换、`确认执行` / `只要单 Agent`、运行中进度与步骤展开、失败步 **重试** 与反馈入口（链至设置页占位）。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W4AgentUxCopy` + `getW4AgentUxCopy`。
- **Mock 回退**：`packages/website/src/lib/product/mock-agents.ts` — 为离线演示补充 `trustBadge` / `maxConcurrent` / `queueBehavior`。

**交付完成后特别说明：**

- **编排触发条件**：仅当 `participants` 中 **agent ≥ 2** 时才会请求 `POST .../orchestrations/recommend`；单 Agent 会话不展示多步方案条（与「多 Agent 链路」演示范围一致）。
- **执行与轮询**：执行走 `POST .../orchestrations/execute`（202）；前端对 `GET .../orchestrations/:id` **每 2s 轮询**直至终态；终态与步骤字段以主线实现为准。若主线未注册编排路由或鉴权失败，条内会显示 `recommendUnavailable` / 错误提示。
- **「换 Agent」与下拉**：替换列表仅限**已在会话中的 Agent**；显示名称依赖额外 `GET /api/v1/agents` 列表缓存，若目录未加载完成可能短暂显示 ID 截断。
- **详情与列表一致性**：卡片 `trust_badge` 来自列表接口；右栏概览以 **详情接口** 的 `trust_badge` 为准，二者应与 E-6 计算一致；若_stats 尚未积累，等级可能为默认档，属预期行为。
- **验收勾选**：指令中的 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-5｜Trust 用户面 UI `[官网]` — V1.3

**依赖**：主线 **E-6**（`trust_decision.user_facing_message`、`reason_codes` 映射）；发送消息 **202/201/403/422** 的 `meta` / `error.details` 形状。

**已实现要点（便于对齐验收与代码位置）：**

- **reason_codes 人话映射（与 E-6 对齐）**：`packages/website/src/lib/product/reason-codes-user-facing.ts` — 与 `packages/server/src/modules/trust/reason-codes-i18n.ts` 同源键与文案；`buildUserFacingMessageFromReasonCodes` 供前端在缺少 `user_facing_message` 时回退。
- **Trust 卡片**：`packages/website/src/components/product/chat/trust-card.tsx` — 变体 `need_confirmation` / `platform_blocked` / `data_boundary_blocked`；风险等级标签与配色；`reason_codes` + 人话正文；确认/拒绝/「查看队列与详情」；**Space owner/admin** 额外展示 `reason_codes` 与 `policy_rule_id`（与 `space-context` 的 `myRole` 联动）。
- **收据摘要**：`packages/website/src/components/product/chat/receipt-summary.tsx` — 截断 ID、开立时间、摘要、`user_facing_message` 本地化行、复制完整 ID、链至右栏收据；管理员可见原因码与策略规则。
- **消息模型**：`packages/website/src/lib/product/chat-types.ts` — `trustInteraction`、`receiptSlice`。
- **会话集成**：`packages/website/src/components/product/chat/chat-window.tsx` —  
  - **201**：`meta.receipt_id` + `meta.trust_decision` → 用户消息挂载 `receiptSlice`；  
  - **202**：`meta.pending_invocations[]`（每项可含 `trust_decision`，见下）或 **单 Agent** 路径 `meta.invocation_id` + `meta.trust_decision` → 合成「信任策略」Agent 气泡 + Trust 卡片（**修复**此前仅识别 `pending_invocations[0]` 导致单路 `need_confirmation` 无卡片）；  
  - **403** `invocation_denied`：`error.details.trust_decision` → 先 `loadMessages` 再追加平台拦截卡片；  
  - **422** `data_boundary_violation`：本地乐观用户气泡 + 数据边界拦截卡片（消息未入库）。  
  「查看详情」跳转 `/{locale}/app/recovery-hitl`（审批/队列演示页，与现有 `ApprovalsPanel` / review-queue 代理一致）。
- **消息气泡**：`packages/website/src/components/product/chat/message-bubble.tsx` — 统一渲染 Trust 卡与收据摘要；兼容仅有 `pendingInvocationId` 的旧数据结构（回退 `risk_high_requires_confirmation` 文案）。
- **列表**：`packages/website/src/components/product/chat/message-list.tsx` — 传入 `locale`、`isSpaceAdmin`、`trustCardCopy`、`receiptSummaryCopy`。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W5TrustUiCopy` + `getW5TrustUiCopy`（风险标签、拦截标题、收据标签、队列引导等）；确认/拒绝文案仍复用既有 `ProductUiCopy.risk*`。
- **主线小扩展**：`packages/server/src/app.ts` — 多目标 `pending_invocations` 每项附带 **`trust_decision`**，便于前端展示人话与风险而无需额外审计查询。

**交付完成后特别说明：**

- **通知中心「待审批」**：**W-8** 已在顶栏提供铃铛与 deep link（`focus_invocation`）回会话 Trust 卡片；**recovery-hitl / review-queue** 仍为并列入口。
- **reason_codes 源**：**W-18** 起以 `packages/shared/src/reason-codes.ts`（`@gaialynk/shared`）为唯一文案源，网站经 `reason-codes-user-facing.ts` 再导出；新增 code 时先改共享包再发版网站与主线。
- **403/422 非 Trust 原因**：仅当 `details.trust_decision` 存在时追加平台拦截卡片；**无** `trust_decision` 的 403 已由 **W-7** 以 `productErrorSurface` / `ProductErrorCallout` 展示并带下一步动作。
- **繁体中文**：`lineFromUserFacingBundle` 对 `zh-Hant` / `zh-Hans` 暂均使用映射表中的 **zh（简体）** 字符串；若产品要求港台专用繁体，需在映射表拆列或加转换层。
- **验收勾选**：指令 checkbox 由产品/CTO 勾选；本文档不替代正式验收记录。

---

## W-6｜对话生命周期管理 `[官网]` — V1.3

**依赖**：主线 **E-3**（消息投递语义）；本 Epic 扩展主线 **会话状态、列表筛选、用户偏好、只读发送**。

**已实现要点（便于对齐验收与代码位置）：**

- **数据库**：`packages/server/src/infra/db/migrations/0026_conversation_lifecycle_w6.sql` — `conversation_user_prefs`（`user_id` + `conversation_id`：置顶 `pinned_at`、标星 `starred`）。`reset` 脚本已加入对该表的 TRUNCATE（在 `conversations` 之前）。
- **Store**：`packages/server/src/modules/conversation/conversation.store.ts` —  
  - `ListConversationsOptions.states`、`prefsForUserId`；列表 **LEFT JOIN** prefs（登录用户 JWT 与 `prefsForUserId` 对齐时返回 `pinned_at` / `starred`）；  
  - `getConversationSummaryAsync` 增加 **`state`**；  
  - `updateConversationAsync`（`state` / `title`）；  
  - `upsertConversationUserPrefsAsync`；  
  - 内存 store 同步 prefs Map + `resetConversationStore` 清理。
- **HTTP API**（`packages/server/src/app.ts`）：  
  - `GET /api/v1/conversations` 支持 **`states`** 逗号分隔（`active` / `archived` / `closed`）；未传时行为与旧版一致（不按 state 过滤）。登录时自动附加 **prefs join**。  
  - **`PATCH /api/v1/conversations/:id`**：`state`、`title`、`pinned`、`starred`（置顶/标星需登录且为参与者）。  
  - **`POST .../messages`**：若会话 `state` 为 **`archived` 或 `closed`** → **409** `conversation_read_only`。
- **官网 BFF**：`packages/website/src/app/api/mainline/conversations/[id]/route.ts` — 合并 **GET / PATCH / DELETE** 代理（原 DELETE 保留）。
- **全局搜索与筛选上下文**：`packages/website/src/components/product/conversation-lifecycle-context.tsx` — `searchQuery`、`includeArchived`、`listVersion` / `bumpListVersion`；`(product)/layout.tsx` 用 **`ConversationLifecycleProvider`** 包裹 **`ProductShell`**。
- **顶栏搜索**：`packages/website/src/components/product/shell.tsx` — 在 **`/app/chat`** 路由下显示搜索框（`HeaderConversationSearch`），写入上下文。
- **侧栏列表**：`packages/website/src/components/product/sidebar/conversation-list.tsx` — 默认 **`states=active`**；勾选「包含归档」→ **`states=active,archived`**（**不含 `closed`**，与「仅审计」口径一致）；按 **`updated_at`** 相对 **今天 / 7 天内 / 更早** 分组；客户端 **置顶优先** 排序（`conversation-lifecycle-utils.ts`）；搜索过滤标题 / id / 摘要 / agent 名。
- **列表项操作**：`packages/website/src/components/product/sidebar/conversation-item.tsx` — 置顶、标星、归档/恢复、删除（`confirm`）；**PATCH/DELETE** 经 BFF。
- **聊天页**：`packages/website/src/components/product/chat/chat-window.tsx` — 从详情拉取 **`conversation.state`**；**归档/关闭** 时只读条 + **恢复**（`PATCH state=active`）、**禁用输入与加 Agent**（`chat-participant-bar.tsx` `readOnly`）；**409** 时刷新 meta。  
  **导出**：`packages/website/src/lib/product/export-conversation.ts` — **Markdown / 纯文本**下载；默认勾选 **脱敏**（`@user:` / `@agent:` UUID 替换为占位）。
- **入口重定向**：`packages/website/src/app/[locale]/(product)/app/chat/page.tsx` — 最近会话列表带 **`states=active`**，避免把归档会话当作默认进入目标。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W6ConversationLifecycleCopy` + `getW6ConversationLifecycleCopy`；`ProductShell` / `ProductSidebar` 传入 `w6Lifecycle`。

**交付完成后特别说明：**

- **迁移**：部署主线须执行 **`0026_conversation_lifecycle_w6.sql`**；未迁移时 PATCH prefs 或 JOIN 会失败。
- **`closed` 会话**：当前列表 API 在默认与「含归档」模式下均 **不返回 `closed`**；若产品要在审计视图中列出 `closed`，需新增查询参数（如 `states=closed`）与专用入口（与指令「仅审计查看」对齐）。
- **列表相对时间**：`conversation-item.tsx` 内 `formatRelativeTime` 仍为 **英文短格式**；与界面语言完全对齐可后续改为字典驱动。
- **编排条**：只读会话下 **OrchestrationPlanBar** 仍可展示；若需禁止在 `archived/closed` 下执行编排，应在产品确认后加 `readOnly` 门控。
- **导出与审计**：导出内容为当前前端已加载消息之快照；与「审计全量」一致需后端导出 API 或分页拉全量（**API-DEBT**）。
- **验收勾选**：由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-7｜错误状态与降级体验 `[官网]` — V1.3

**依赖**：主线 **E-5（编排）**、**E-7（并发门闸 / 队列）**；错误码与 HTTP 语义以 `POST /api/v1/conversations/:id/messages` 及 BFF 代理为准。

**已实现要点（便于对齐验收与代码位置）：**

- **错误模式分类**：`packages/website/src/lib/product/product-error-pattern.ts` — `classifySendMessageError` 将响应映射为 **平台故障**、**Agent 不可用**、**队列饱和**、**连接器/附件**、**其他策略拒绝**（与补充规格 §6.1 对齐）；含 `mainline_unreachable`、`a2a_invocation_failed`、`invocation_capacity_exceeded`（`estimated_wait_ms`）、`invocation_queue_timeout` 等。
- **错误消息组件**：`packages/website/src/components/product/chat/product-error-callout.tsx` — 标题/说明 + **刷新会话**、**浏览 Agent 目录**、**设置**（连接器类）、**联系支持**（`mailto:support@gaialynk.com`）；可选 **用上一则内容重发**（仅网络级失败横幅）。
- **消息类型**：`packages/website/src/lib/product/chat-types.ts` — `productErrorSurface`；`message-bubble.tsx` 在 Trust/系统气泡之外渲染 `ProductErrorCallout`。
- **发送路径集成**：`packages/website/src/components/product/chat/chat-window.tsx` —  
  - 离线：**入队**（`sendQueue`）并清空输入；**连接条 + 队列条**（`chat-resilience-chrome.tsx`）展示待发送与移除/「立即发送队列」；  
  - 网络异常：**顶部横幅** + 重发上一则 / 刷新；  
  - HTTP 错误：在 Trust 已处理的 **403（trust_decision）/422/409** 之外，`loadMessages` 同步服务端已落库的用户消息后 **追加** 产品错误气泡（区分「平台挂了」vs「Agent 挂了」vs「排队」）。  
- **SSE 降级**：同文件内 `EventSource` **断线自动退避重连**；仅在 `disconnected` 时显示「实时更新暂停…」文案（避免首屏 connecting 误报）。
- **多步拓扑部分成功**：`packages/website/src/components/product/chat/orchestration-plan-bar.tsx` — `run.status === partial_completed` 时展示 **汇总条**（成功步数 / 总步数 + 引导至下方单步重试）；与既有失败步 **重试** 按钮并存。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W7ProductResilienceCopy` + `getW7ProductResilienceCopy`。
- **单测**：`packages/website/tests/product-error-pattern.test.ts` — 分类器关键分支。

**交付完成后特别说明：**

- **「重试」语义**：服务端已在多数失败路径 **持久化用户消息**；会话内产品错误卡片的 CTA 以 **刷新线程、换 Agent、联系支持** 为主，避免前端再次 POST 相同正文导致 **重复用户消息**。仅 **网络级失败**（未拿到响应）提供「用上一则内容重发」。
- **队列自动发送**：当前为 **手动「立即发送队列」** + 离线与入队；未实现规格 §6.3 的 **完全自动退避重试**（可作为后续增强）。
- **状态页链接**：文案强调平台不可用时的自助动作；**未接**独立 status 域名（若运维提供 URL，可在 `ProductErrorCallout` 中增加次要链出）。
- **编排推荐/执行失败**：编排条内仍为简短 `errorHint`；与 W-7 全量模式库的深度对齐（逐码文案）可后续迭代。
- **W-5 交叉**：Trust **策略拦截** 仍由 `trust-card.tsx` 承担；非 `trust_decision` 的 403 走 **W-7 policy_other** 产品错误面。
- **验收勾选**：由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-8｜通知中心 UI `[官网]` — V1.3

**依赖**：主线 **E-8**（`GET/POST /api/v1/notifications*`、`notification_events`、未读计数）。

**已实现要点（便于对齐验收与代码位置）：**

- **BFF 代理**：  
  - `packages/website/src/app/api/mainline/notifications/route.ts` → `GET /api/v1/notifications`（查询串透传：`limit`、`unread_only`、`cursor`）  
  - `packages/website/src/app/api/mainline/notifications/read-all/route.ts` → `POST …/read-all`  
  - `packages/website/src/app/api/mainline/notifications/[id]/read/route.ts` → `POST …/:id/read`
- **顶栏组件**：`packages/website/src/components/product/notification-center.tsx` — 登录后显示 **铃铛 + 未读角标**（轮询 `meta.unread_count` 约 60s + `window` focus 刷新）；**下拉面板**：类型图标、类型标签、摘要、相对时间、未读底点；**全部已读**；点击行 **先标记已读** 再 `router.push` 产品内链接。
- **Deep link 映射**：`packages/website/src/lib/product/notification-deep-link.ts` —  
  - `/conversations/:cid/invocations/:iid/review` → `/{locale}/app/chat/:cid?focus_invocation=:iid`  
  - `/conversations/:cid/orchestrations/:runId` → 同会话 URL + `focus_orchestration`（预留；编排条仍按会话内现有逻辑加载）  
  - `/settings/connectors?…` → `/{locale}/app/connectors-governance?…`
- **列表摘要**：`packages/website/src/lib/product/notification-summary.ts` — 优先 `summary_zh` / `summary_en` 等 payload 字段，回退 `event_type` / `type`。
- **会话内锚定**：`message-bubble.tsx` 对含 Trust / `pendingInvocationId` 的消息根节点设 `data-gl-invocation-id`；`message-list.tsx` + `chat-window.tsx` 识别 `focus_invocation` 后 **滚动至对应卡片** 并 `router.replace` 去掉 query（避免与「新消息滚到底」冲突时用 `skipBottomScrollOnceRef`）。
- **聊天页与 Next 15**：`packages/website/src/app/[locale]/(product)/app/chat/[conversationId]/page.tsx` 使用 **`Suspense` 包裹** 含 `useSearchParams` 的内层组件，满足 `missing-suspense-with-csr-bailout` 构建要求。
- **布局接入**：`packages/website/src/components/product/shell.tsx`（登录区铃铛）、`layout.tsx` 传入 `getW8NotificationCenterCopy`。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W8NotificationCenterCopy` + `getW8NotificationCenterCopy`。
- **单测**：`packages/website/tests/notification-deep-link.test.ts`；`tests/mainline-proxy.test.ts` 增补 notifications 代理 **502** 分支。

**交付完成后特别说明：**

- **未读一致性**：角标与列表以 **主线 API** 为准；关闭浏览器再打开后状态与服务器一致（验收项）；离线/502 时角标可能短暂不更新，与既有 mainline 代理一致。
- **无映射的 deep_link**：点击后仍 **标记已读**，若 `mapMainlineDeepLinkToProductHref` 返回 `null` 则 **不发生路由跳转**（后续可扩展更多路径模式）。
- **`focus_orchestration`**：当前仅保留 URL 参数；是否在 `OrchestrationPlanBar` 内自动展开指定 run 属后续增强。
- **join-space 与 Suspense**：同次交付为通过 Next 15 预渲染校验，对 `join-space/page.tsx` 增加了与聊天页同模式的 **`Suspense` 包裹**（非 W-8 功能变更，属构建兼容性）。
- **验收勾选**：由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-9｜新用户首启体验 `[官网]` — V1.3

**依赖**：主线 **E-1**、官网 **W-4**（`agents/discovery`、目录卡片）；首启与聊天首屏通过 **sessionStorage** 桥接（同域、单次消费）。

**已实现要点（便于对齐验收与代码位置）：**

- **首启流程（≤4 屏、无强制 OAuth）**：`packages/website/src/components/product/onboarding/consumer/consumer-onboarding-wizard.tsx`  
  - **Hub（第 1 屏）**：`consumer-hub-step.tsx` — 可选「一句话目标」+ **开始对话** / **浏览 Agent**；「开始对话」写入草稿并 `router.push` 至 `return_url`（默认 Chat）。  
  - **浏览路径（第 2–4 屏）**：推荐 Agent → 首条 Mock → **结果与「进入应用」合一屏**（`consumer-mock-result-step.tsx`，含收据与 Continue / 浏览目录链）。  
  - **推荐列表**：`packages/website/src/lib/product/first-run-agents.ts` — `fetchFirstRunAgentPicks` 优先 `GET /api/mainline/agents/discovery` 去重合并，失败回退 `getRecommendedAgentsForOnboarding()`（Mock）。  
  - **文案**：`packages/website/src/content/onboarding/consumer-onboarding-copy.ts`（`hub` / `result.done*` / 三语）。  
  - **分析**：`consumer_onboarding_fast_path` 已加入 `packages/website/src/lib/analytics/events.ts`。
- **Session 桥接**：`packages/website/src/lib/product/first-run-storage.ts` — `gl_w9_first_run_draft`（预填首条输入）、`gl_w9_pending_agent_id`（引导结束进入 Chat 后自动 `POST .../conversations/:id/agents`）。  
- **聊天首屏空状态（主区叙事 + 次区 3–5 卡 + 弱连接器 CTA）**：`packages/website/src/components/product/chat/chat-first-run-empty.tsx` — 登录且消息为空时由 `MessageList` 的 `emptySlot` 渲染；推荐 Agent 横向卡片（`AgentCard` + `fetchFirstRunAgentPicks`）；`GET .../connectors/authorizations` 为空时展示「无连接器」说明；订阅/任务为可选的弱提示 + 链至 `connectors-governance`。  
- **输入预填**：`packages/website/src/components/product/chat/input-bar.tsx` — `initialDraft`；`chat-window.tsx` 在 `conversationId` 变化时 `consumeFirstRunDraft()`。  
- **MessageList**：`packages/website/src/components/product/chat/message-list.tsx` — `emptySlot` 可选，替代默认一句 `chatEmptyHint`。  
- **三语文案（首屏空状态）**：`packages/website/src/content/i18n/product-experience.ts` — `W9FirstRunCopy` + `getW9FirstRunCopy`。

**交付完成后特别说明：**

- **「开始对话」路径屏数**：Hub 为唯一引导屏，随后即产品区 Chat；与指令「首启 ≤4 屏」一致（浏览路径满程为 4 屏）。  
- **自动加 Agent**：仅当用户从 Mock 结果页点击 **Continue to app**（或等价链）时写入 `gl_w9_pending_agent_id`；「开始对话」捷径不写 pending agent。  
- **草稿与 pending 均为单次消费**：切换 `conversationId` 时重新尝试 `consumeFirstRunDraft`；pending agent 在同一挂载周期内消费一次。  
- **未登录**：`ChatFirstRunEmpty` 仅在 `isAuthenticated` 时作为 `emptySlot` 展示；未登录仍依赖原有登录弹层与简短空提示逻辑。  
- **验收勾选**：指令中的 checkbox（如有价值回复、无强制 OAuth 等）由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-10｜用户账户与配额 UI `[官网]` — V1.3

**依赖**：主线 **E-1（认证/JWT）**、**E-8（通知 / 配额告警 deep_link）**；用量数据来自主线 `GET /api/v1/usage/counters`、`GET /api/v1/usage/limits`（配额键 `agent_deployments`、`subscription_task_runs` 见 `quota.store`）。

**已实现要点（便于对齐验收与代码位置）：**

- **设置套件布局**：`packages/website/src/app/[locale]/(product)/app/settings/layout.tsx` + `packages/website/src/components/product/settings/settings-suite-shell.tsx` — 侧栏导航：**Account | Notifications | Connectors | Usage & quotas | Data & privacy | Space & members**；`/app/settings` **重定向**至 `/app/settings/account`。
- **子页**：  
  - `.../settings/account/page.tsx` — 个人资料（user id / email / role）、安全说明、会话与开发用 user-id 登录、登出（`w10-account-and-notifications.tsx`）。  
  - `.../settings/notifications/page.tsx` — 通知渠道（in-app / email）与策略 PATCH `users/:id/notification-preferences`（同上组件）。  
  - `.../settings/connectors/page.tsx` — `GET .../connectors/authorizations?user_id=` 列表；**Revoke** → `POST .../authorizations/:id/revoke`（`w10-connectors-settings.tsx`）；链至 `connectors-governance` 演示页。  
  - `.../settings/usage/page.tsx` — 配额进度条（80% / 100% 警示色）+ 活动摘要（invocation 审计事件数、connector 云动作计数、审计事件总量）（`w10-usage-quota-dashboard.tsx`）；支持 **`?feature=`** 高亮对应配额卡（与配额通知 deep link 对齐）。  
  - `.../settings/data/page.tsx` — 隐私说明、导出说明、**删除账号**：输入 `DELETE` 后启用 `mailto:support@gaialynk.com`（冷静期/法务流程由支持处理，非即时 API 删除）（`w10-data-privacy-panel.tsx`）。
- **BFF 代理**：`packages/website/src/app/api/mainline/usage/counters/route.ts`、`.../usage/limits/route.ts` — 查询串透传 + `buildMainlineActorHeaders`。
- **通知 deep link**：`packages/website/src/lib/product/notification-deep-link.ts` — 主线 `/account/usage?...` 映射至 `/{locale}/app/settings/usage?...`（与 E-8 `quota.threshold_*` 的 `deep_link` 口径衔接）。
- **产品错误面**：`packages/website/src/components/product/chat/product-error-callout.tsx` — 连接器类 CTA **设置** 指向 `/{locale}/app/settings/connectors`（直达撤销入口）。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W10SettingsSuiteCopy` + `getW10SettingsSuiteCopy`。
- **单测**：`packages/website/tests/mainline-proxy.test.ts`（usage 代理 502/透传）；`packages/website/tests/notification-deep-link.test.ts`（`/account/usage` 映射）。

**交付完成后特别说明：**

- **「本月对话数」**：当前用量卡以 **审计聚合 API** 为准；**无**单独「用户消息条数」字段时，以 **invocation 相关事件数 / 审计总量** 为近似展示；若产品要强约束「对话数」定义，需主线扩展 counters 或专用指标（**API-DEBT**）。
- **删除账号**：前端仅 **发起邮件工单**；正式冷静期、身份校验与数据清除以 **法务/运维流程** 为准；后续若上线 `DELETE /api/v1/users/me`，可替换 mailto 流程。
- **侧边栏「设置」**：仍指向 `/{locale}/app/settings`，由 index **重定向**到 Account；书签旧路径行为不变。
- **验收勾选**：指令 checkbox 由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-11｜帮助中心最小版 `[官网]` — V1.3

**前置依赖**：无（纯内容与轻交互）。

**已实现要点（便于对齐验收与代码位置）：**

- **路由**：`packages/website/src/app/[locale]/(marketing)/help/page.tsx` — 官网营销布局下 **`/{locale}/help`**；`generateMetadata` 使用 `getHelpCenter(locale)` 的 `metaTitle` / `metaDescription`。
- **内容 IA 与三语**：`packages/website/src/content/help-center.ts` — `getHelpCenter(locale)` 导出 **入门**、**连接器**、**隐私与安全**、**故障排查** 四组；正文段落支持 `RichLine` 的 `**强调**`；与指令对齐的短文包括：五分钟上手、收据、Trust Policy 白话、连接器浏览器边界 vs 桌面、Calendar/Notion 权限、数据存放与可见性、排队/503/OAuth；另含 **审批与通知**、**用量与额度** 专篇以满足补充规格 §12.3 三类高频检索。
- **能力状态标签**：`packages/website/src/components/marketing/help-status-badge.tsx` — **`已上線` / `Now`** 与 **`进行中` / `In progress`**（样式区分）；**企业 SSO** 单篇为 **进行中**，与指令 D-AUTH-2「帮助中心标 In Progress」一致。
- **搜索与预设主题**：`packages/website/src/components/marketing/help-center-client.tsx` — 搜索框过滤（多关键词 AND）；三个快捷 chip：**连接器 / 审批 / 用量与额度**（`HelpPresetTag`），覆盖连接器、审批、额度三类预设问题。
- **文末路线图指针**：客户端 Aside 链至 **`/{locale}/roadmap`**，对齐补充 §12.2「仍在开发？」引导。
- **站内入口**：`packages/website/src/components/marketing/footer.tsx` + `content/dictionaries.ts` 三语 `footer.help` — Footer 增加 **Help / 說明中心 / 帮助中心** 链至 `/help`。
- **Sitemap**：`packages/website/src/app/sitemap.ts` 已加入 **`/help`**（同期补 **`/roadmap`**，与已存在路线图页一致，利于索引）。

**交付完成后特别说明：**

- **与产品内帮助**：当前为 **官网营销区**最小帮助；若产品内另建帮助模块，应 **回写** `help-center.ts` 或抽共享文案源，避免口径分叉（与主规格「诚实对齐」）。
- **任务与自动化 IA**：CTO W-11「怎么做」未单列「任务与自动化」；补充规格 §12.1 该节可在后续迭代增加短文（如与 §5.1.8 A/B 对齐），不阻塞 W-11 最小交付。
- **验收勾选**：指令中「帮助搜索覆盖连接器、审批、额度」由 **站内搜索 + chip + 专篇** 支撑；正式勾选仍由产品/CTO 在指令或看板完成。

---

## W-12｜定价页完善 `[官网]` — V1.3

**前置依赖**：无。

**已实现要点（便于对齐验收与代码位置）：**

- **页面**：`packages/website/src/app/[locale]/(marketing)/pricing/page.tsx` — 由占位升级为 **「方案即将公布 / Plans coming soon」** 产品化页；标题区 **徽章** + `heroLead` 一句话说清 **未定完整价目表 + 现阶段可免费使用（公平用量、无需信用卡）**。
- **三语文案源**：`packages/website/src/content/pricing-page.ts` — `getPricingPageCopy(locale)`；章节覆盖：**为何未定價**、**如何取得更新**（路線圖 / 說明中心 / 聯絡）、**現階段免費使用**、**計量維度與策略**（对齐补充规格 **§9.1–§9.3**：Agent 調用、連接器出站、排程執行、上傳／儲存；**80%／100%** 敘事；**重置週期以應用內用量頁為準**，避免與工程實作不一致）、**Pro/Team/Enterprise 無標價**、**防虛假價格提示條**（aside）。
- **邮件订阅（可选）**：`packages/website/src/components/marketing/pricing-updates-form.tsx` — `POST /api/lead`，`type: "waitlist"`、`source: "pricing_updates"`；隱私說明 + 鏈至 `/{locale}/privacy`。
- **CTA 與埋點**：`CtaLink` 至 `/roadmap`、`/help`、`/demo`（聯絡）、`/app`（打開應用）；`cta_click` payload 區分 `cta_id`。
- **SEO**：`generateMetadata` 使用 `pricing-page` 的 `seoTitle` / `seoDescription`（诚实表述，无金额）。

**交付完成后特别说明：**

- **與主線配額鍵名**：應用內 **W-10** 用量卡目前以主線 `quota.store` 的 **`agent_deployments` / `subscription_task_runs`** 等為主；定價頁 §9 敘事採 **產品設計維度** 白話，若工程命名與文案並列不一致，以 **應用內展示標籤** 為準，必要時回寫 `pricing-page.ts`。
- **郵件訂閱**：與其他 lead 表單共用 **`/api/lead`** 與解析規則（`name` / `company` / `useCase` 由表單固定填充）；運營導出可按 `source: pricing_updates` 篩選。
- **验收勾选**：「目前免費使用 / 定價即將公布」「無虛假價格」由頁面結構與文案保證；正式勾選仍由產品/CTO 在指令或看板完成。

---

## W-13｜开发者门户 UX `[官网]` — V1.3

**依赖**：主线 **E-7**（`gateway-listing`、`agent_endpoints`、`GET /api/v1/agents/:id/stats`）；网站已有 `agents/register`、`mine`、health-check、test-call、submit-review 等 BFF。

**已实现要点（便于对齐验收与代码位置）：**

- **Provider 控制台（产品区）**：`packages/website/src/components/product/provider-portal-console.tsx` — 登录且 **角色为 `provider`** 时：`GET .../agents/mine` 列表；选中 Agent 后并行拉取 **`GET .../agents/:id`**（富化详情含 E-7 字段）、**`GET .../agents/:id/endpoints`**、**`GET .../agents/:id/stats`**。  
  - **上架 / 网关表单**：`max_concurrent`、`queue_behavior`、`timeout_ms`（空则 PATCH `null`）、`supports_scheduled`、`memory_tier` → **`PATCH .../gateway-listing`**。  
  - **实例 URL**：展示注册 **主 `source_url`**；**POST/DELETE** `.../endpoints` 维护同构实例。  
  - **连通性与审核**：健康检查、测试调用、**提交上架**（与 onboarding 相同 API）。  
  - **用量摘要**：`stats.event_counts` + **近似成功率**（`success_rate`）+ **声誉等级**（非「错误率」独立字段，失败占比可从 completed/failed 推导）。  
  - **审核态展示**：映射主线 `status`（`pending_review` / `active` / `deprecated`）为三语文案；说明「需补材」等可能经 **通知** 传达（主线无独立 `review_reason` 列时以本说明为准）。  
- **页面入口**：`packages/website/src/app/[locale]/(product)/app/my-agents/page.tsx` — 未登录登录 CTA；非 Provider 角色时提示并链至 **`/app/onboarding/provider`** 与文档。  
- **BFF 代理**：  
  - `packages/website/src/app/api/mainline/agents/[id]/gateway-listing/route.ts`（PATCH）  
  - `packages/website/src/app/api/mainline/agents/[id]/endpoints/route.ts`（GET/POST）  
  - `packages/website/src/app/api/mainline/agents/[id]/endpoints/[endpointId]/route.ts`（DELETE）  
  - `packages/website/src/app/api/mainline/agents/[id]/stats/route.ts`（GET）  
- **类型**：`packages/website/src/lib/product/provider-agent-types.ts` — E-7 字段与 endpoints/stats 响应类型。  
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W13ProviderPortalCopy` + `getW13ProviderPortalCopy`。  
- **「15 分钟最小接入」文档页（营销区）**：`packages/website/src/app/[locale]/(marketing)/developers/minimal-onboarding/page.tsx` — 步骤：读 A2A 面 → echo 测试调用 → **并发 1 与网关字段** → 提交上架；链至 **`/{locale}/developers/protocol`**、**`/{locale}/app/my-agents`**。  
- **开发者枢纽**：`packages/website/src/app/[locale]/(marketing)/developers/page.tsx` 增加第四张导航卡；**Sitemap**：`packages/website/src/app/sitemap.ts` 含 **`/developers/minimal-onboarding`**。  
- **单测**：`packages/website/tests/mainline-proxy.test.ts` — `PATCH .../gateway-listing` 502 与透传。

**交付完成后特别说明：**

- **§5.1.9 全量字段**：主规格另列 **调度模式（租约）**、**suggested_max_run_duration** 等；当前 **PATCH `gateway-listing` 与控制台** 仅覆盖 **E-7 已实现子集**；租约模式见指令 **D-LISTING-1**（V1.3.1）。若产品要求表单与 §5.1.9 字面逐项勾选，需 **主线扩展 schema** 后再接 UI（**API-DEBT**）。  
- **「驳回理由」**：`deprecated` 与健康错误可在控制台展示；独立 **驳回文案字段** 若未在主线 Agent 表存在，则 **无法** 与「驳回理由」一一硬编码对齐，以通知/工单为准。  
- **非 Provider 用户**：`agents/mine` 返回 **403**；控制台在 **JWT `role`** 非 `provider` 时 **不发起列表请求**，直接展示角色说明（避免无意义 403）。  
- **假开发者端到端**：Staging **submit-review** 将 `pending_review` → `active`（与主线 `setAgentStatusAsync` 一致）；验收「无人工介入」依赖该环境与测试账号 **Provider** 角色。  
- **验收勾选**：指令中的 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-14｜性能与 A11y `[官网]` — V1.3

**前置依赖**：各 UI Epic（W-1～W-13）页面与组件已具备；本 Epic 为**门禁与关键路径补强**。

**已实现要点（便于对齐验收与代码位置）：**

- **文档语言（WCAG / 读屏）**：`packages/website/src/components/locale-document-lang.tsx` — 客户端将 `document.documentElement.lang` 设为 `en` / `zh-Hans` / `zh-Hant`；挂载于 `packages/website/src/app/[locale]/layout.tsx`（根 `layout` 仍为默认 `en`，避免 `headers()` 动态化整站）。
- **跳过导航**：  
  - 营销区：`packages/website/src/app/[locale]/(marketing)/layout.tsx` — 链至 `#marketing-main`；`main` 设 `id` + `tabIndex={-1}`。  
  - 产品区：`packages/website/src/components/product/shell.tsx` — 链至 `#product-main`；`main` 同上。  
  - 文案：`content/dictionaries.ts` `nav.skipToContent`（三语）；`ProductUiCopy.skipToMain`（`product-experience.ts`）。
- **动态区域 `aria-live`（对齐补充 §11.2）**：  
  - 新消息：`packages/website/src/components/product/chat/message-list.tsx` — `aria-live="polite"` 区域；单条追加时播报（**批量历史**一次增加多条时跳过，避免误读最后一条）。文案：`ProductUiCopy.a11yLiveNewUserMessage` / `a11yLiveNewAgentMessage` / `a11yLiveNewSystemMessage`，经 `chat-window` 传入 `threadCopy`。  
  - 任务完成 / 部分完成：`packages/website/src/components/product/chat/orchestration-plan-bar.tsx` — 终态摘要 `<p>` 与 `partial_completed` 摘要块 `aria-live="polite"` `aria-atomic`。  
  - 错误：`packages/website/src/components/product/chat/product-error-callout.tsx` — `role="alert"` + `aria-live="assertive"`。  
  - Trust：`packages/website/src/components/product/chat/trust-card.tsx` — `aria-live`：`need_confirmation` 为 `polite`，拦截类为 `assertive`。
- **模态键盘与焦点**：`packages/website/src/components/product/auth/login-modal.tsx` — 打开时聚焦邮箱、`Escape` 关闭、Tab **焦点循环**；表单错误 `role="alert"` + `aria-describedby`。
- **会话列表首屏感知（对齐补充 §10.1 骨架屏）**：`packages/website/src/components/product/sidebar/conversation-list.tsx` — 首次加载 `aria-busy` + 脉冲占位条 + `role="status"`。
- **传输与构建微优化**：`packages/website/next.config.ts` — `poweredByHeader: false`（略减响应体积、隐 header）。
- **Lighthouse 性能门禁（对齐指令验收「Performance ≥ 90」）**：`packages/website/scripts/lighthouse-performance-gate.mjs` + `package.json` script `lighthouse:gate`；`SITE_URL`、`MIN_SCORE`（默认 90）、`LIGHTHOUSE_PATHS` 可配置。与既有 `lighthouse:cwv`（写报告到 `artifacts/cwv-lighthouse`）互补。

**交付完成后特别说明：**

- **LCP / TTI P75、发送首字节 P95、目录搜索 P95**：以前端实现与 **合成监控** 为主；**后端/API P95** 需主线观测与生产指标验证，非纯官网仓库可「宣称达标」；发布前应在可联调环境对 `POST .../messages`、`GET .../agents` 等做采样（与补充 §10.2、§10.4 一致）。
- **`lighthouse:gate` 环境**：需本机 Chromium 与网络；默认路径为营销静态页；**登录后产品区**若需纳入 Lighthouse，需提供可测 URL 或测试账号，并写入 `LIGHTHOUSE_PATHS` / 运维流水线变量。
- **VoiceOver / NVDA**：指令要求每 Sprint 抽 1 条关键路径人工验证；本文档不替代该记录。
- **验收勾选**：Lighthouse ≥ 90 以 `npm run lighthouse:gate`（或对等 CI 步骤）+ 指定 `SITE_URL` 为准；正式勾选仍由产品/CTO 在指令或看板完成。

---

## W-15｜RBAC 路由 UI + 成员信息增强 `[官网]` — V1.3.1

**依赖**：主线 **E-11**（`GET /api/v1/spaces/:id/members` 含 `display_name` + `email_masked`；会话拉 Agent 的 `delegating_user_id` RBAC；`GET /api/v1/audit-events?space_id=` 的 `export_audit`）；**W-15 增补** 主线 `DELETE /api/v1/spaces/:id/members/:userId`（owner/admin 移除成员，与成员面板「移除」一致）。

**已实现要点（便于对齐验收与代码位置）：**

- **权限 hook**：`packages/website/src/hooks/use-space-permissions.ts` — `roleMayTriggerConnector` / `roleMayExportAudit`（与主线矩阵一致）、`useSpacePermissions`（含 `showConnectorsNav`、**成员表角色/移除仅 owner** 的 UI 门控，与 PATCH/DELETE API 中 admin 能力区分见下「特别说明」）。
- **BFF**：  
  - `packages/website/src/app/api/mainline/spaces/[id]/presence/route.ts` → `GET .../spaces/:id/presence`  
  - `packages/website/src/app/api/mainline/spaces/[id]/members/[userId]/route.ts` → `PATCH` / `DELETE` 成员  
  - `packages/website/src/app/api/mainline/audit-events/route.ts` → `GET .../audit-events`（查询串透传）  
  - 既有 `.../spaces/[id]/members/route.ts` 仍透传 **GET/POST**。
- **成员面板**：`packages/website/src/components/product/settings/space-members-panel.tsx` — 主显 **`display_name`**、次显 **`email_masked`**、`user_id` 短缩略；**在线状态圆点**（presence：`online` / `away` / `offline`）；**owner** 可改他人角色（下拉 `admin`｜`member`｜`guest`）、**移除成员**（确认弹窗）；**审计导出**（owner/admin：`limit=200` JSON 下载）；**Agent 代邀请**列：只读勾选状态反映「owner/admin 可作为 delegating user」（与主线 `grant_agent_invite_permission` 语义对齐，**非**独立 per-member  DB 字段）。
- **侧栏**：`packages/website/src/components/product/shell.tsx` — **guest** 隐藏「连接器」导航（`roleLoading` 期间暂不过滤，避免闪烁误藏）。
- **连接器演示**：`packages/website/src/components/connectors-governance-demo.tsx` — guest 仅见 **权限说明横幅**；`POST .../local-actions/execute` 附带当前 **`space_id`**（与 E-11 `trigger_connector` 校验一致）。
- **聊天附件**：`packages/website/src/components/product/chat/input-bar.tsx` 增加 `showAttachmentButton`；`chat-window.tsx` 对 guest 关闭附件按钮（与连接器触发权限一致）。
- **首屏空状态**：`packages/website/src/components/product/chat/chat-first-run-empty.tsx` — guest **不展示**连接器治理外链，改为 W-15 说明文案。
- **类型**：`packages/website/src/components/product/space-context.tsx` — `SpaceMemberRow` 扩展可选 `display_name`、`email_masked`。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W15RbacUiCopy` + `getW15RbacUiCopy`。
- **单测**：`packages/website/tests/w15-rbac-ui.test.ts`；`tests/mainline-proxy.test.ts` 增补 presence / member PATCH·DELETE / audit-events **透传**。

**交付完成后特别说明：**

- **成员管理 owner-only（UI）**：CTO W-15 写明由 **owner** 在表中改角色与移除；**admin** 在官网侧 **不展示** 下拉与移除（避免与「仅 owner」验收混读）。主线 **PATCH/DELETE** 仍允许 **admin** 在特定规则下操作成员（与 `space.routes.ts` 一致）；若产品要求 admin 与官网一致，需改服务端或放宽前端门控。
- **Agent 邀请「勾选」**：当前为 **只读** 展示（owner/admin 行勾选＝可担任 delegating user）；若需对 **member** 单独授予「可代邀请」而不升 admin，需主线 **成员级标志位 + PATCH**（当前仓库无该列）。
- **权限不足 Toast**：指令中的 **Toast** 语义，在连接器路径上落实为 **整页说明横幅** + **侧栏隐藏入口**；未引入全局 Toast 依赖。若产品坚持轻提示，可后续接 `sonner` 等并在 shell 统一派发。
- **验收勾选**：指令 §W-15 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-16｜WS 通道接入 + 已读回执 / Typing / Presence UI `[官网]` — V1.3.1

**依赖**：主线 **E-12**（`GET /api/v1/realtime/ws`、`message_read` / `typing_*` / `presence_update`、Redis 扇出）；**E-3** SSE 降级路径 `GET .../messages/stream`；网站 **HttpOnly** `gaialynk_access_token`（握手换取 WS query token）。

**已实现要点（便于对齐验收与代码位置）：**

- **握手 BFF**：`packages/website/src/app/api/auth/realtime-handshake/route.ts` — 校验 Cookie access token，返回 `access_token` + `ws_origin`（由 `getMainlineWsOrigin()` 自 `MAINLINE_API_URL` 推导 http→ws / https→wss）。
- **主线 WS 配置**：`packages/website/src/lib/config/mainline.ts` — `getMainlineWsOrigin()`（与 `getMainlineApiUrl()` 同源）。
- **WS 客户端工具**：`packages/website/src/lib/product/ws-client.ts` — `buildConversationRealtimeWsUrl`、`openConversationWebSocket`、`parseRealtimeWsPayload`、`mergeReadReceipt`（与 `docs/realtime-client-protocol.md` 事件名对齐）。
- **SSE 降级**：`packages/website/src/lib/product/sse-fallback.ts` — `subscribeConversationMessagesSse`（退避重连与 W-7 一致）；`chat-window` 在 **WS 握手失败、未登录、或 WS 断开后** 自动切 SSE；**不并行**双通道。
- **会话集成**：`packages/website/src/components/product/chat/chat-window.tsx` — 登录用户优先 WS；**30s** 应用层 `ping` 帧；处理 `message` / `message_read` / `typing_*` / `presence_update`；`IntersectionObserver` 对他人 **用户消息** 上报 `message_read`（去重 Set）；输入框 **~7s** 节流 `typing_start`，blur/清空/发送后 `typing_stop`。
- **已读 UI**：`packages/website/src/components/product/chat/message-read-indicator.tsx` + `message-bubble.tsx` / `message-list.tsx` — 本人用户消息双勾（已送达 / 已读）；`readByUserIds` 由 WS 合并（**SSE 降级时无 `message_read` 上行/下行**，已读仅 WS 模式完整）。
- **Typing UI**：`packages/website/src/components/product/chat/typing-indicator.tsx` — 输入区上方「XXX 正在输入…」+ 跳点动画。
- **Presence UI**：`packages/website/src/components/product/chat/presence-dot.tsx` + `chat-participant-bar.tsx` — 仅 **Space 会话**（`conversation.space_id` 非空）对用户参与者显示圆点；初始 `GET .../spaces/:id/presence`，并与 WS `presence_update` 合并。
- **类型**：`packages/website/src/lib/product/chat-types.ts` — `MessageDeliveryStatus`、`readByUserIds`；`packages/website/src/lib/product/presence-types.ts` — `SpacePresenceStatus`。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W16RealtimeCopy` + `getW16RealtimeCopy`。
- **单测**：`packages/website/tests/w16-ws-realtime.test.ts` — URL 构建、JSON 解析、`mergeReadReceipt` 去重。

**交付完成后特别说明：**

- **强制仅 SSE**：设置环境变量 `NEXT_PUBLIC_REALTIME_FORCE_SSE=1` 可跳过 WS（联调/代理受限场景）；与指令「`WS_FALLBACK_TO_SSE` + 自动检测」对应，自动检测为 **握手失败 / 断线 → SSE**。
- **跨域与日志**：WS URL 含 **短期 access token**，与协议文档一致；生产应 **WSS + 短 TTL**，并避免在访问日志中长期留存 query（运维策略）。
- **历史已读**：主线若未在 `GET .../messages` 中返回历史 `readByUserIds`，打开会话后仅能通过 **实时 `message_read`** 累积；刷新页面可能丢失前端未持久化的已读集合，直至再次收到事件（**API-DEBT**：可由主线在消息体附带只读回执摘要消除）。
- **与 W-3 叙述**：会话消息主通道在登录场景下为 **WS**；SSE 仍为 **官方降级**，W-3「仍以 SSE 为准」的表述由本 Epic **部分替代**（未登录仍走 SSE 尝试，与此前一致）。
- **验收勾选**：指令 §W-16 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-17｜Notion 连接器授权 UI `[官网]` — V1.3.1

**依赖**：主线 **E-13**（Notion OAuth、`/api/v1/connectors/cloud/notion/*`、外部动作收据、`external_action_receipts`）；网站 **W-10** 设置页与 BFF 模式。

**已实现要点（便于对齐验收与代码位置）：**

- **连接器设置卡片**：`packages/website/src/components/product/settings/notion-connector-card.tsx` — Logo（「N」字徽章）、未连接 **连接 Notion** / 已连接 **Workspace 名称**（主线 `oauth_workspace_name`，见迁移 **0035**）+ **连接时间**（`created_at`）+ **断开**（复用 `POST .../authorizations/:id/revoke`）。OAuth：`window.open` → BFF `GET /api/mainline/connectors/notion/authorize?ui_locale=...` → 主线 302 Notion；完成回跳页 **`/{locale}/app/settings/connectors/oauth-complete`** 通过 `postMessage(gaialynk_connector_oauth)` 通知 opener 并 `load()`。
- **BFF**：`packages/website/src/app/api/mainline/connectors/notion/[...path]/route.ts` — 透传 GET/POST 至主线 `/api/v1/connectors/cloud/notion/...`，`redirect: manual` 转发 302；`packages/website/src/app/api/mainline/connectors/external-action-receipts/[id]/route.ts` — GET 收据详情（可选）。
- **授权列表去重**：`packages/website/src/components/product/settings/w10-connectors-settings.tsx` — 活跃 Notion 行仅在专用卡片展示，不再与下方通用列表重复；「无任何连接器」空态在「仅 Notion 已连」时不误报。
- **会话内收据卡片**：`packages/website/src/components/product/chat/notion-receipt-card.tsx` + `packages/website/src/lib/product/parse-notion-system-message.ts` — 解析系统消息首行 `Notion` + `gl_notion_receipt_v1` JSON 行（由主线 `cloud-proxy.router.ts` 在 list / search / query / create 成功及 401 撤销路径追加）；`message-bubble.tsx` 在系统消息分支优先渲染卡片（操作类型、目标库/资源名、状态、收据 ID + 可选跳转右栏收据）。
- **主线配合（非纯官网）**：迁移 **`0035_oauth_workspace_name.sql`**；`connector.store` / Notion OAuth 回调写入 `workspace_name`；`OAuthStatePayload.ui_locale` + `buildConnectorOAuthSuccessRedirect`（`CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL` 支持 `{locale}` 占位）；各 Notion 动作 `appendConnectorSummaryToConversation` 追加 **JSON 收据行**（含 `receipt_id`、`action`、`status`、`target_label`）；`notionGetDatabaseTitle` 用于 query/create 的目标库标题。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `getW17NotionConnectorCopy`、`getW17NotionReceiptCardCopy`。
- **单测**：`packages/website/tests/w17-notion-ui.test.ts`（解析）；`tests/mainline-proxy.test.ts` 增补 Notion BFF 与 external-action-receipts **502**。

**交付完成后特别说明：**

- **环境变量**：Staging/生产需配置 **`CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL`** 为带 **`{locale}`** 的网站绝对地址，例如 `https://<site>/{locale}/app/settings/connectors/oauth-complete`，以便回调落在正确语言路径；未配置时主线仍返回 JSON 200（非弹窗闭环）。
- **Google Calendar OAuth**：与 Notion 共用同一 redirect 构建逻辑；可在发起 URL 增加 **`ui_locale`** 查询参数（主线已支持写入 state）。
- **历史会话消息**：无 `gl_notion_receipt_v1` JSON 行的旧 Notion 系统消息仍走 **灰色胶囊** 展示，不渲染新卡片。
- **验收勾选**：指令 §W-17 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-18｜Agent 生命周期 UX + 收据详情 + reason_codes 共享 `[官网]` — V1.3.1

**依赖**：主线 **E-15**（`listing_status` / `current_version` / `changelog`、`GET /agents/:id` 透出）、**E-17**（`GET /api/v1/invocations/:id` + `getInvocationWithVisibilityAsync`）；**SCALE-DEBT**：`packages/shared/src/reason-codes.ts`。

**已实现要点（便于对齐验收与代码位置）：**

- **reason_codes**：`packages/website/src/lib/product/reason-codes-user-facing.ts` 再导出 `@gaialynk/shared`；聊天与收据页继续通过 `buildUserFacingMessageFromReasonCodes` / `locale-bundle` 消费（与 W-5 一致，消除双源硬编码）。
- **Agent 生命周期 UI**：  
  - `packages/website/src/components/product/agent-detail-enhanced.tsx` — `AgentListingBadges`（目录卡）、`AgentLifecyclePanel`（侧栏版本 + changelog 折叠 + 维护/下架说明）。  
  - `packages/website/src/components/product/agent-card.tsx` + `agent-directory.tsx` — API `listing_status` 映射为 `Agent.listingStatus`；下架卡灰化；维护/下架角标（`getW18AgentLifecycleCopy`）。  
  - `packages/website/src/components/product/context-panel/agent-context.tsx` — 概览 Tab 嵌入 `AgentLifecyclePanel`；`AgentDetailApi` 含 `current_version` / `changelog` / `listing_status`。  
  - `packages/website/src/components/product/chat/chat-first-run-empty.tsx` — `AgentCard` 传入 `lifecycleCopy`。  
- **对话内维护提示**：`packages/website/src/components/product/chat/chat-window.tsx` — 按会话 **Agent 参与者** 拉取 `GET .../agents/:id`，`listing_status === maintenance` 时在输入区上方显示横幅（`w18.maintenanceBanner`）。
- **调用收据详情页（角色视图）**：  
  - 路由：`packages/website/src/app/[locale]/(product)/app/receipt/[id]/page.tsx`（`robots: noindex`）。  
  - 客户端：`packages/website/src/components/product/receipt/invocation-receipt-detail.tsx` — `GET /api/mainline/invocations/:id`，按 `visibility_role` 展示字段；含 `trust_decision`、开发者统计、`user_text_redacted` 提示等。  
  - BFF：`packages/website/src/app/api/mainline/invocations/[id]/route.ts`。  
- **聊天跳转**：`ReceiptSummary` / `TrustCard` — 有 `invocationId` 时「查看收据」或「调用收据」进入 `/{locale}/app/receipt/:id`；否则仍打开右栏密码学收据（`ReceiptContext`）。`ChatMessage.receiptSlice` 含可选 `invocationId`；发送成功 **201** 时消费 `meta.invocation_id`。  
- **主线配合（非纯官网）**：`packages/server/src/modules/gateway/invocation.store.ts` — `createCompletedInvocationRecordAsync`（直通的 `completed` 行）；`packages/server/src/app.ts` — 单路成功 201 的 `meta.invocation_id` + `invocation.completed` 审计 `payload.invocation_id`，供 E-17 收据聚合与官网页一致。  
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W18AgentLifecycleCopy` + `getW18AgentLifecycleCopy`。  
- **单测**：`packages/website/tests/w18-agent-lifecycle-receipt.test.ts`（`@gaialynk/shared`）；`tests/mainline-proxy.test.ts` 增补 `invocations/[id]` 502 / 透传。

**交付完成后特别说明：**

- **多 Agent 同条消息 201**：当前仅在**单路**成功路径写入 `completed` invocation + `meta.invocation_id`；`completed_receipts` 多路 201 仍无逐条 invocation id（若产品要求每条可调收据页，需主线扩展 meta 或统一编排维度，**API-DEBT**）。  
- **右栏收据 vs 调用收据**：右栏 `ReceiptContext` 仍为 **T-5.6 密码学收据**；调用权限矩阵视图以 **`/app/receipt/[invocationId]`** 为准，避免混用两种 ID 语义。  
- **W-5 文档叙述**：历史「reason_codes 双源」已由共享包 + 网站再导出缓解；新增 code 仍须先更新 `packages/shared/src/reason-codes.ts` 再发布网站/主线。  
- **验收勾选**：指令 §W-18 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-19｜邮件通知偏好 + Cookie/同意横幅 `[官网]` — V1.3.1

**依赖**：主线 **E-16**（`users.notification_preferences` JSONB、`PATCH /api/v1/users/:id/notification-preferences` 接受 `email_enabled` / `email_types` / `email_locale`）；网站 **W-10** 通知设置页载体。

**已实现要点（便于对齐验收与代码位置）：**

- **邮件偏好 UI**：`packages/website/src/components/product/settings/w10-account-and-notifications.tsx` — `W10NotificationPreferencesCard` 在既有应用内渠道与策略之外，增加 **邮件总开关**、**六种邮件类型**勾选（与 E-16 模板 ID 一致：`task_completed`、`human_review_required`、`quota_warning`、`agent_status_changed`、`connector_expired`、`space_invitation`）、**邮件语言** `zh` / `en` / `ja`（与主线 `email_locale` 枚举一致）。保存时 **PATCH** 经既有 BFF `packages/website/src/app/api/mainline/users/[id]/notification-preferences/route.ts` 透传主线。开启邮件且未选任何类型时 **前端拦截**并提示（避免违反主线 `email_types` 最小长度校验）。
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — `W10SettingsSuiteCopy` 增补 `emailSection*`、`emailType*`、`emailLocale*`、`emailTypesInvalid`。
- **Cookie 同意**：`packages/website/src/components/cookie-consent-banner.tsx`（经 `cookie-banner-deferred.tsx` 动态加载，根 `layout.tsx` 已挂载）— **必要**（展示为不可关）+ **分析** + **营销** 勾选；**仅必要** / **保存选择** / **全部接受**；`localStorage` 键 **`gaialynk_cookie_consent`**，JSON 含 `analytics_consent`（与 `analytics` 同义，满足验收表述）。旧键 `gl_cookie_consent === "accepted"` 在首次读取时 **迁移**为「全部接受」。
- **分析门控**：`packages/website/src/lib/cookie-consent.ts` — `hasAnalyticsConsentClient` / `COOKIE_CONSENT_CHANGED_EVENT`；`packages/website/src/components/analytics-provider.tsx` — 未同意 **分析** 时不向 `dataLayer` 推送、不调用 `/api/analytics/events`、不初始化 **PostHog**；同意后可按需懒加载 `posthog-js`。
- **合规占位 BFF**：`packages/website/src/app/api/consent/cookies/route.ts` — `POST` 校验 `necessary === true` 与布尔字段后 **204**（未来可接审计落库）。
- **隐私政策 Cookie 段落（三语）**：`packages/website/src/content/privacy-page.ts` + `packages/website/src/app/[locale]/(marketing)/privacy/page.tsx`（`generateMetadata` + `RichLine`）。
- **单测**：`packages/website/tests/w19-prefs-cookie.test.ts` — 同意 JSON 解析与存储键名。

**交付完成后特别说明：**

- **与 CTO 交付物路径差异**：指令表中的 `notifications/preferences` BFF **未新增**；主线实际路径为 **`PATCH /api/v1/users/:id/notification-preferences`**，网站沿用既有 **`/api/mainline/users/:id/notification-preferences`** 代理即可。
- **首次访问与 page_view**：在用户作出同意前，`trackEvent` / PostHog 均不触发；同意后依赖 **后续导航或交互** 才会产生分析事件（若产品要求「同意瞬间补发一次 page_view」，可再在横幅 `persist` 后显式 `trackEvent`）。
- **营销 Cookie**：当前仅占位偏好字段；无第三方营销脚本挂载。
- **验收勾选**：指令 §W-19 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-20｜B 类定时召回 UI + 编排增强 `[官网]` — V1.3.1

**依赖**：主线 **E-14**（`POST /api/v1/orchestrations/execute` 含 `schedule_cron`、`GET /orchestrations/scheduled`、`PATCH /orchestrations/scheduled/:id`、`schedule_paused` 状态、步骤 `lease_expired` 与 `POST .../resume` `abandon_run` 清 cron）；网站 BFF 与产品区 UI。

**已实现要点（便于对齐验收与代码位置）：**

- **主线（W-20 配套 API，非纯官网）**：  
  - `packages/server/src/modules/orchestration/orchestration.types.ts` — Run 状态 **`schedule_paused`**。  
  - `packages/server/src/modules/orchestration/orchestration.store.ts` — **`listUserScheduledOrchestrationRunsAsync`**（`schedule_cron` 非空且 `status <> canceled`）。  
  - `packages/server/src/modules/orchestration/orchestration.router.ts` — **`GET /api/v1/orchestrations/scheduled`**、**`PATCH /api/v1/orchestrations/scheduled/:id`**（`action: pause|resume`）；**`abandon_run`** 时 **`schedule_cron` / `next_run_at` 置空**，避免已放弃任务仍出现在列表。  
  - `packages/server/src/modules/orchestration/orchestration.schema.ts` — **`orchestrationScheduledPatchBodySchema`**。  
  - 单测：`packages/server/tests/e14-orchestration-semantics.test.ts` 增补 **列表 + 暂停/恢复** 用例。
- **BFF**：  
  - `packages/website/src/app/api/mainline/orchestrations/schedule/route.ts` — `POST` → 主线 **`/orchestrations/execute`**（语义别名，体含 `schedule_cron`）。  
  - `packages/website/src/app/api/mainline/orchestrations/scheduled/route.ts` — `GET`。  
  - `packages/website/src/app/api/mainline/orchestrations/scheduled/[id]/route.ts` — `PATCH`。  
  - `packages/website/src/app/api/mainline/orchestrations/[id]/resume/route.ts` — `POST`（**放弃执行**等）。
- **Cron 与摘要工具**：`packages/website/src/lib/product/orchestration-ui-helpers.ts` — **`CronPreset`**、**`cronExpressionFromPicker`**、**`summarizeOrchestrationOutput`**（单测友好，避免自 `.tsx` 引用触发 Vitest 解析问题）。  
- **Cron UI**：`packages/website/src/components/product/cron-picker.tsx`。  
- **任务管理页**：`packages/website/src/app/[locale]/(product)/app/settings/scheduled-tasks/page.tsx` + **`ScheduledTaskManager`**（`packages/website/src/components/product/scheduled-task-manager.tsx`）— 列表、暂停/恢复、展开 **GET …/orchestrations/:id** 步快照、链至会话。  
- **设置导航**：`packages/website/src/components/product/settings/settings-suite-shell.tsx` + **`W10SettingsSuiteCopy.navScheduledTasks`**（`product-experience.ts`）。  
- **Agent 详情入口**：`packages/website/src/components/product/context-panel/agent-context.tsx` — 当 **`supports_scheduled`** 时展示说明 + 链至 **`/{locale}/app/settings/scheduled-tasks`**（**`getW20ScheduledTasksCopy`**）。  
- **编排条增强**：`packages/website/src/components/product/chat/orchestration-plan-bar.tsx` — 草案 **数据流箭头**、**「定时执行」** 弹窗、**横向步骤芯片 + 输出摘要气泡**、**部分成功** 下已完成步 **绿色左边线** / 失败 **红色**、**`lease_expired`** **橙色强调 + 重试 / 更换 Agent（回会话）/ 放弃**、Run 状态 **本地化**（含 `scheduled` / `schedule_paused` / `completed_with_warnings`）。  
- **三语文案**：`packages/website/src/content/i18n/product-experience.ts` — **`W4AgentUxCopy.orchestration`** 增补 W-20 字段；**`W20ScheduledTasksCopy`** + **`getW20ScheduledTasksCopy`**。  
- **测试**：`packages/website/tests/w20-scheduled-orchestration.test.ts`；`packages/website/tests/mainline-proxy.test.ts` 增补 schedule / scheduled / resume **502**。

**交付完成后特别说明：**

- **暂停条件**：主线 **仅当 `status === scheduled`**（等待下一轮）时可 **pause**；**`running`** 中不可通过该 PATCH 暂停，与「等调度」语义一致。  
- **Cron 时区**：UI 与主线均为 **UTC**（与 `orchestration-cron` 一致）；若产品要展示用户本地「下次执行」，需在展示层做时区转换并保持与 `next_run_at` 一致。  
- **「历史执行记录」**：列表展开为 **当前 Run 的 steps 快照**；跨周期完整审计仍以 **主线审计/导出** 为准（**API-DEBT** 与 W-6 导出说明类似）。  
- **「更换 Agent」**：无单独 **PATCH 步级换 Agent** API 时，按钮行为为 **回到会话** 由用户调整参与者后重新推荐方案（与 CTO「更换 Agent」验收意图对齐的 MVP）。  
- **验收勾选**：指令 §W-20 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-21｜帮助中心增量 + 合规文案 + UGC 举报 UI `[官网]` — V1.3.1

**依赖**：主线 **E-18**（`POST /api/v1/messages/:id/report`、`POST .../hide`、`user_content_reports`、`content_hidden` 占位正文）；**E-17** 数据保留矩阵（帮助与隐私摘要口径）。

**已实现要点（便于对齐验收与代码位置）：**

- **帮助中心**：`packages/website/src/content/help-center.ts` — 三语新增 **5** 篇：`data-retention-how-long`（数据保存多久 / How long is data kept?）、`agent-delegated-invites`（助理拉 Agent / 代理邀请）、`orchestration-partial-success`（为什么停在第二步）、`scheduled-tasks-explained`（定时任务 / B 类编排）、`report-inappropriate-content`（如何举报）；`helpArticleSearchHaystack` 增补 **数据保存、保留、举报** 等检索词；能力标签 **定时任务** 文与路线图 **Now**（W-20）一致。
- **营销页**：`packages/website/src/app/[locale]/(marketing)/help/page.tsx` 注释同步 W-21；内容仍由 `getHelpCenter` 驱动，**无需**改 page 结构。
- **合规文案（隐私政策摘要）**：`packages/website/src/content/privacy-page.ts` + `.../privacy/page.tsx` — 新增 **数据保留（摘要）**、**用户内容 / UGC 举报与管理员隐藏** 两节（三语）；`seoDescription` 略扩写以覆盖新节。
- **举报 / 隐藏 UI**：  
  - `packages/website/src/components/product/chat/message-context-menu.tsx` — 右键 + 触控 **长按** 打开菜单。  
  - `packages/website/src/components/product/chat/report-dialog.tsx` — 原因下拉 + 选填详情 → BFF。  
  - `packages/website/src/components/product/chat/hide-message-dialog.tsx` — Space **owner/admin** 确认隐藏。  
  - `packages/website/src/components/product/chat/message-item.tsx` — 组合 Bubble + 菜单；**他人用户消息** 可举报；**管理员** 对用户/Agent 气泡可隐藏（系统消息 / 产品错误面不出菜单）。  
  - `packages/website/src/components/product/chat/message-bubble.tsx` — 占位正文 **虚线框 + muted + 斜体**（与主线 `[该消息已被管理员隐藏]` 一致）。  
  - `packages/website/src/lib/product/moderation-constants.ts` — `MODERATION_HIDDEN_PLACEHOLDER` 与 `isModerationHiddenMessageText`。  
  - `packages/website/src/components/product/chat/chat-window.tsx` — 登录态下注入 `messageModeration`、底部 **Toast**（约 4.2s）、隐藏成功后 **`loadMessages`**。
- **BFF**：`packages/website/src/app/api/mainline/messages/[id]/report/route.ts`（POST）、`.../hide/route.ts`（POST，`{}` body）— Cookie 透传与既有 mainline 代理一致。
- **测试**：`packages/website/tests/w21-help-ugc.test.ts`（帮助检索 + 占位常量）；`tests/mainline-proxy.test.ts` — report/hide **502**。

**交付完成后特别说明：**

- **举报适用范围**：主线仅允许 **多人（≥2 名用户参与者）** 会话中举报 **他人用户消息**；单聊或仅 Agent 时 API 返回 `not_group_conversation` 等，前端以弹窗 **错误文案** 提示（见 `W21ModerationCopy.reportError*`）。
- **占位正文语言**：主线当前统一返回 **中文** 占位字符串；所有语言界面下检测与样式均基于该字面量（若未来主线 i18n 占位，需同步 `moderation-constants` 或多键匹配）。
- **指令文件名 `message-item.tsx`**：本仓库以 **`message-item.tsx`**（`MessageItem`）实现 CTO 表列「消息隐藏」承载；**无**单独 `message-context-menu` 以外的重复件。
- **验收勾选**：指令 §W-21 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## W-22｜桌面 Connector 下载/配对/管理 UI `[官网]` — V1.3.1

**依赖**：主线 **E-19**（Tauri 运行时）、**E-20**（`POST/GET/DELETE /api/v1/connectors/desktop/*`、`desktop_write_confirmation_required` 403 含 `trust_decision`）；网站 **W-10** 连接器设置页为载体。

**已实现要点（便于对齐验收与代码位置）：**

- **BFF**：`packages/website/src/app/api/mainline/connectors/desktop/[...path]/route.ts` — `GET` / `POST` / `DELETE` 透传至主线 `/api/v1/connectors/desktop/...`（配对、设备列表、解绑、`execute`、`write-challenges/.../confirm` 等）；502 映射 `mainline_unreachable`。
- **常量**：`packages/website/src/lib/product/desktop-connector-constants.ts` — `DESKTOP_CONNECTOR_RELEASES_URL`（默认 `https://github.com/gaialynk/gaialynk.com/releases`，可由 `NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL` 覆盖）、`DESKTOP_DEVICE_ONLINE_MS`（最近心跳窗口，用于在线/离线展示）。
- **设置页**：`packages/website/src/components/product/settings/desktop-connector-card.tsx` + `pairing-dialog.tsx` + `desktop-device-list.tsx`；嵌入 `w10-connectors-settings.tsx`（桌面卡片在 Notion 卡之上）。状态摘要：未配对 / 等待 Connector 完成（仅 `pending_pair`）/ 已连接（`active` 且 `last_seen_at` 在窗口内）/ 已配对但离线。`<768px` 视口：卡片 **灰化** + 文案「请在桌面浏览器操作」；下载/配对/列表按钮隐藏（配对弹窗仅桌面区触发）。
- **配对**：`POST /api/mainline/connectors/desktop/pair`，body `pairing_code` **6 位数字**（与主线 `pairBodySchema` 一致）；弹窗引导与错误提示见 **`W22DesktopConnectorCopy`**（`product-experience.ts`）。
- **对话 Trust / 错误面**：`chat-window.tsx` — `403` 且 `trust_decision.decision === need_confirmation` 时与 **`desktop_write_confirmation_required`** 对齐：注入 **需确认** Trust 气泡（含 `desktopExecuteContext`）；确认 → `POST .../write-challenges/:id/confirm` → 带 `write_confirmation_token` 重试 `POST .../execute`。**主线配合**：`desktop-connector.router.ts` 在写入确认 403 的 `details` 中增加 `device_id`、`path`、`action`、`write_targets_new_path_prefix`，供 Web 重试。`trust-card.tsx` 支持 **`resourceLine`**（路径/操作摘要）。`message-bubble.tsx` / `message-list.tsx` / `message-item.tsx` 传递 `onDesktopWriteConfirm` / `onDesktopWriteReject`。
- **设备不可用引导**：`product-error-pattern.ts` — `device_not_found` → `connector` + **`helpArticleId: how-to-install-pair-desktop-connector`**；`ProductErrorCallout` + **`connectorDesktopHelpCta`**（`W7ProductResilienceCopy`）链至 `/{locale}/help#article-how-to-install-pair-desktop-connector`。`ProductErrorSurface.helpArticleId` / `ClassifiedProductError.helpArticleId`。
- **帮助中心**：`packages/website/src/content/help-center.ts` — 连接器组新增 **三语** **`what-is-desktop-connector`**、**`how-to-install-pair-desktop-connector`**；**`browser-vs-desktop`** 增补「托盘配对 vs 云 OAuth / Trust 写入确认」段落；`helpArticleSearchHaystack` 增补 **desktop / pairing / 配对** 等检索词。
- **单测**：`packages/website/tests/w22-desktop-connector-ui.test.ts`；`tests/product-error-pattern.test.ts`（`device_not_found`）；`tests/mainline-proxy.test.ts`（`GET .../desktop/devices` 502）。

**交付完成后特别说明：**

- **GitHub Releases 默认 URL** 为 monorepo 占位；正式发版后应以 **真实 Connector 产物仓库** 配置 `NEXT_PUBLIC_DESKTOP_CONNECTOR_RELEASES_URL`，并在 Releases 中上传 **macOS / Windows** 构建物（与 CTO「指向 GitHub Releases」一致）。
- **在线状态** 为基于 `last_seen_at` 的 **启发式**（非 WS 实时）；与 Connector 轮询/收据回写频率相关，验收时需 **声明非秒级实时**。
- **发送消息 403** 路径下的桌面写入确认依赖 **主线在对话链路中返回** `desktop_write_confirmation_required`；若当前仅 **直连 execute API** 触发，会话内卡片需在集成完成后联调验证。
- **验收勾选**：指令 §W-22 checkbox 仍由产品/CTO 在指令或看板勾选；本文档不替代正式验收记录。

---

## 修订记录

| 日期       | 说明 |
|------------|------|
| 2026-03-23 | 初版：收录 W-1、W-2、W-3 实现要点与交付后特别说明（对齐 `Mainline-Epic-Completion-Special-Notes.md` 体例）；原文件名为 `Website-Epic-W1-W3-Completion-Special-Notes-v1.md` |
| 2026-03-23 | 增补 **W-4**：Agent 目录 / discovery / 详情 Tab / 编排条 / BFF / 主线列表 `trust_badge` |
| 2026-03-23 | 重命名文件为 `Website-Epic-Completion-Special-Notes-v1.md`，避免名称隐含仅含 W-1～W-3 |
| 2026-03-23 | 增补 **W-5**：Trust 卡片、收据摘要、reason_codes 映射、chat-window 与主线 `pending_invocations.trust_decision` |
| 2026-03-23 | 增补 **W-6**：对话列表分组/搜索/归档/置顶标星/导出、主线 PATCH 与 prefs 表、归档关闭只读发消息 |
| 2026-03-23 | 增补 **W-7**：错误模式库、产品错误卡片、离线队列与连接条、SSE 重连、编排 partial_completed 摘要 |
| 2026-03-23 | 增补 **W-8**：通知中心 UI、notifications BFF、deep link、`focus_invocation` 滚动 Trust 卡片；**W-5** 条目中「待审批」入口与 W-8 对齐说明 |
| 2026-03-23 | 增补 **W-9**：Consumer 首启 Hub + ≤4 屏浏览路径、session 草稿/pending Agent、聊天首屏空状态与 `W9FirstRunCopy` |
| 2026-03-23 | 增补 **W-10**：设置套件（账户/通知/连接器/用量配额/数据与删除）、usage BFF、`/account/usage` deep link、W-3 设置入口描述同步 |
| 2026-03-23 | 增补 **W-11**：`/{locale}/help` 最小帮助中心、三语内容、`help-center.ts`、状态标签、搜索与三类预设主题、Footer 入口、sitemap 含 `/help` 与 `/roadmap` |
| 2026-03-23 | 增补 **W-12**：`/{locale}/pricing` 重写为 Coming Soon 产品化页、`pricing-page.ts`、对齐补充 §9 计量叙事、邮件订阅 `pricing_updates`、`pricing-updates-form.tsx` |
| 2026-03-23 | 增补 **W-13**：Provider 控制台（`my-agents` + `ProviderPortalConsole`）、gateway-listing / endpoints / stats BFF、`developers/minimal-onboarding` 15 分钟文档、三语 `W13ProviderPortalCopy` |
| 2026-03-23 | 增补 **W-14**：`LocaleDocumentLang`、营销/产品跳过主内容、`message-list` / 编排条 / 错误 / Trust 的 `aria-live`、登录模态焦点陷阱、会话列表骨架、`lighthouse:gate`、`poweredByHeader: false` |
| 2026-03-25 | 增补 **W-15**：成员 display_name/email_masked、presence、owner 角色/移除、审计导出 BFF、RBAC UI 门控（侧栏连接器、聊天附件、连接器页）；主线补充 `DELETE .../members/:userId`；同步修订 **W-3**「成员展示」条为已由 W-15 覆盖 |
| 2026-03-25 | 增补 **W-16**：主线 WS + `realtime-handshake`、SSE 降级、`ws-client` / `sse-fallback`、已读双勾 / Typing / 参与者 Presence 圆点、`W16RealtimeCopy`、`w16-ws-realtime.test.ts` |
| 2026-03-25 | 增补 **W-17**：Notion 设置卡片 + OAuth 弹窗 + `oauth-complete` 回跳、`notion` BFF、`parse-notion-system-message` + `NotionReceiptCard`；主线 **0035** `oauth_workspace_name` 与系统消息 JSON 收据行 |
| 2026-03-25 | 增补 **W-18**：Agent 生命周期 UI（目录卡 `listing_status`、侧栏 `AgentLifecyclePanel`）、调用收据页 `app/receipt/[id]` + `invocations` BFF、聊天内维护中横幅与 Trust「调用收据」链、201 `meta.invocation_id` + `createCompletedInvocationRecordAsync`（主线）；`reason_codes` 经 `@gaialynk/shared`（`reason-codes-user-facing` 再导出） |
| 2026-03-25 | 增补 **W-19**：通知设置邮件总开关 + 六类 `email_types` + `email_locale`（`w10-account-and-notifications` + 既有 notification-preferences BFF）、`cookie-consent-banner` + `gaialynk_cookie_consent`、分析/PostHog 门控、`/api/consent/cookies`、`privacy-page` 三语 Cookie 说明、`w19-prefs-cookie.test.ts` |
| 2026-03-25 | 增补 **W-20**：主线 `schedule_paused` + `GET/PATCH …/orchestrations/scheduled*`、`abandon_run` 清 cron；网站 BFF、`scheduled-tasks` 设置页、`CronPicker`、`orchestration-ui-helpers`、`orchestration-plan-bar` 定时与数据流/租约 UI、`w20-scheduled-orchestration.test.ts` 与 proxy 502 |
| 2026-03-25 | 增补 **W-21**：`help-center` 五篇三语、隐私政策保留/UGC 两节、`message-context-menu` + `report-dialog` + `hide-message-dialog` + `message-item`、`moderation-constants`、Bubble 占位样式、chat Toast、messages report/hide BFF、`w21-help-ugc.test.ts` 与 proxy 502 |
| 2026-03-25 | 增补 **W-22**：`connectors/desktop` BFF、`desktop-connector-card` + 配对弹窗 + 设备表、移动端灰化、`chat-window`/`trust-card` 桌面写入确认与 `device_not_found` 帮助链、帮助中心三篇（含扩展 `browser-vs-desktop`）、主线 403 `details` 扩展、`w22-desktop-connector-ui.test.ts` 与 proxy 502 |
