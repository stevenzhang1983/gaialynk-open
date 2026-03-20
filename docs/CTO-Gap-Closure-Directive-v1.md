# GaiaLynk 差距收口指令 v1

> 签发人：CTO  
> 签发日期：2026-03-20  
> 性质：**收口指令——对 CTO-Website-Optimization-Plan-v1 & CTO-Execution-Directive-v1 验收巡检后的补丁包**  
> 执行团队：官网开发团队（A/B 类）、主线开发团队（C 类待对接）  
> 依据：CTO 对 Staging 站点及代码库的逐项审查

---

## 0. CTO 判断摘要

经逐项核查代码库与 Staging 站点，当前官网优化工作**主体框架已到位**（双 Layout、六屏首页骨架、产品区 IM 三栏布局、路线图页面、开发者入口等），但仍存在 **6 项结构性差距** 和 **6 项体验/品质差距** 需要收口。本指令对每项差距给出**诊断、根因、修复方案、验收条件**，并按优先级排序。

**优先级原则**：
- **P0（阻塞对外展示）**：修复后才能对外发布
- **P1（影响品质感知）**：可在对外发布后 1 周内补齐
- **P2（可接受的品质债）**：按迭代节奏安排

---

## A. 结构性差距

### A1. `/node-collaboration` 页面 404 `[官网]` — P0

**诊断**：`app/[locale]/(marketing)/node-collaboration/` 目录存在但为空（无 `page.tsx`）。Sitemap 中包含该路由，实际访问 404。`/use-cases/node-collaboration` 存在（通过 `[slug]` 动态路由），但顶层 `/node-collaboration` 缺失。

**根因**：T-3.11 指令要求创建 Coming Soon 占位页，但只创建了目录未写入页面文件。

**修复方案**：在 `app/[locale]/(marketing)/node-collaboration/` 下创建 `page.tsx`，内容为 Coming Soon 占位页（与执行指令 T-3.11 一致）：
- 页面标题："Node Collaboration" / "节点协作" / "節點協作"
- 状态标签：Coming Soon
- 一段愿景描述文字（三语）
- 可选：邮箱订阅或 "Back to Home" CTA
- SEO metadata

**验收条件**：
- [ ] `/{locale}/node-collaboration` 返回 200
- [ ] 页面展示 "Coming Soon" 状态
- [ ] 三语文案完整
- [ ] Sitemap 中该路由有效

---

### A2. 首页保留三个旧区块导致信息过载 `[官网]` — P0

**诊断**：首页在六屏核心内容（Hero → Product Preview → Feature Showcase → Value Proposition → How It Works → Roadmap Preview → Developer Ecosystem → Final CTA）之后，仍然保留了三个旧区块：
1. **Vision Coverage Panorama**（10 赛道网格）— 第 166-185 行
2. **Product Entry by User Intent**（4 张入口卡片）— 第 187-214 行
3. **Decisions, review, receipts**（Evidence 区块）— 第 216-228 行

这三个区块位于 `DeveloperEcosystemSection` 和 `FinalCtaSection` 之间，严重违反优化计划 §6.1 的要求：「首页只讲一个核心故事——10 赛道全景应移到 /roadmap」。

**根因**：重构首页时新增了六屏内容，但未移除旧区块。

**修复方案**：
1. 从 `app/[locale]/(marketing)/page.tsx` 中**移除**三个旧区块的 JSX（第 166-228 行）
2. 同步移除不再使用的 import（`getVisionTracks`、`StatusBadge`、`uiText` 对象）
3. **Evidence 核心内容**（策略决策、人工审核、签名收据）已被 Feature Showcase 的 "Evidence by Default" 区块和 How It Works 流程覆盖，无需另外迁移
4. **Vision Coverage Panorama 的 10 赛道数据**可保留在 `/roadmap` 页面（如已包含则无需操作；如未包含，补入 roadmap 页底部作为"愿景覆盖全景"区域）
5. **Product Entry by User Intent 的 4 张入口卡片**已被产品区侧边栏功能入口覆盖，无需迁移

**验收条件**：
- [ ] 首页 `FinalCtaSection` 紧跟在 `DeveloperEcosystemSection` 之后，中间无其他内容区块
- [ ] 首页不再出现 "Vision Coverage Panorama" 标题
- [ ] 首页不再出现 "Product Entry by User Intent" 标题
- [ ] 首页不再出现独立的 "Decisions, review, receipts" 区块
- [ ] `/roadmap` 页面仍可看到完整路线图内容（验证不影响 roadmap 页数据）

---

### A3. 产品界面 Mockup 中文案未跟随语言切换 `[官网]` — P0

**诊断**：`components/marketing/product-preview-mockup.tsx` 中**全部文案硬编码为英文**，共 20+ 处。涉及：
- 标题栏："GaiaLynk Agent IM"、"Preview"
- 对话列表："Conversations"、"Summary request"、"API docs lookup"、"Code review"
- 对话内容："Summarize the latest API changes and risks."、"I found 3 breaking changes..."
- 风险确认："Risk confirmation required"、"Execute external API call?"、"Approve"、"Reject"
- Agent 信息："Agent Alpha"、"Verified"、"Reputation: 4.8"
- 收据："Call receipt"、"Signed · Verifiable"、"View details →"

同样，`feature-showcase-section.tsx` 中的 Mockup 内嵌文案也存在硬编码英文（"Verified · 4.8" 等）。

**根因**：Mockup 组件作为纯展示组件开发时未传入 locale/dictionary，所有文字直接写死。

**修复方案**：
1. 在 `content/i18n/` 下新建 `product-mockup-copy.ts`，定义三语文案对象
2. 修改 `ProductPreviewMockup` 组件接收 `locale` prop，从 i18n 文件获取文案
3. 在首页 `page.tsx` 中将 `locale` 传入 `<ProductPreviewMockup locale={locale} />`
4. 同理处理 `FeatureShowcaseSection` 中的硬编码文案

**三语文案示例**：

| Key | EN | 繁中 | 简中 |
|-----|----|----|------|
| `topBarTitle` | GaiaLynk Agent IM | GaiaLynk Agent IM | GaiaLynk Agent IM |
| `topBarBadge` | Preview | 預覽 | 预览 |
| `conversationsLabel` | Conversations | 對話 | 对话 |
| `convTitles` | Summary request / API docs lookup / Code review | 摘要請求 / API 文件查詢 / 程式碼審查 | 摘要请求 / API 文档查询 / 代码审查 |
| `userMessage` | Summarize the latest API changes and risks. | 請總結最新的 API 變更與風險。 | 请总结最新的 API 变更与风险。 |
| `agentReply` | I found 3 breaking changes. One action requires your approval before I proceed. | 我發現了 3 個破壞性變更。其中一項操作需要您的批准才能繼續。 | 我发现了 3 个破坏性变更。其中一项操作需要您的批准才能继续。 |
| `riskTitle` | Risk confirmation required | 需要風險確認 | 需要风险确认 |
| `riskDesc` | Execute external API call? Approve or reject below. | 執行外部 API 呼叫？請在下方批准或拒絕。 | 执行外部 API 调用？请在下方批准或拒绝。 |
| `approve` | Approve | 批准 | 批准 |
| `reject` | Reject | 拒絕 | 拒绝 |
| `agentReply2` | Summary ready. Receipt attached. | 摘要已完成。收據已附上。 | 摘要已完成。收据已附上。 |
| `agentReceiptLabel` | Agent & Receipt | Agent 與收據 | Agent 与收据 |
| `agentName` | Agent Alpha | Agent Alpha | Agent Alpha |
| `verified` | Verified | 已驗證 | 已验证 |
| `reputation` | Reputation: 4.8 | 信譽：4.8 | 信誉：4.8 |
| `receiptTitle` | Call receipt | 調用收據 | 调用收据 |
| `receiptDesc` | Signed · Verifiable | 已簽名 · 可驗證 | 已签名 · 可验证 |
| `viewDetails` | View details → | 查看詳情 → | 查看详情 → |

**验收条件**：
- [ ] 简中首页 Mockup 区域全部文案为中文
- [ ] 繁中首页 Mockup 区域全部文案为繁中
- [ ] 英文首页 Mockup 区域保持英文
- [ ] Feature Showcase 区域的 Mockup 文案同样跟随语言切换
- [ ] 品牌名 "GaiaLynk Agent IM" 三语保持英文（品牌名不翻译）

---

### A4. `/use-cases/enterprise-governance` 子页验证 `[官网]` — ✅ 已确认存在

**诊断**：经代码审查确认，`app/[locale]/(marketing)/use-cases/enterprise-governance/page.tsx` 独立页面**已存在**，包含完整三语文案和 SEO metadata。

**状态**：无需修复。此项从差距清单中关闭。

---

## B. 体验与品质差距

### B1. Hero 区域品牌动效背景不够显著 `[官网]` — P1

**诊断**：Hero 背景动效**代码已实现**（`hero-background.module.css` 中有 `heroGridPulse`、`heroGlowBreath`、`heroLinesMove` 三组 CSS 动画），并通过 `HeroBackgroundDeferred` 延迟加载。但在实际 Staging 观感中，动效可能过于微妙——网格线透明度很低、光晕范围小、连接线不够明显，整体给人"纯暗色背景"的印象。

**根因**：动效设计偏保守（性能优先思路正确，但品牌感知不足）。

**修复方案**：
1. **网格线**：适当提高网格线透明度（从当前值提升 30-50%），增加网格密度或渐变效果
2. **光晕呼吸**：增大光晕范围和亮度峰值，使呼吸效果更明显
3. **连接线**：增加连接线数量或亮度，使其在首次加载后 1-2 秒内可见
4. **整体**：可叠加一层从底部到顶部的品牌色渐变（primary/5 → transparent），增加层次感
5. 移动端策略不变（关闭动画以省电）

**验收条件**：
- [ ] 桌面端首次加载后 2 秒内，背景动效对人眼可感知（非需仔细看才能发现）
- [ ] 动效传达"网络 / 协作 / 基础设施"的视觉感知
- [ ] 性能不退化：动效 GPU 加速、不影响 LCP
- [ ] `prefers-reduced-motion` 仍正常降级

---

### B2. Chat 窗口显示 Mock 数据原始 ID 与调试文案 `[官网]` — P0

**诊断**：产品区聊天窗口的 Agent 消息存在两类暴露问题：
1. **server 端**：`packages/server/src/modules/gateway/a2a.gateway.ts` 第 77 行生成 `mocked A2A response from ${agent.name} for conversation ${conversationId}: ${userText}` 格式的响应
2. **client 端**：`message-bubble.tsx` 第 78-86 行将 `agentVerificationStatus` 以 `uppercase` 显示为 "VERIFIED"，并在 Agent 名称旁显示完整 UUID
3. **context panel**：`receipt-context.tsx` 完整展示 receiptId 和 audit_event_id 的 UUID；`agent-context.tsx` 显示 `ID: {agent.id}` 原始 UUID

**根因**：当前全部使用 Mock 数据，对外展示时未做数据清洗。

**修复方案**（官网团队 + 主线团队协同）：

**A. 官网团队（前端清洗）**：
1. `message-bubble.tsx`：Agent 验证状态改用友好文案 + Badge 样式（如绿色小标 "✓ Verified"），不直接 `uppercase` 原始字段
2. `message-bubble.tsx`：Agent 名称区域不显示原始 UUID，仅显示 Agent 名称 + 验证 Badge
3. `receipt-context.tsx`：receiptId 和 audit_event_id 截断显示（如 `rcpt_a1b2...c3d4`），完整值放在 "复制" 按钮后
4. `agent-context.tsx` / `agent-detail-panel.tsx`：Agent ID 截断显示或移到次要信息区

**B. 主线团队（后端清洗）**：
1. `a2a.gateway.ts`：将 mock 响应改为更自然的对话式文案，不暴露 conversationId
2. Mock 数据应使用语义化的 ID（如 `agent-alpha-001`）而非随机 UUID

**验收条件**：
- [ ] 产品区聊天窗口中无完整 UUID 可见
- [ ] 无 "mocked A2A response from..." 格式的技术文案
- [ ] Agent 验证状态以友好 Badge 展示，非全大写原始字段
- [ ] 收据和审计 ID 截断展示，不暴露完整技术 ID

---

### B3. 产品区状态栏显示 "Disconnected" `[官网]` — P1

**诊断**：产品区底部状态栏通过 `productUi.statusDisconnected` 始终显示 "Disconnected"/"未连接"。i18n 已正确实现（三语均有对应文案）。问题在于：当未连接后端时，对外展示"断开连接"会降低产品可信度。

**根因**：状态栏从 `shell.tsx` 传入固定的 `statusDisconnected` 值，无真实连接状态判断。

**修复方案**：两种策略择一：

**策略 A（推荐）：Mock 连接状态**
- 在未连接真实后端时，状态栏显示 "Demo Mode" / "演示模式" 而非 "Disconnected"
- 连接图标使用中性色（灰/蓝），非红色断连
- 新增 i18n key：`statusDemoMode`

**策略 B：隐藏状态栏**
- 在未连接真实后端时，完全隐藏底部状态栏
- 仅在真实 API 连接后显示

**验收条件**：
- [ ] 产品区底部不再显示 "Disconnected" / "未连接" / "未連線"
- [ ] 替代展示不降低产品可信度

---

### B4. Cookie Banner 遮挡底部 CTA `[官网]` — P1

**诊断**：Cookie Banner 使用 `fixed inset-x-4 bottom-4` 定位，固定在页面底部。当用户滚动到首页底部 CTA 区域（"准备好了吗？" + Open App / Start Building / Book a Demo）时，Cookie Banner 遮挡了这些按钮。

**根因**：Cookie Banner 位置设计未考虑与页面内容的交互冲突。

**修复方案**：
1. **减小侵入性**：将 Cookie Banner 改为右下角紧凑卡片（`right-4 bottom-4 max-w-sm`），而非横跨底部
2. **添加自动隐藏**：用户向下滚动到页面底部 CTA 区域时（距页底 < 200px），Banner 自动上移或半透明化
3. **提高关闭便利**：增加 "×" 关闭按钮（点击后记录 `localStorage`，等同于 Accept），不强制只有 Accept 一个操作

**验收条件**：
- [ ] Cookie Banner 不遮挡首页底部 "准备好了吗？" 区域的 CTA 按钮
- [ ] Banner 关闭/接受后不再出现
- [ ] 移动端 Banner 不占据过大屏幕面积

---

### B5. 首页特性展示区未使用真实截图 `[官网]` — P2

**诊断**：Feature Showcase 区域使用简化的 CSS 卡片式 Mockup（内嵌 HTML 模拟界面），而非 alma.now 风格的浮窗式截图展示。

**CTO 判断**：当前 CSS Mockup 品质**可接受**但未达参考站水准。鉴于产品区 UI 仍在迭代，此时制作真实截图性价比不高。

**修复方案**（P2，迭代处理）：
1. 当前阶段保持 CSS Mockup，但**提升视觉品质**：增加毛玻璃效果、阴影层次、微交互
2. 产品区 UI 稳定后（预计 Phase B 完成后），替换为真实界面截图 + Next.js `<Image>` 优化加载
3. 截图使用 alma.now 风格：带阴影、轻微倾斜、浮窗感

**验收条件**（当前阶段）：
- [ ] 各特性区块 CSS Mockup 视觉统一、有层次感
- [ ] 后续替换为真实截图时，组件接口支持图片/组件两种模式

---

### B6. 桌面端导航可见性验证 `[官网]` — ✅ 已确认正常

**诊断**：经代码审查确认，`marketing/navbar.tsx` 的主导航使用 `md:flex` 断点（768px+），在 1280px+ 的桌面端宽屏下，Roadmap / Use Cases / Developers / Pricing 四个导航项和语言切换均正常显示。用户截图可能是在移动端视口下拍摄。

**状态**：无需修复。此项从差距清单中关闭。

---

## C. 待对接 / 未验证项（依赖主线团队）

> 以下项目不在本指令的直接修复范围内，但需要明确状态和下一步。

| # | 项目 | 当前状态 | 下一步 | 责任方 |
|---|------|---------|--------|--------|
| C1 | Consumer Onboarding（T-4.7） | 代码存在，Mock 数据 | 需 E2E 走通验证 | 官网团队 |
| C2 | Provider Onboarding（T-4.8） | 代码存在，依赖 Agent 接入 API | 等主线 T-5.4 交付后联调 | 协同 |
| C3 | OAuth 登录（T-4.6） | 代码存在，依赖 OAuth callback 重定向 | 等主线修改 OAuth 回调为 302 重定向 | 主线 |
| C4 | 真实 API 对接（T-5.x） | 全部 Mock | 按 T-5.1 → T-5.3 → T-5.2 → T-5.4 → T-5.5 → T-5.6 顺序交付 | 主线 |
| C5 | Core Web Vitals（T-6.4） | 未在生产环境验证 | 部署后用 Lighthouse 实测 | 官网团队 |

**CTO 指令**：C 类项目不阻塞本次收口，但需在 Staging 环境上逐项验证。主线团队优先交付 T-5.3（认证 API），解锁 OAuth 和写操作登录流程。

---

## 执行优先级汇总

| 优先级 | 差距项 | 团队 | 预估工时 |
|--------|--------|------|---------|
| **P0** | A1 — `/node-collaboration` 占位页 | 官网 | 0.5h |
| **P0** | A2 — 首页移除三个旧区块 | 官网 | 1h |
| **P0** | A3 — Product Mockup i18n | 官网 | 2-3h |
| **P0** | B2 — Chat 窗口清理 Mock 暴露 | 协同 | 2h |
| **P1** | B1 — Hero 动效增强 | 官网 | 1-2h |
| **P1** | B3 — Status Bar 状态优化 | 官网 | 0.5h |
| **P1** | B4 — Cookie Banner 优化 | 官网 | 1h |
| **P2** | B5 — Feature Showcase 视觉升级 | 官网 | 迭代处理 |

**总预估**：P0 项合计 ~6h，P1 项合计 ~3h，可在 1-2 个工作日内完成收口。

---

## 验收标准

本指令所有 P0 项修复完成后，进行以下总验收：

1. [ ] 首页六屏结构清晰，无旧区块残留
2. [ ] 三语切换后，首页所有可见文案正确切换（含 Mockup 区域）
3. [ ] `/node-collaboration` 返回 200 且展示 Coming Soon
4. [ ] 产品区聊天窗口无技术 ID 和调试文案暴露
5. [ ] 以上修复不引入新的 TypeScript 编译错误
6. [ ] 以上修复不影响现有 `/roadmap`、`/use-cases`、`/developers` 等页面

---

*文档版本：v1（2026-03-20）*  
*签发：CTO（联合创始人/技术最高负责人）*  
*状态：即刻生效，P0 项立即执行*
