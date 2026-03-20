# GaiaLynk 优化执行指令 v1

> 签发人：CTO  
> 签发日期：2026-03-18  
> 执行团队：官网开发团队、主线开发团队  
> 依据文档：`CTO-Website-Optimization-Plan-v1.md`（v1.1）、`CTO-Product-Mainline-and-Roadmap-v1.md`  
> 性质：**指令文档，各团队按序执行，完成后逐项向 CTO 报告验收**

---

## 0. 阅读须知

- 本文档按**依赖顺序**编排，标注了前置依赖的任务必须在依赖项完成后才能开始。
- 标记 `[官网]` 的任务由官网开发团队执行，标记 `[主线]` 的由主线开发团队执行，标记 `[协同]` 的需要两个团队配合。
- 每个任务包含：**做什么**、**怎么做**、**交付物**、**验收条件**。
- 没有时间周期限定，但任务之间的**依赖关系是硬性的**，不可跳过。

---

## 1. 设计基础建设

> 这组任务产出的设计系统是后续所有 UI 开发的基础。必须最先完成。

### T-1.1 品牌色彩系统定义 `[官网]`

**做什么**：定义整套品牌色彩体系，输出为 CSS Variables / Tailwind theme config。

**怎么做**：
1. 使用 impeccable.style 的 `colorize` skill
2. 方向：深空色主色调 + 冷调蓝绿渐变品牌色 + 高对比度 accent 色
3. 需要覆盖：primary / secondary / accent / background / surface / border / text 各层级
4. 官网区和产品区共享同一套色彩 Token，仅在使用方式上有差异

**交付物**：
- `design-tokens/colors.css`（CSS Variables）
- Tailwind `theme.extend.colors` 配置
- 色彩使用规范文档（哪个色用在什么场景）

**验收条件**：
- [ ] 品牌主色与当前 Logo 协调
- [ ] 暗色模式下 WCAG AA 对比度达标
- [ ] 官网区和产品区使用同一套 Token

### T-1.2 字体系统定义 `[官网]`

**做什么**：选定品牌字体并输出配置。

**怎么做**：
1. 使用 impeccable.style 的 `typeset` skill
2. 英文：选定展示字体（Hero / H1-H3）+ 正文字体（body / caption）
3. 中文（简/繁）：选用高品质中文字体（思源黑体 / Noto Sans CJK 或同级）
4. 定义字号阶梯、行高、字重规范

**交付物**：
- `design-tokens/typography.css`
- Tailwind typography 配置
- 字体加载策略（Next.js `next/font` 配置）

**验收条件**：
- [ ] Hero H1 在桌面端视觉有力量感，不超过两行
- [ ] 中英文混排时基线对齐、间距和谐
- [ ] 字体加载不阻塞 FCP

### T-1.3 组件风格规范 `[官网]` ✅ 规范已定稿

**做什么**：定义全局 UI 组件的视觉风格。

**怎么做**：
1. 使用 impeccable.style 的 `get_style_guide_tags` → `get_style_guide(tags)` 获取适合 Agentic 基础设施赛道的风格指南（已定稿引用：**`webapp-03-terminaltechnicalcrisp_light`** — 工程感状态语汇与局部等宽；全站主 UI 仍以 T-1.2 西文展示+正文字体为主）。
2. 定义：按钮、卡片、输入框、导航、Tag、Badge、Modal、Toast 等基础组件的视觉规范 → **见 `packages/website/design-tokens/COMPONENT-STYLES.md`**。
3. 风格方向：毛玻璃效果、渐变边框、品牌阴影、有质感卡片 → **Token 见 `design-tokens/effects.css`**，Tailwind：`rounded-xs`～`xl`、`shadow-brand-sm` / `shadow-card` 等。

**交付物**：
- [x] **组件风格规范文档**：`packages/website/design-tokens/COMPONENT-STYLES.md`
- [x] **效果 Token + Tailwind 扩展**：`effects.css` + `tailwind.config.ts`（圆角/阴影）
- [ ] 组件 Storybook 或等价可视化稿（实现阶段）
- [ ] 共享组件库（基于 shadcn/ui 品牌化变体，按规范落地）

**验收条件**：
- [ ] 所有组件在亮色/暗色模式下均可正常使用（**设计规范已覆盖双模式；实现验收以 Storybook/页面为准**）
- [ ] 组件风格统一，不存在"拼凑感"（**规范 §1/§12 已定义统一原则与清单**）

---

## 2. 前端架构重构

> 这组任务建立双区架构基础。依赖 T-1 完成。

### T-2.1 创建双 Layout 架构 `[官网]`

**前置依赖**：T-1.1, T-1.2

**做什么**：将当前单一 Layout 拆分为官网区 Layout 和产品区 Layout。

**怎么做**：
1. 使用 Next.js Route Groups：
   - `app/[locale]/(marketing)/` → 官网区 Layout
   - `app/[locale]/(product)/app/` → 产品区 Layout
2. 官网区 Layout：顶部导航 + 内容区 + Footer
3. 产品区 Layout：产品导航栏 + 三栏 IM 布局（侧边栏 + 主区 + 右侧面板）
4. 两个 Layout 共享 `design-tokens`，但 Shell 组件完全独立

**交付物**：
- 两个独立的 `layout.tsx` 文件
- 路由分组配置
- 共享品牌 Token 引用方式

**验收条件**：
- [ ] `/` 和 `/roadmap` 等官网页面使用官网 Layout
- [ ] `/app` 及其子路由使用产品区 Layout
- [ ] 两个 Layout 切换时品牌视觉连贯，不存在断裂感
- [ ] 不影响现有 `/api/` 路由

### T-2.2 官网区导航组件 `[官网]`

**前置依赖**：T-2.1

**做什么**：重建官网区顶部导航。

**怎么做**：
1. 左侧：GaiaLynk Logo + 品牌名（链接到 `/`）
2. 中间导航项：Roadmap / Use Cases / Developers / Pricing
3. 右侧：语言切换（EN / 繁中 / 简中） + **【Open App →】** 主 CTA 按钮
4. 移动端：汉堡菜单展开，Open App 按钮始终可见
5. 滚动时 navbar 固定顶部 + 毛玻璃背景效果

**交付物**：
- `components/marketing/navbar.tsx`
- 移动端响应式菜单

**验收条件**：
- [ ] 导航中**不包含**任何产品功能入口（Ask、Tasks、Agents 等已移除）
- [ ] 导航中**不包含**独立 Docs 入口（已合并入 Developers）
- [ ] Open App 按钮在所有视口宽度下始终可见
- [ ] 三语切换即时生效
- [ ] 当前页面对应的导航项有 active 状态

### T-2.3 产品区导航与 Shell `[官网]`

**前置依赖**：T-2.1

**做什么**：构建产品区顶部导航栏和三栏布局骨架。

**怎么做**：
1. 顶部导航：Logo（链接到 `/app`）| [← 回官网]（链接到 `/`） | 右侧：用户头像（未登录时显示"登录"按钮） | 设置
2. 三栏布局：
   - 左侧边栏（可折叠，宽度 260-280px）
   - 中间主内容区（flex-1）
   - 右侧上下文面板（可折叠，宽度 300-320px）
3. 底部状态栏：连接状态 | Agent 在线数 | 当前空间
4. 移动端：侧边栏变为底部 Tab 或抽屉式，右侧面板默认收起

**交付物**：
- `components/product/shell.tsx`
- `components/product/sidebar.tsx`
- `components/product/context-panel.tsx`
- `components/product/status-bar.tsx`

**验收条件**：
- [ ] 三栏布局在 1280px+ 屏幕正常展示
- [ ] 侧边栏可折叠/展开
- [ ] 右侧面板可折叠/展开
- [ ] 移动端布局可用
- [ ] 未登录状态下可正常浏览（不弹登录）

---

## 3. 官网区页面开发

> 按首页各屏依赖顺序排列。依赖 T-2 完成。

### T-3.1 首页 Hero 区域 `[官网]`

**前置依赖**：T-2.2, T-1.3

**做什么**：实现首页第一屏 Hero。

**怎么做**：
1. 品牌动效背景：渐变网格 / 粒子 / 节点连接线呼吸动画
   - 使用 CSS animation 或 lightweight canvas，**禁止**引入 Three.js 等重型 3D 库
2. 文案层级：
   - Eyebrow：`Trusted Agent Gateway`
   - H1：`让每一个被调用的 Agent 都经过验证、受到管控、可被追溯。`
   - Subtitle：`每一个被调用的 Agent 都经过身份验证、能力校验和行为追踪——恶意 Agent 被挡在门外，调用全程有策略管控、人工审核和可验证收据。`
3. CTA 按钮：`Start Building`（主）+ `Open App →`（次）
4. 三语文案全部就位（EN / 繁中 / 简中），质量对等
5. 可选：Hero 底部放一个极简的产品界面 Mockup 预览

**交付物**：
- `app/[locale]/(marketing)/page.tsx` Hero 区域
- Hero 背景动效组件
- 三语文案 JSON/i18n 文件

**验收条件**：
- [ ] 首屏 3 秒内传达"GaiaLynk 是什么 + 为什么重要"
- [ ] H1 大字醒目、不超过两行
- [ ] Hero 动效在低端设备不卡顿（CSS animation 优先）
- [ ] LCP < 2.5s
- [ ] 三语切换后文案完整、排版不破

### T-3.2 首页产品界面预览区域 `[官网]`

**前置依赖**：T-3.1

**做什么**：首页第 1.5 屏，展示产品 IM 界面的高保真 Mockup 或截图。

**怎么做**：
1. 制作一张高保真 IM 界面 Mockup，包含：
   - 左侧：对话列表
   - 中间：用户 ↔ Agent 真实对话 + 一个风险确认卡片
   - 右侧：Agent 身份与信誉面板 + 调用收据
2. 以浮窗式展示（带轻微倾斜、阴影、光效）
3. 可选：hover 时界面轻微"活"起来（消息滚动动画）
4. 如产品区已有真实 UI，用真实截图替换 Mockup

**交付物**：
- Mockup 图片 / SVG / 交互组件
- 对应的首页区域组件

**验收条件**：
- [ ] Mockup 体现三个核心能力：对话、Agent 身份与信誉、风险拦截
- [ ] 视觉品质达到 alma.now 的产品展示水准
- [ ] 响应式适配（移动端可缩放或改为单屏展示）

### T-3.3 首页核心价值主张区域 `[官网]`

**前置依赖**：T-3.1

**做什么**：首页第二屏，三列价值主张卡片。

**怎么做**：
1. 标题引导语：`在 Agent 互联网时代，Agent 准入不是功能，而是基础设施。`
2. 三列卡片：
   - **Verified Agents** / 经过验证的 Agent
   - **Trust as Policy** / 策略决定准入边界
   - **Evidence by Default** / 每一步都有据
3. 每张卡片：品牌 icon + 短标题 + hover 展开 1-2 句说明
4. 入场动画：scroll-triggered stagger reveal

**交付物**：
- 首页价值主张区域组件
- 三套 icon（可先用通用 icon 占位，后续替换品牌 icon）

**验收条件**：
- [ ] 三张卡片信息层级清晰
- [ ] hover 展开交互自然
- [ ] 入场动画流畅

### T-3.4 首页 How It Works 区域 `[官网]`

**前置依赖**：T-3.1

**做什么**：首页第三屏，交互式 Agent 可信调用流程展示。此区域同时承担原 `/trust-flow` 页面的职能。

**怎么做**：
1. 标题：`平台如何确保你调用的 Agent 是可信的？`
2. 五步流程：
   - ① 用户说出需求
   - ② 平台从经过验证的 Agent 中匹配最合适的（身份校验 ✓ 能力声明 ✓ 信誉评分 ✓）
   - ③ 风险评估 → 高风险操作自动拦截 / 需人工确认
   - ④ 可信 Agent 执行 → 结果 + 可验证收据
   - ⑤ 完整审计链可追溯，异常行为可追责
3. 展示形式：垂直时间线或水平流程图
4. 每步可点击展开详情
5. 动画：scroll-triggered，滚动到对应区域时逐步展开

**交付物**：
- 首页 How It Works 区域组件
- 流程动画实现

**验收条件**：
- [ ] 五步流程在不点击展开的情况下也能快速扫读
- [ ] 点击某步后展开的详情有实质性内容
- [ ] scroll-triggered 动画不闪烁、不跳跃

### T-3.5 首页路线图预览区域 `[官网]`

**前置依赖**：T-3.1

**做什么**：首页第四屏，展示产品路线图概览。

**怎么做**：
1. 标题：`我们正在建造的未来` / 副标题：`从可信 Agent 准入到 Agent 互联网`
2. 交互式水平时间线：
   - Phase 0（Agent准入 调用闭环）[Now ●]
   - Phase 1（协作风控 + 自动化起步）[In Progress]
   - Phase 2（自动化+生态 + 节点起步）[Coming Soon]
   - Phase 3（网络+企业 + 治理）[Planned]
3. 点击 Phase 展开 3-5 条核心交付项
4. 七大里程碑标签条：M1 → M2 → M3 → M4 → M5 → M6 → M7
5. 底部 CTA：`查看完整路线图 →`（链接到 `/roadmap`）
6. 数据源：路线图内容来自 `CTO-Product-Mainline-and-Roadmap-v1.md`

**交付物**：
- 首页路线图预览组件
- 路线图数据结构（JSON / TypeScript 常量，三语）

**验收条件**：
- [ ] 时间线可交互，点击 Phase 展开详情
- [ ] 状态标签颜色与 Roadmap 文档定义一致（绿/蓝/橙/灰/紫）
- [ ] 三语内容完整
- [ ] CTA 正确链接到 `/roadmap`

### T-3.6 首页开发者生态区域 `[官网]`

**前置依赖**：T-3.1

**做什么**：首页第五屏，开发者生态入口。

**怎么做**：
1. 标题：`为开发者而建，与社区共建`
2. 三列卡片：
   - 快速开始（5 分钟接入首个 Agent）→ 链接到 `/developers/quickstart`
   - SDK & API（TypeScript / Python / REST）→ 链接到 `/developers/sdk`
   - 开源仓库（GitHub Star）→ 链接到 GitHub 仓库
3. 可选：GitHub Star 实时计数器
4. CTA：`Start Building →`（链接到 `/developers`）

**交付物**：
- 首页开发者生态区域组件

**验收条件**：
- [ ] 三张卡片链接正确
- [ ] 突出"接入 Agent"而非"写代码"——面向 Provider 角色

### T-3.7 首页 CTA 收尾 + Footer `[官网]`

**前置依赖**：T-3.1

**做什么**：首页第六屏收尾 CTA 和全站 Footer。

**怎么做**：
1. 收尾区域：`准备好了吗？` + 三个按钮：Open App / Start Building / Book a Demo
2. Footer：Logo | Privacy | Cookies | GitHub | Contact
3. Footer 全站复用（官网区所有页面）

**交付物**：
- 收尾 CTA 区域组件
- `components/marketing/footer.tsx`

**验收条件**：
- [ ] Footer 中链接均可点击且目标正确
- [ ] 收尾 CTA 中**不包含** Join Waitlist

### T-3.8 完整路线图页面 `/roadmap` `[官网]`

**前置依赖**：T-3.5（复用数据结构和时间线组件）

**做什么**：创建 `/roadmap` 完整路线图页面。

**怎么做**：
1. 顶部：标题 + 副标题
2. 交互式水平时间线（从 T-3.5 提取为共享组件，此处为增强版）
3. 点击 Phase 展开完整里程碑列表和子交付项
4. 底部：七大里程碑卡片网格，每个可展开查看详情
5. 状态标签体系：Now（绿●）/ In Progress（蓝🔄）/ Coming Soon（橙📅）/ Planned（灰○）/ Research（紫💡）
6. 内容完整覆盖 Phase 0 到 Phase 4+ 全部里程碑

**交付物**：
- `app/[locale]/(marketing)/roadmap/page.tsx`
- 路线图完整数据（三语）

**验收条件**：
- [ ] Phase 0-4+ 全部内容展示
- [ ] 每个 Phase 可展开/折叠
- [ ] 七大里程碑均有独立卡片
- [ ] 三语完整

### T-3.9 开发者社区页面 `/developers` `[官网]`

**前置依赖**：T-2.2

**做什么**：重构 `/developers` 为统一的开发者入口。

**怎么做**：
1. 主页面 `/developers`：概览 + 快速导航
2. 子页面结构：
   - `/developers/quickstart`：快速开始指南（5 分钟接入 Agent）
   - `/developers/sdk`：SDK & API Reference（TypeScript / Python / REST）
   - `/developers/protocol`：A2A 协议文档
3. 快速开始指南需包含：Provider 接入流程的简明版本（与产品区 Provider Onboarding 内容对齐）
4. 此页面是吸引 Provider 注册的关键入口

**交付物**：
- `app/[locale]/(marketing)/developers/page.tsx`
- `app/[locale]/(marketing)/developers/quickstart/page.tsx`
- `app/[locale]/(marketing)/developers/sdk/page.tsx`
- `app/[locale]/(marketing)/developers/protocol/page.tsx`

**验收条件**：
- [ ] 从官网导航点击 Developers 进入正确页面
- [ ] Quick Start 指南内容完整可读
- [ ] SDK / API Reference 至少有占位结构（后续内容可迭代）
- [ ] 不存在独立的 `/docs` 页面

### T-3.10 用例展示页面 `/use-cases` `[官网]`

**前置依赖**：T-2.2

**做什么**：创建用例展示页。

**怎么做**：
1. `/use-cases` 主页：用例卡片列表
2. `/use-cases/enterprise-governance`：企业治理用例——从当前 trust-flow 页面内容迁移并增强
3. 每个用例页面包含：场景描述、工作流图示、平台如何解决、CTA

**交付物**：
- `app/[locale]/(marketing)/use-cases/page.tsx`
- `app/[locale]/(marketing)/use-cases/enterprise-governance/page.tsx`

**验收条件**：
- [ ] 企业治理用例内容实质性，非占位
- [ ] 当前 `/trust-flow` 的有效内容已迁移

### T-3.11 其他官网页面 `[官网]`

**前置依赖**：T-2.2

**做什么**：创建剩余的官网页面。

| 页面 | 优先级 | 说明 |
|------|--------|------|
| `/pricing` | 中 | 免费额度 + Pro/Team/Enterprise 定价页。定价模型未最终确定时可用"Contact Us"占位 |
| `/about` | 中 | 团队 / 愿景 / 联系方式 |
| `/demo` | 低 | 极简 Book a Demo 表单。嵌入 Typeform 或 Tally 即可，不需要自建表单 |
| `/node-collaboration` | 低 | Coming Soon 占位页。展示节点协作愿景 + 一段文字 + 可选邮箱订阅 |

**验收条件**：
- [ ] `/pricing` 页面存在且可访问（内容可为初版）
- [ ] `/about` 页面存在且可访问
- [ ] `/demo` 页面存在且表单可提交
- [ ] `/node-collaboration` 页面展示"Coming Soon"状态
- [ ] 不存在 `/waitlist` 页面
- [ ] 不存在独立的 `/trust-flow` 页面

---

## 4. 产品区页面开发

> 产品区的 UI 开发依赖 T-2.3（产品区 Shell）完成。  
> 产品区与真实后端 API 的对接依赖第 5 节主线团队的 API 交付，在 API 就绪前使用 Mock 数据开发。

### T-4.1 Agent 目录浏览视图 `[官网]`

**前置依赖**：T-2.3

**做什么**：实现产品区 Agent 目录浏览界面。此页面**未登录也可访问**。

**怎么做**：
1. 在侧边栏"🤖 Agent 目录"入口点击后，主区域切换为目录视图
2. 目录视图：搜索框 + 分类筛选 + Agent 卡片网格
3. 每张 Agent 卡片展示：名称、能力摘要、信誉评分、验证状态 Badge
4. 点击卡片 → 右侧面板展示 Agent 详情（身份验证状态、能力声明、信誉评分、历史成功率、风险等级）
5. 在 API 就绪前使用 Mock 数据

**交付物**：
- `components/product/agent-directory.tsx`
- `components/product/agent-card.tsx`
- Agent 详情面板组件
- Mock 数据文件

**验收条件**：
- [ ] 未登录用户可浏览目录
- [ ] 搜索和筛选功能正常
- [ ] Agent 卡片信息完整
- [ ] 点击卡片后右侧面板显示详情

### T-4.2 聊天窗口核心组件 `[协同]`

**前置依赖**：T-2.3; 主线团队 T-5.1（会话 API）就绪后对接真实数据

**做什么**：实现产品区核心聊天窗口。

**怎么做**：
1. 消息流组件：支持用户消息、Agent 回复、系统消息三种类型
2. 输入框：文本输入 + 附件按钮（占位）+ 发送按钮
3. Agent 回复支持流式输出（Server-Sent Events / WebSocket）
4. 消息中可内嵌：风险确认卡片、审批卡片、收据查看入口
5. 消息 Bubble 上显示 Agent 身份标识和验证状态
6. **写操作触发登录**：用户点击输入框或发送按钮时，若未登录，弹出登录/注册 Modal
7. API 就绪前使用 Mock 对话数据

**交付物**：
- `components/product/chat/message-list.tsx`
- `components/product/chat/message-bubble.tsx`
- `components/product/chat/input-bar.tsx`
- `components/product/chat/risk-confirmation-card.tsx`
- `components/product/chat/receipt-link.tsx`

**验收条件**：
- [ ] 消息列表正确渲染用户和 Agent 消息
- [ ] 流式输出效果自然（逐字/逐句显示）
- [ ] 风险确认卡片嵌入在对话流中，确认/拒绝按钮可操作
- [ ] 未登录用户尝试发送消息时触发登录弹窗
- [ ] 登录完成后无缝回到聊天界面，不丢失输入内容

**环境与回归（T-5.3 对接后）**：
- **环境**：网站需配置 `JWT_SECRET`（与 mainline 一致），用于校验 access_token 并解析 `sub`（userId）；`getMainlineApiUrl()` 已用于所有 mainline 请求。
- **回归**：`pnpm run typecheck` 在 `packages/website` 已通过。

**联调说明（未登录 → 登录页 → 回当前 conversation）**：
1. 未登录用户在 `/app/chat` 点击输入框或发送 → 触发 `LoginModal`（邮箱+密码）。
2. 弹窗内可当场登录（`POST /api/auth/login` → 写 cookie → `refresh()` → 关闭弹窗、保留当前 conversation 与输入）；或点击「Go to sign in」跳转 `/[locale]/app/login?return_url=<当前 pathname>`。
3. 登录页提交成功 → `router.replace(return_url)` 回到原页（如 `/en/app/chat`）；Identity 已通过 `GET /api/auth/me` 更新，聊天窗口可正常发送。

### T-4.3 会话列表与新建对话 `[官网]`

**前置依赖**：T-2.3

**做什么**：实现侧边栏上半区——会话列表。

**怎么做**：
1. 新建对话按钮（顶部）
2. 最近对话列表（按时间倒排）
3. 每条对话显示：标题/摘要、参与的 Agent(s) 头像、最后活跃时间、未读指示
4. 点击对话切换主区域为对应聊天窗口
5. 新建对话时可选择 Agent 或直接开始（由平台路由）

**交付物**：
- `components/product/sidebar/conversation-list.tsx`
- `components/product/sidebar/conversation-item.tsx`
- `components/product/sidebar/new-conversation.tsx`

**验收条件**：
- [ ] 对话列表正确渲染
- [ ] 点击对话切换主区域内容
- [ ] 新建对话流程可走通

### T-4.4 右侧上下文面板 `[官网]`

**前置依赖**：T-2.3

**做什么**：实现右侧动态上下文面板。

**怎么做**：
1. 面板根据当前焦点对象动态切换内容：
   - 对话视图：参与者列表、会话拓扑、授权范围
   - Agent 视图：Agent 详情、身份验证状态、能力声明、信誉评分、历史成功率、风险等级、费用估算
   - 审批视图：审批详情、触发原因、调用链摘要
   - 收据视图：收据详情、签名验证、关联审计事件
2. 面板可折叠（移动端默认收起）

**交付物**：
- `components/product/context-panel/conversation-context.tsx`
- `components/product/context-panel/agent-context.tsx`
- `components/product/context-panel/approval-context.tsx`
- `components/product/context-panel/receipt-context.tsx`

**验收条件**：
- [ ] 点击不同对象时面板内容正确切换
- [ ] 折叠/展开动画流畅
- [ ] 移动端默认收起，可手动展开

### T-4.5 侧边栏功能入口面板 `[官网]`

**前置依赖**：T-2.3, T-4.1

**做什么**：实现侧边栏下半区功能入口及对应的主区域视图。

**怎么做**：
1. 侧边栏功能入口：
   - 📋 任务中心 → 主区域切换为任务列表视图
   - 🤖 Agent 目录 → 主区域切换为目录浏览视图（T-4.1）
   - ✅ 审批队列 → 主区域切换为审批列表视图
   - 📊 历史记录 → 主区域切换为历史列表 + 回放视图
   - 🔗 连接器 → 主区域切换为连接器管理视图
   - ⚙️ 设置 → 主区域切换为设置面板
2. 初版各面板可使用占位 UI + Mock 数据，结构到位即可

**交付物**：
- 各功能面板的骨架组件
- 侧边栏路由切换逻辑

**验收条件**：
- [ ] 点击每个功能入口，主区域正确切换
- [ ] 各面板有基本的 UI 结构（可为骨架屏/占位）
- [ ] 从功能面板可返回聊天视图

### T-4.6 登录 / 注册页面 `[协同]`

**前置依赖**：T-2.3; 主线团队 T-5.3（认证 API）

**做什么**：实现 `/app/login` 登录与注册页面。

**怎么做**：
1. 支持两种登录方式：邮箱 + 密码 / OAuth（GitHub / Google）
2. 新用户注册流程：邮箱注册 → 验证 → 选择角色（Provider / Consumer）→ 进入对应 Onboarding
3. 触发式登录：产品区写操作触发时弹出 Modal，登录后回到原页面原位置
4. 对接主线团队提供的认证 API

**交付物**：
- `app/[locale]/(product)/app/login/page.tsx`
- `components/product/auth/login-modal.tsx`（触发式登录弹窗）
- Auth 状态管理（Context / Zustand）

**验收条件**：
- [ ] 邮箱登录/注册可走通
- [ ] OAuth 登录可走通
- [ ] 新用户注册后进入角色选择页
- [ ] 触发式登录完成后无缝回到原页面

**OAuth 端到端（官网与主线联调）**：当前 mainline 的 OAuth callback **仅返回 JSON**。若要让 GitHub / Google 登录在**官网产品区**完全走通，主线需在 OAuth 成功后 **302 重定向** 到官网的 `/{locale}/app/auth/callback`，并在 URL **fragment（hash）** 中带上 `access_token`、`refresh_token` 与 `return_url`，例如：

`/{locale}/app/auth/callback#access_token=...&refresh_token=...&return_url=...`

官网侧已实现：该落地页读取 fragment → 调用 `POST /api/auth/set-tokens` 写入 cookie → `router.replace(return_url)`。亦可由官网与主线约定**其它等价方式**（例如经 BFF 一步写 cookie 后再 302），但须在接口合约中写死，避免各环境行为不一致。

### T-4.7 Consumer Onboarding 流程 `[官网]`

**前置依赖**：T-4.6, T-4.1, T-4.2

**做什么**：实现 Consumer 新用户引导流程。

**怎么做**：
1. 欢迎页：一张图说清"在这里你可以让 Agent 帮你完成任务"
2. 引导浏览 Agent 目录：高亮推荐的 Agent
3. 引导发起第一次对话：选一个推荐 Agent，预置建议话术
4. 体验首次结果：平台路由到 Agent，返回结果 + 收据
5. 完成引导，进入主界面

**交付物**：
- `app/[locale]/(product)/app/onboarding/consumer/page.tsx`
- Onboarding 步骤组件

**验收条件**：
- [ ] 完整流程可走通（Mock 数据即可）
- [ ] 3 分钟内可完成全部引导步骤
- [ ] 引导完成后正确进入主界面

### T-4.8 Provider Onboarding 流程 `[协同]`

**前置依赖**：T-4.6; 主线团队 T-5.4（Agent 接入 API）

**做什么**：实现 Provider 新用户引导流程。

**怎么做**：
1. 欢迎页：一张图说清"把你的 Agent 接入 GaiaLynk，让全网用户都能调用"
2. 填写 Agent 基本信息：名称、能力声明、A2A 端点地址
3. 连通性检查：平台自动向 Agent 发送健康检查请求，展示结果
4. 首次测试调用：Provider 自己作为用户调用刚接入的 Agent
5. 提交上架审核（或直接可用）
6. 完成引导，进入主界面（侧边栏出现 Provider 运维入口）

**交付物**：
- `app/[locale]/(product)/app/onboarding/provider/page.tsx`
- Agent 接入表单组件
- 连通性检查 UI 组件
- 测试调用 UI 组件

**验收条件**：
- [ ] Agent 信息填写表单验证正确
- [ ] 连通性检查结果正确展示（成功/失败/超时）
- [ ] 测试调用可走通
- [ ] 10 分钟内可完成全部引导步骤

---

## 5. 主线团队 API 交付

> 以下 API 是产品区 UI 对接的依赖项。主线团队需按优先级交付。  
> 每个 API 需提供：接口文档（OpenAPI / TypeScript 类型）、至少一个可调用的 Staging 端点、基础自动化测试。

### T-5.1 会话 API `[主线]`

**做什么**：提供会话系统的完整 API。

**接口清单**：
1. `POST /api/conversations` — 创建会话
2. `GET /api/conversations` — 会话列表（分页、排序）
3. `GET /api/conversations/:id` — 会话详情
4. `DELETE /api/conversations/:id` — 删除会话
5. `POST /api/conversations/:id/messages` — 发送消息
6. `GET /api/conversations/:id/messages` — 消息列表（分页）
7. 消息流式推送（SSE 或 WebSocket）

**验收条件**：
- [ ] 所有接口有 OpenAPI 文档或 TypeScript 类型定义
- [ ] Staging 环境可调用
- [ ] 消息流式推送延迟 < 200ms
- [ ] 单元测试覆盖核心路径

### T-5.2 Agent 目录 API `[主线]`

**做什么**：提供 Agent 目录的查询 API。

**接口清单**：
1. `GET /api/agents` — Agent 列表（分页、搜索、分类筛选）
2. `GET /api/agents/:id` — Agent 详情（身份、能力声明、信誉评分、成功率、风险等级）
3. `GET /api/agents/:id/stats` — Agent 统计信息

**验收条件**：
- [ ] 搜索支持关键词模糊匹配
- [ ] Agent 详情包含身份验证状态、信誉评分
- [ ] **未登录用户可调用**（目录浏览不需要认证）

### T-5.3 用户认证 API `[主线]`

**做什么**：提供用户注册、登录、Token 管理 API。

**接口清单**：
1. `POST /api/auth/register` — 邮箱注册
2. `POST /api/auth/login` — 邮箱登录
3. `GET /api/auth/oauth/:provider` — OAuth 发起（GitHub / Google）
4. `GET /api/auth/oauth/:provider/callback` — OAuth 回调（**浏览器场景**：完成换票后须能重定向至官网落地页并交付 token，见下方「OAuth 浏览器落地」与 **T-4.6**「OAuth 端到端」）
5. `POST /api/auth/refresh` — Token 刷新
6. `GET /api/auth/me` — 当前用户信息（含角色：Provider / Consumer）
7. `PUT /api/auth/me/role` — 设置/切换用户角色

**验收条件**：
- [ ] 邮箱注册 + 登录链路可走通
- [ ] OAuth（GitHub）链路可走通
- [ ] Token 刷新机制正常
- [ ] 用户角色（Provider / Consumer）正确存储和返回

**上线前需配置**：`JWT_SECRET`（至少 16 字符，用于签发/校验 access_token）；若启用 GitHub/Google 登录，需配置 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET` 或 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`，以及 `OAUTH_REDIRECT_BASE`（回调基础 URL）。详见 `packages/server/docs/api-auth.md`。

**OAuth 浏览器落地（与 T-4.6 对齐）**：若产品区需要「用户点击 OAuth → 回到官网已登录」，主线在完成 OAuth 后不能只向浏览器返回 JSON，而应重定向至官网 `/{locale}/app/auth/callback#access_token=...&refresh_token=...&return_url=...`（或双方书面约定的等价方案）。仅 JSON 响应适用于纯 API / 非浏览器客户端。

### T-5.4 Agent 接入 API `[主线]`

**做什么**：提供 Provider 接入 Agent 的 API。

**接口清单**：
1. `POST /api/agents/register` — 注册新 Agent（名称、能力声明、A2A 端点）
2. `POST /api/agents/:id/health-check` — 触发连通性检查
3. `GET /api/agents/:id/health-check/result` — 获取检查结果
4. `POST /api/agents/:id/test-call` — 触发测试调用
5. `POST /api/agents/:id/submit-review` — 提交上架审核
6. `GET /api/agents/mine` — 获取当前 Provider 的 Agent 列表

**验收条件**：
- [ ] Agent 注册后可通过目录 API 查询到（审核通过后）
- [ ] 健康检查能正确检测 Agent 端点可达性
- [ ] 测试调用可走通完整的 A2A 调用链路
- [ ] 需认证（仅 Provider 角色可调用）

**注意事项（迁移）**：T-5.4 依赖数据库迁移 `0015_agent_provider_ownership.sql`（`agents.owner_id` 与 `health_check_*` 列）。迁移**仅在配置了 `DATABASE_URL` 且 Postgres 可达时**会真正执行：未设置 `DATABASE_URL` 时 `npm run db:migrate` 会直接报错退出；设置了但本机/目标环境未启动 Postgres 或 Docker 未运行时，迁移同样不会成功。上线或联调前请确认：1）Postgres 已就绪（本地可先执行 `./scripts/bootstrap-pg-local.sh` 启动 Docker Postgres 并跑完迁移），2）在该环境下执行过 `npm run db:migrate` 以应用 0015 及此前所有迁移。

### T-5.5 风险确认 API `[主线]`

**做什么**：提供风险确认/审批操作的 API。

**接口清单**：
1. `GET /api/approvals` — 待审批列表
2. `GET /api/approvals/:id` — 审批详情
3. `POST /api/approvals/:id/confirm` — 确认
4. `POST /api/approvals/:id/reject` — 拒绝
5. `GET /api/approvals/:id/chain` — 调用链摘要

**验收条件**：
- [ ] 确认/拒绝后对应的 Agent 操作正确继续/取消
- [ ] 调用链摘要包含完整的决策路径

### T-5.6 审计与收据 API `[主线]`

**做什么**：提供审计日志和收据查询 API。

**接口清单**：
1. `GET /api/receipts/:id` — 收据详情
2. `GET /api/receipts/:id/verify` — 收据签名验证
3. `GET /api/audit/timeline` — 审计时间线（按对话 / 按 Agent / 按时间）
4. `GET /api/audit/events/:id` — 审计事件详情

**验收条件**：
- [ ] 收据包含签名、可独立验证
- [ ] 审计时间线按时间排序、支持过滤

---

## 6. 视觉与体验优化

> 在功能骨架完成后执行。

### T-6.1 品牌动效开发 `[官网]`

**前置依赖**：T-3.1（Hero 区域）

**做什么**：为关键区域添加品牌动效。

**清单**：
1. Hero 背景动效（节点连接线 / 网格呼吸动画）
2. 价值主张卡片入场 stagger 动画
3. How It Works 流程 scroll-triggered reveal
4. 路线图时间线交互动画
5. 聊天消息入场动画
6. 侧边栏切换过渡动效

**技术约束**：
- 使用 CSS animation / Framer Motion / lightweight canvas
- **禁止**引入 Three.js、GSAP 等重型库
- 所有动效支持 `prefers-reduced-motion` 系统设置

**验收条件**：
- [ ] 动效在 60fps 下运行流畅
- [ ] 低端设备不卡顿
- [ ] 尊重系统减弱动效设置

**执行与验证说明**：
- 全量 `npm test` / `test:governance` 里 **api-health-gate** 会因本机未起 mainline 而失败（与 T-6.1 改动无关）；需要时可设 `RELEASE_GATE_SKIP_API_HEALTH=1` 或启动对应服务后再跑。

**约束对齐说明**（T-6.1 落地后须持续遵守）：
- **组件级入场 / stagger / scroll-triggered / 布局宽度 / 抽屉滑入 / 折叠高度**：仅用 Framer Motion。
- **hover 边框/阴影、颜色、chevron 旋转、链接 transition-colors**：仅用 Tailwind，不再叠加 Framer Motion。
- **同一元素**不得同时用「CSS transition 做位移/透明度入场」与 Framer Motion——已拆掉原 `translate-y` + `opacity` + `transition-all` 那类写法，避免双套实现。

### T-6.2 特性展示区域（alma.now 风格）`[官网]`

**前置依赖**：T-3.2（产品界面 Mockup 已就位）

**做什么**：在首页或单独区域以 alma.now 风格展示产品核心特性。

**五个特性区块**：

| 区块 | 标题 | 截图/Mockup 内容 |
|------|------|-----------------|
| 智能对话 | Beautiful Chat Interface | IM 聊天窗口截图 |
| Agent 准入 | Verified Agents, Trust as Policy | Agent 信誉面板 + 风险卡片截图 |
| Agent 市场 | Agent Marketplace | Agent 目录截图 |
| 自动化任务 | Recurring Automation | 订阅任务管理截图 |
| 执行链路 | Evidence by Default | 审计时间线截图 |

每个区块：卡片 + 浮窗式截图 + 短标题 + 一段描述

**验收条件**：
- [ ] 每个区块有真实截图/高保真 Mockup
- [ ] 卡片展示方式参考 alma.now（不是纯文字列表）

**演进说明**：后续若替换为真实截图，只需在区块中改为使用 Next.js `<Image>`（`next/image`）或静态资源路径即可。

### T-6.3 移动端适配 `[官网]`

**前置依赖**：T-3 全部, T-4 全部

**做什么**：全站响应式适配。

**官网区**：
- Hero 区域简化（背景动效减弱/关闭、H1 字号调小）
- 导航折叠为汉堡菜单，Open App 按钮始终可见
- 价值主张卡片改为竖排
- 路线图时间线改为竖排或滑动式

**产品区**：
- 侧边栏变为底部 Tab 或抽屉式
- 聊天窗口全屏
- 右侧面板默认收起，点击后以抽屉/半屏展开
- 输入框固定底部

**验收条件**：
- [ ] 375px 宽度下所有页面可正常浏览
- [ ] 产品区核心链路可走通：浏览目录 → 发起对话 → 查看结果
- [ ] 无横向滚动条

**落地说明**（实现参考）：
- **官网**：`MarketingLayout` 增加 `overflow-x-hidden`；主内容 `px-4 sm:px-6`；Hero 在窄屏使用较小标题阶梯（`text-h1` → `md:text-hero`）、副标题 `text-body` → `sm:text-body-lg`，`hero-background.module.css` 在 `max-width: 767px` 关闭网格/光晕/线条的持续动画以简化动效；首页与 `/roadmap` 路线图时间线在 `md` 以下竖排、以上保持横向滚动；`MarketingNavbar` 的 Open App 使用 `shrink-0` 与较小字号避免挤压。
- **产品区**：`ProductShell` 根节点 `overflow-x-hidden`；`ProductViewTransition` 对 **`/app/chat/:conversationId`** 使用 `overflow-hidden` 由 `MessageList` 内滚动，其余路由 `overflow-y-auto`；`ChatWindow` / 会话页根节点 `flex-1 min-h-0`；`InputBar` 使用 `env(safe-area-inset-bottom)`；`lg` 以下保留左侧抽屉，并增加 **底部快捷栏**（Chat / Agents / More 打开抽屉）以支撑「目录 → 对话」路径；`PanelLayout` 内可滚动；`ContextPanel` 在移动端保持 overlay 抽屉；顶栏「回官网」在 `sm` 以下隐藏以省宽。

### T-6.4 性能优化 `[官网]`

**前置依赖**：T-3 全部

**做什么**：确保 Core Web Vitals 达标。

**清单**：
1. 所有官网页面使用 SSR / SSG
2. 图片使用 Next.js `<Image>` 组件 + WebP 格式
3. 字体使用 `next/font` 加载，避免 FOUT/FOIT
4. Hero 动效延迟加载（不阻塞 LCP）
5. 第三方脚本（分析等）使用 `next/script` 策略加载

**验收条件**：
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Lighthouse Performance 分数 ≥ 90

**验收说明**（如何验证、与工程门禁的关系）：
- **Core Web Vitals / Lighthouse**：须在**生产环境或等价生产配置**的正式域名（或固定 Preview URL）上实测——用 Chrome Lighthouse、Search Console / CrUX（若有数据）、或 Web Vitals 扩展；本地 `next dev` 的数值**不能**作为最终验收依据。
- **构建与静态预渲染**：在 `packages/website` 执行 `npm run build`，应成功完成；营销路由依赖 `[locale]` 的 `generateStaticParams` 与根 `layout` 不调用 `headers()`，构建输出中对应页面为 SSG（`●`）而非整站被迫动态渲染。
- **治理测试**：`npm run test:governance` 中的 `api-health-gate` 依赖本机 Mainline（如 `localhost:3000`）可达；未起服务时会失败，与前端性能改动无关，本地可设 `RELEASE_GATE_SKIP_API_HEALTH=1` 跳过该条。
- **可选增强**：若需在 CI 中固化性能回归，可增加 Lighthouse CI 或对 LCP/CLS/Performance 分数设阈值门禁（绑定 Staging/Preview URL）。

### T-6.5 国际化完善 `[官网]`

**前置依赖**：T-3 全部

**做什么**：确保三语（EN / 繁中 / 简中）内容完整且品质对等。

**清单**：
1. Hero 区域核心文案三语等质量
2. 路线图所有内容三语覆盖
3. Use Cases 三语覆盖
4. 产品区 UI 文案三语覆盖
5. Onboarding 流程三语覆盖

**验收条件**：
- [ ] 切换语言后无缺失文案（不出现 key 原文或空白）
- [ ] 中文排版不因翻译导致布局错位

**落地说明**（T-6.5 实现索引）：
- **Hero / 首页**：`dictionaries.ts` 中 `home.hero`（含 eyebrow 三语）、`home.previewSectionTitle`；状态徽记见 `content/i18n/vision-status.ts` + `StatusBadge` 的 `locale`。
- **路线图**：`roadmap-full.ts` / `roadmap-preview.ts` 已三语；`/roadmap` 的 `generateMetadata.description` 使用 `getRoadmapFull(locale).subtitle`。
- **Use Cases**：列表与详情 `CASE_COPY` / `COPY_BY_LOCALE` 已三语；徽记同上。
- **产品壳层**：`content/i18n/product-experience.ts`（`getProductUiCopy`）驱动 `ProductShell`、`StatusBar`、侧栏 `Chat` 标签、移动端「更多」等；登录/注册/角色页用 `getAuthFormsCopy`。
- **Cookie**：`CookieBanner` 按 pathname 首段解析 `locale` 后取 `getCookieCopy`。
- **Onboarding**：`content/onboarding/consumer-onboarding-copy.ts`、`provider-onboarding-copy.ts`；Consumer Mock 收据正文随 `buildMockReceipt(..., locale)` 切换。

---

## 7. 分析与追踪

### T-7.1 事件追踪体系 `[官网]`

**前置依赖**：T-3 全部, T-4.6

**做什么**：搭建 CTA 事件追踪和转化漏斗。

**清单**：
1. 统一 CTA 事件模型（所有按钮/链接点击）
2. 首屏滚动深度追踪
3. Consumer 漏斗：Open App 点击 → 浏览 Agent 目录 → 触发登录 → 首次对话 → 首次结果
4. Provider 漏斗：Start Building 点击 → 阅读接入文档 → 触发登录 → 填写 Agent 信息 → 首次测试调用成功

**交付物**：
- 事件定义文档
- 埋点实现
- 漏斗看板（可使用现有分析工具）

**验收条件**：
- [ ] 所有 CTA 点击有事件上报
- [ ] Consumer 和 Provider 两条漏斗可在分析工具中查看

---

## 8. 跨团队依赖矩阵

```
官网团队任务              依赖的主线团队 API          可用 Mock 先行开发
─────────────────────────────────────────────────────────────────
T-4.1 Agent 目录视图      T-5.2 Agent 目录 API        ✓ 可 Mock
T-4.2 聊天窗口             T-5.1 会话 API              ✓ 可 Mock
T-4.3 会话列表             T-5.1 会话 API              ✓ 可 Mock
T-4.4 右侧面板             T-5.2 + T-5.5 + T-5.6      ✓ 可 Mock
T-4.6 登录/注册            T-5.3 认证 API              ✗ 需真实 API
T-4.7 Consumer Onboarding  T-5.1 + T-5.2               ✓ 可 Mock
T-4.8 Provider Onboarding  T-5.4 Agent 接入 API        ✗ 需真实 API
```

**执行策略**：
- 官网团队用 Mock 数据先行开发 T-4.1 ~ T-4.5 和 T-4.7
- 主线团队优先交付 T-5.3（认证 API），解锁 T-4.6
- 主线团队随后交付 T-5.1 和 T-5.2，官网团队从 Mock 切换到真实 API
- 主线团队交付 T-5.4 后，官网团队完成 T-4.8
- T-5.5 和 T-5.6 最后交付，补全风险确认和审计功能

---

## 9. 总验收清单

完成以下全部验收项后，本轮优化视为完成。

### 9.1 官网区

- [ ] 双 Layout 架构正确分离
- [ ] 官网导航：Roadmap / Use Cases / Developers / Pricing + Open App
- [ ] 首屏 Hero 视觉品质达到参考站（chekusu.com / alma.now）水准
- [ ] 首页六屏内容完整：Hero → 产品预览 → 价值主张 → How It Works → 路线图 → 开发者 → CTA
- [ ] `/roadmap` 完整交互式时间线上线
- [ ] `/developers` 统一承载文档/SDK/快速开始
- [ ] `/use-cases/enterprise-governance` 内容迁移完成
- [ ] `/node-collaboration` 展示 Coming Soon
- [ ] `/demo` 极简表单可用
- [ ] 不存在 `/docs`、`/waitlist`、`/trust-flow` 独立页面
- [ ] Core Web Vitals 全绿
- [ ] 三语完整

### 9.2 产品区

- [ ] 产品区呈现三栏 IM 布局
- [ ] 未登录用户可浏览 Agent 目录
- [ ] 写操作触发登录，登录后无缝返回
- [ ] Consumer Onboarding：3 分钟内完成首次对话
- [ ] Provider Onboarding：10 分钟内完成 Agent 接入 + 测试调用
- [ ] 风险确认卡片在对话流中正常工作
- [ ] 侧边栏所有功能入口可切换
- [ ] 右侧面板根据焦点动态切换
- [ ] 移动端核心流程可用

### 9.3 品牌

- [ ] 统一色彩系统和字体系统全站应用
- [ ] 品牌动效上线（Hero 背景、卡片入场、交互微动效）
- [ ] 三语体验一致

### 9.4 API

- [ ] 会话 API、Agent 目录 API、认证 API、Agent 接入 API、风险确认 API、审计收据 API 全部上线
- [ ] 所有 API 有文档和类型定义
- [ ] Agent 目录 API 支持未认证访问

---

*文档版本：v1（2026-03-18）*  
*签发：CTO（联合创始人/技术最高负责人）*  
*状态：即刻生效*
