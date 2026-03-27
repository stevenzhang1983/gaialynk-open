# GaiaLynk 官网文案优化稿（结构不变 · 逐页）

> **版本**：v1.2.14  
> **范围**：在**现有官网信息架构与路由不变**的前提下，对每一页（及对应文案数据源）做全盘文案与 SEO 优化。  
> **与工程实施的分工（重要）**：本稿定位是 **官网文案与信息架构的规格参考**（表格、语气、数据源路径、修订记录）。若任务只说「优化文案」「更新本稿」而**未约定**同步改代码，建议**先更新本文档**；需要写入 `packages/website` 时，由负责人**另行约定**后，对照各节「数据源」与 **§N** 落地即可。  
> **原则摘要**：官网仅保留 **「打开应用」** 作为进入主应用的唯一主入口，**不设**与主应用同义的独立「对话」导航项；叙事以 **IM/会话形态的人与智能体协作** 为主线，**不以「Ask」作为品牌层主动词**；首屏不单独以「Agent 互联网」为唯一主命题，长期方向放在路线图/关于等层级。  
> **v1.1 增补**：对外营销必须突出 **消费者主价值：进入应用即可从智能体中心调用已上架智能体**，无需自学部署、自建 Agent；**自建/上架**定位为**供给方与开发者次级路径**，避免让路人误以为「用我们产品必须先会部署」。  
> **v1.1.5 增补**：**勿**对外写成「平台已对第三方 Agent 做内部代码审核」。V1.3 可信模型见规格 **§4**：**治理轨**（准入与上架契约、调用时策略、确认、收据/审计）+ **质量轨**（可复现评测包、上架分级与标签、线上声誉等），并 **诚实说明测了什么**；与 **§5.1.9** 上架前 **可选** 轻量探测等一致。  
> **v1.1.6 增补**：C.1 `eyebrow` 定稿为「Your work. Platform agents. One workspace.」三语对应；用词优化见 §C.1 语气说明。  
> **v1.1.7 增补**：在 Hero 定稿语气下通盘收紧全稿对外句：**已上架 + 平台目錄 + 同一工作區／工作区** 与 Hero 对齐；英文短句、主动语态、与 subtitle 同级的 **confirmation / reviewable history**；中文统一 **選用／選用已上架、徵求確認、可供查閱**；避免「已發布／已发布」与「已上架」在消费者路径混用；开发者区强调 **上架／目錄／與產品 UI 一致**，不暗示终端用户先部署。  
> **v1.1.8 增补**：用户可见层统一用 **智能体中心**（繁 **智能體中心**）、英文 **Agent Hub**，取代「平台目录 / platform directory」等说法；读感接近「应用商店里的能力入口」但较 *Agent Marketplace* 更中性。规格与工程中的 *directory / listing / catalog* 仍可作对内指称；落地 i18n 时请与产品内实际路由或模块名对齐。若营销需更强商业语感，可 A/B **智能体市场 / Agent Marketplace**。  
> **v1.1.9 增补**：澄清 **产品路线图 = 研发方向与交付状态的合并视图**：含 Phase／里程碑／状态标签（Now、In progress、Planned 等），**第六章前瞻性主题应对应或纳入同一路线图叙事**；对外句区分「故事页讲价值与情境」与「路线图载明阶段与何者已交付／进行中／规划中」，避免「仅以路线图核对已上线」被误读为路线图不含前瞻研发内容。  
> **v1.2.0 增补**：**全站用户可见句**须像**对外营销与产品说明**，**禁止**读起来像 PRD／会议纪要／内部备忘：避免在首屏与主段落堆叠**章节编号、状态机用词、研发合并视图**等；对内规格与写作指引可写在本文 **「数据源／须同步」备注**或 `docs/` 其他稿，**不与消费者段落混排**。场景故事页头与 `ROADMAP_CROSS` 已改为**短句 + 利益点 + 轻提示看路线图**。  
> **v1.2.1 增补**：场景故事 **CompanyA** 对外定调——**虚构公司是壳，各章对应不同公众工作尺度**；传达**产品规划面向所有人**；页头与 `JOURNEY_SECTION` 见 **§E.0–E.2**，去除「读开头几段就够」类表述。  
> **v1.2.2 增补**：§E.1 页头改为**正式对外营销语气**——陈述价值与覆盖范围，**避免**元叙事（「刻意／故意写成」）与**教读者怎么读**；细部意图仍归 **§E.0** 内部 brief。  
> **v1.2.3 增补**：官网**不再提供**预约 Demo 路由与入口；`/demo` **301 至**对应语系 `/help`；原 Demo 相关 CTA 改为**帮助中心**等；`dictionaries.demo` 与页脚重复「Contact」链已移除。  
> **v1.2.4 增补**：明确 **文档 vs 代码** 分工——「优化/标注」默认**先更新本稿**；工程落地请**另行约定**。  
> **v1.2.5 增补**：**§D 路线图**与 **§E 场景故事** 写入**逐条优化全文**（里程碑 1–7、分组 tagline、工程 Phase 摘要、CompanyA 六章 narrative／故事块／slug 页／重定向）；与 `roadmap-full.ts`、`use-cases-company-a-journey.ts` 对照落地。  
> **v1.2.6 增补**：通读全稿，将仍带**合同／纪要感**的句子（如「必交付」「内部追溯」「以…为准」的硬口吻、否定式禁令堆叠）改为**面向访客的说明语气**；路线图页眉、里程碑 6–7、对照表一句、场景故事与 slug 示例同步软化。  
> **v1.2.7 增补**：§D.3 `engineeringMappingRows` 前两行 **oneLiner**（EN／繁／简）改为访客向整句，去掉「市场化供给」「组织级工具跟上」等内部缩略语感；与 `roadmap-full.ts` 同步。  
> **v1.2.8 增补**：**官网 `/roadmap` 不再展示**「工程阶段 Phase 0–4+ + 子里程碑（M1-a…）」时间线区块；§D.5 从本稿移除，改以决策说明 + 落地指引；§D.1 `journeyIntroNote` 改为仅解释 **1–7** 与 **对照表 M 编号**之差异。  
> **v1.2.9 增补**：§D.4 里程碑 **1–4** 重写为**四层递进**公共叙事（起手可信闭环 → 节奏与连接器 → 开放供给与发现 → 多人协作与运行时治理）；与 `roadmap-full.ts` `milestoneCards` 同步。  
> **v1.2.10 增补**：里程碑 **1–3** 在保留递进逻辑下，改为**面向公众的正式书面语气**（§D.4.0 前三条与表内 EN／繁／简）；同步 `roadmap-full.ts`。  
> **v1.2.11 增补**：§E CompanyA 第 4 章 `narrative`——合作方智能体可处理之范围，由「公開規格、參考交期…」列舉改為**合作方已授權可對外揭露之資料**（三语）；本稿先行，工程對照落地另約。  
> **v1.2.12 增补**：同段 `narrative` 再软化——去掉「並非默示…」「not an open door…」等否定句，**只保留正面「以各合作方授權之對外揭露範圍為準」**（三语）。  
> **v1.2.13 增补**：§E CompanyA 第 4 章 `capabilities` ①——由誤導之「檢索取代私下約定」改為**合作方智能體於智能體中心列示、並與內部智能體共用同一邀請接入路徑**（三语）；落地 `use-cases-company-a-journey.ts` 另約。  
> **v1.2.14 增补**：**第六章**对外 `capabilities` 全量访客向重写——§E 去「教讀者怎麼讀」元叙事，改為**展望期價值與節奏提示**；§D.4 里程碑 6 能力列由工程術語改為**公眾可理解之利益表述**（三语）；工程同步另約。

---

## 0. 核心产品认知与对外营销策略（联合创始人共识）

### 0.1 我们解决的主痛点（消费者侧）

| 痛点 | 说明 |
|------|------|
| **部署门槛** | 对多数消费者而言，从零看教程、搭环境、部署并维护自己的 Agent **成本高、门槛高**，且常常 **不具备性价比**。 |
| **信任与选用** | 即便愿意尝试，用户仍需要知道「智能体由谁上架、在智能体中心里可见什么、调用时边界在哪里」；杂乱的自建托管体验会放大不安全感。 |

### 0.2 我们的核心设计（产品事实）

用户进入 GaiaLynk 后，**主路径**是：在 **IM 式对话**里，**从智能体中心选用已上架的智能体**并完成调用（**不是**先完成「个人部署一个 Agent」才能开始用）。**「可信」来自调用过程的治理与**智能体中心**所展示的公开信号（分级、评测说明、声誉等），不承诺对第三方部署代码做内部全面审核。**

### 0.3 用户可见称谓（与产品 UI 对齐）

| 简中 | 繁中 | EN | 备注 |
|------|------|-----|------|
| **智能体中心** | **智能體中心** | **Agent Hub** | 取代「平台目录 / directory」等说法；较 *智能体市场 / Agent Marketplace* 更中性，后者可作营销 A/B。 |
| （沿用） | （沿用） | （沿用） | 规格与代码中仍可用 *directory、listing、catalog* 作对内指称；路由与组件名 `AgentDirectory` 等不必强行改名。 |

### 0.4 对外营销策略（官网层）

| 层级 | 策略 |
|------|------|
| **首屏与主 CTA** | 强调 **打开应用、从智能体中心选用已上架智能体、同一工作区内完成**；一句内点出 **无需先行自建部署**；**避免**「代码已审核」类表述。 |
| **价值主张第二顺位** | **调用时治理**（确认、规则、收据）与 **智能体中心所展示的公开信号**（分级、评测与声誉等，与规格 §4 一致）；「敢用」依赖 **可预期流程与透明边界**，而非宣称审读过第三方源码。 |
| **开发者 / Quickstart** | 明确是 **供给方、上架与接入**，文案中可用 **「发布者」「构建者」**；不与消费者主路径抢第一叙事。 |
| **场景故事 CompanyA** | 第一章即体现 **「从智能体中心调用已上架能力」**，而非「每人先部署一个」。 |
| **避免** | 首页与主转化路径上，把 **「5 分钟接入 Agent」** 读成消费者义务；该表述 **仅属于开发者文档**。 |
| **语气（全站）** | **用户可见**文案：先写**谁能得到什么、怎么开始**，用完整、好读的句子；**少**用「第一章／第六章」「状态标签」「R&D 合并视图」「已交付／进行中」等**对内协同用语**（必要时缩成一句「详见路线图」）。**规格真值**（Phase、里程碑、与第六章对齐）写在**路线图页数据 + 内部文档**，不必复述在营销首屏。 |

> **对外营销策略**见上 **§0.4**；**用户可见称谓**见 **§0.3**。

---

## A. 结构约定（与现站一致）

| 区域 | 现状 | 文案原则 |
|------|------|----------|
| 官网顶栏 | Logo（回首页）+ 四链 + **打开应用** | 不设「对话」独立入口；进主应用 = 进产品内会话/工作台 |
| 页脚 | Help / Privacy / Cookies / GitHub | 不设单独「预约 Demo」链；联络意向走 **帮助中心** |

`dictionaries.nav` 中若仍有 `ask`、`trust`、`docs` 等键，**官网 Layout 未用于顶栏的键**可与产品壳另表对齐；**官网顶栏仅优化实际渲染项**（见 B 节）。

---

## B. 全局：`nav` + `footer` + `skipToContent`（三语）

### 顶栏（对应 `MarketingNavbar` 的 labels）

| 键 | EN | 繁中 | 简中 |
|----|-----|------|------|
| roadmap | Roadmap | 路線圖 | 路线图 |
| useCases | Stories | 場景故事 | 场景故事 |
| developers | Developers | 開發者 | 开发者 |
| pricing | Pricing | 定價 | 定价 |
| openApp | Open app | 打開應用 | 打开应用 |

### 页脚

| 键 | EN | 繁中 | 简中 |
|----|-----|------|------|
| help | Help | 說明中心 | 帮助中心 |
| privacy | Privacy | 隱私 | 隐私 |
| cookies | Cookies | Cookies | Cookies |
| github | GitHub | GitHub | GitHub |

### 无障碍

| 键 | EN | 繁中 | 简中 |
|----|-----|------|------|
| skipToContent | Skip to main content | 跳至主要內容 | 跳到主要内容 |

---

## C. 首页 `/[locale]`

**数据源**：`page.tsx` + `dictionaries.home` + `feature-showcase.ts` + `roadmap-preview.ts` + `developer-ecosystem.ts` + `i18n/product-mockup-copy.ts`

**叙事**：IM 形态的人与智能体协作；**消费者主价值：打开应用即可从智能体中心选用已上架智能体，无需自学部署**；信任叙事对齐 **治理轨 + 质量轨**（见文首 v1.1.5），**不**用「已审核（代码）」话术。主 CTA **打开应用**；次 CTA **开发者入口（供给方）**。全文避免以「Ask」为主动词。**全站对外句**与 **§C.1 Hero** 保持同一语气与名词表（见 v1.1.7、**v1.1.8 智能体中心／Agent Hub** 文首说明）。**用户可见段落**应读得像产品与品牌对外沟通，**避免**写成 PRD／备忘（详见 **§0.4 语气**、**v1.2.0** 文首）。

### C.1 Hero（`home.hero`）

**语气**：**title** 保持正式、可扫读。**subtitle（主方案）** 在「消费者能懂」与「品牌级克制」之间取平衡：参考 **Apple** 式短句、名词精准、少感叹与比喻；参考 **Google** 产品说明式 **主动语态、一步一事、不堆形容词**。不用「怎麼做、先确认」等过口语，改用 **徵求確認、可供查閱** 等书面语；英文避免 *super / amazing / revolutionize*。**eyebrow** 用三拍短句（你的工作 / 平台上的智能体 / 同一工作区），英文以 *Platform agents* 取代 *Their agents*，避免「他们指谁」歧义；中文 **平台上的智能体** 与 **智能体中心** 叙事一致（选用发生在中心内），**同一工作区** 比「同一处」更贴近产品语境（表内繁简列仍用各语种惯用写法）。

**读者分层（为何这样写）**：纯「技术正式版」副文案见下附录。**主方案**仍以白话义为主，但 **话术升级**：读起来像大厂首屏说明，而非聊天口吻。采购/安全读者可在第二屏、`/trust`、帮助中心用术语对照。

| 字段 | EN | 繁中 | 简中 |
|------|-----|------|------|
| eyebrow | Your work. Platform agents. One workspace. | 你的工作 · 平台上的智能體 · 同一工作區 | 你的工作 · 平台上的智能体 · 同一工作区 |
| title | Use agents published on the platform. No self-deployment required to start. | 選用平台上已上架的智能體，無需先行自建部署。 | 选用平台上已上架的智能体，无需先行自建部署。 |
| subtitle（主方案 · 消费者友好 + 正式话术） | Select agents in the Agent Hub. GaiaLynk helps you move work forward, requests confirmation before sensitive actions, and keeps a clear history you can review. Publishing for developers and publishers is available separately. | 請從智能體中心選用已上架的智能體。GaiaLynk 協助您推進工作，於敏感操作前徵求確認，並保留可供查閱的紀錄。智能體之上架與整合，請前往開發者與發布者入口。 | 请从智能体中心选用已上架的智能体。GaiaLynk 协助您推进工作，在敏感操作前征求确认，并保留可供查阅的记录。智能体的上架与整合，请前往开发者与发布者入口。 |
| ctaPrimary | Open app | 打開應用 | 打开应用 |
| ctaSecondary | Publishers & developers | 供給方與開發者 | 供给方与开发者 |

**附录：subtitle 正式版（可选，偏 B2B/技术读者；不建议作首屏唯一副文案）**

| 语种 | 正式版 subtitle（与 v1.1.2 一致，供 A/B 或深层页复用） |
|------|----------------------------------------------------------|
| EN | Select agents in the Agent Hub. GaiaLynk handles routing, runtime controls, confirmation on high-impact steps, and records you can review. Publishing and integration are for publishers and developers. |
| 繁中 | 於智能體中心選用已上架智能體；平台負責編排、運行時管控、高影響步驟之確認與可供查閱之紀錄。上架與接入面向發布者與開發者。 |
| 简中 | 于智能体中心选用已上架智能体；平台负责编排、运行时管控、高影响步骤的确认与可供查阅的记录。上架与接入面向发布者与开发者。 |

### C.2 SEO（`seoTitle` / `seoDescription`）

**说明**：`seoDescription` 宜与首屏 **subtitle 主方案** 同气质，便于搜索结果里也读得懂；技术词可放在标题或站点内页。

| 语种 | seoTitle | seoDescription |
|------|-----------|----------------|
| EN | GaiaLynk — platform agents, one workspace | Agents published on GaiaLynk, available in the Agent Hub. No self-deployment required to start. GaiaLynk requests confirmation before sensitive actions and keeps a clear history you can review. |
| 繁中 | GaiaLynk — 平台智能體 · 同一工作區 | 平台上已上架智能體，於智能體中心選用；無需自行部署即可開始。敏感操作前徵求確認，歷程清晰、可供查閱。 |
| 简中 | GaiaLynk — 平台智能体 · 同一工作区 | 平台上已上架智能体，于智能体中心选用；无需自行部署即可开始。敏感操作前征求确认，历程清晰、可供查阅。 |

### C.3 其余首页模块（与 Hero 同语气替换，不单列全文）

语气与 **§C.1 Hero** 一致：用户可见名词用 **platform / Agent Hub / listed or published on the platform / workspace**（对内规格仍可写 *directory / catalog*）；动词用 **select、move work forward、request confirmation、review**；中文用 **選用已上架、智能體中心／智能体中心、同一工作區／工作区、徵求確認、可供查閱**，不用口语「先确认一下」；**不**写「代码已审核」。全段避免以 **Ask** 作主语。

- **`valueProposition`**：**第一张卡**——**从智能体中心选用已上架智能体**，起步无需自建部署；可见 **分级与能力说明**（与产品标签一致），**不**承诺源码级审核。**第二张**——调用时规则与敏感操作前之确认。**第三张**——执行留痕、纪录可供查閱（括号内可点 **治理轨 + 质量轨：评测、声誉等**，对齐规格 §4）。
- **`howItWorks`**：五步中 **第二步写清「在智能体中心的已上架候选中选用」**；主语用 **你／平台／智能體**，不用 **Ask**。
- **`finalCta`**：heading 如 **先打开应用，从智能体中心选用一个智能体试跑**；`openApp` / `startBuilding` 与全站一致（**不含**预约 Demo）；`startBuilding` 与 **Publishers & developers（供给方与开发者）** 同档（见 C.1 `ctaSecondary`）。
- **`previewSectionTitle`**：如 **从智能体中心进入同一条对话**／**在同一工作區內看它如何發生**（与 eyebrow 的 *One workspace* 呼应）。
- **`evidenceTitle` / `evidenceDescription` / `evidencePoints`**：首句白话（做了什麼、為何如此、誰在何時確認）；术语与 **trust policy / 執行紀錄** 放次句。
- **`valuePoints`**：建议 EN *Agents from the Agent Hub · Rules at runtime · History you can review*；繁 *於智能體中心選用已上架智能體 · 執行當下邊界清晰 · 紀錄可供查閱*；简中同义。
- **`feature-showcase`**：`sectionTitle` 如 EN *What it feels like in the product*；**智能体中心模块首句**与 Hero **title** 同命题（**选用平台上已上架智能体，无需先行自建部署**）；其余块对应对话形态、管控、编排自动化、可查纪录。
- **`roadmap-preview`**：副标题强调 **对话内受治理的交付 → 更广连接**；**完整安排见路线图**；面向消费者的 deliverable 可点 **智能体中心供给、打开即用**。
- **`developer-ecosystem`**：如 EN *List agents for others to select in the Agent Hub*／繁 *上架智能體，供他人在智能體中心選用並於對話內調用*；副句 *Same contracts as the product UI*。语气是 **供给方入口**，勿读成「人人必先开发」。
- **`product-mockup-copy`**：示例偏真实业务；气泡或列表旁可标 **Listed / 已上架**（若 UI 有）；若需标示入口可加 **Agent Hub / 智能體中心**；收据类文案用 *Execution record*／**執行紀錄**。

---

## D. 路线图 `/[locale]/roadmap`

**数据源**：`content/roadmap-full.ts`（里程碑卡片与分组等与 CTO 主规格对齐；**状态枚举**对用户可见：`Now` / `In Progress` / `Coming Soon` / `Planned` / `Research`。）  
**信息架构**：本页为**访客向里程碑叙事**；**工程阶段 `phases`（Phase 0–4+ 与子里程碑）不在官网展示**——见 **§D.5**。

### D.1 页眉与阅读说明（用户首屏）

| 字段 | EN（优化稿） | 繁中（优化稿） | 简中（优化稿） |
|------|----------------|----------------|----------------|
| `title` | What we’re building—and in what order | 我們正在建造什麼，以及先後順序 | 我们正在建造什么，以及先后顺序 |
| `subtitle` | **GaiaLynk keeps governed collaboration in one workspace—in chat.** **You start from agents listed in the Agent Hub; no self-hosting required.** Badges show **what’s live and what we’re actively building**; **Research** highlights directions we’re shaping **over the long term**—**not** a promise that every item ships soon. | **GaiaLynk 把受治理的協作收斂在同一工作區、對話形態裡。** **從智能體中心選用已上架智能體即可起步，無須先行自建託管。** 徽章標示**已上線與進行中**；**研究中**是我們在**更長週期探索的方向**，**並不表示**近期就會逐项上線。 | **GaiaLynk 把受治理的协作收敛在同一工作区、对话形态里。** **从智能体中心选用已上架智能体即可起步，无须先行自建托管。** 徽章标示**已上线与进行中**；**研究中**是我们在**更长周期探索的方向**，**并不表示**近期就会逐项上线。 |
| `journeyIntroNote` | **Milestones 1–7** follow the **order we suggest reading**. The **foldable mapping table** lists **engineering labels** (e.g. **M1**, **M3**) per theme—**not** the same numbers as 1–7; handy if you read release notes. | 里程碑 **1–7** 為建議的**閱讀順序**。**可摺疊對照表**內，各主題旁之**工程標籤**（如 **M1**、**M3**）**與** 1–7 **並非同一套序號**，便於對照釋出說明。 | 里程碑 **1–7** 为建议的**阅读顺序**。**可折叠对照表**内，各主题旁的**工程标签**（如 **M1**、**M3**）**与** 1–7 **并非同一套序号**，便于对照发布说明。 |
| `milestonesHeading` | Product milestones (reading order) | 產品里程碑（建議閱讀順序） | 产品里程碑（建议阅读顺序） |
| `capabilityLabel` | What you get | 這一項帶來什麼 | 这一项带来什么 |
| `engineeringMappingTitle` | Capability themes ↔ engineering reference | 能力主題與工程編號對照 | 能力主题与工程编号对照 |
| `engineeringMappingSummary` | Expand mapping table | 展開對照表 | 展开对照表 |
| `mappingColJourney` | Capability theme | 能力主題 | 能力主题 |
| `mappingColMilestones` | Public № / engineering ref. | 對外編號／工程參考 | 对外编号／工程参考 |
| `mappingColOneLiner` | In one sentence | 一句話 | 一句话 |

### D.2 里程碑分组（`journeySections`）

| 组 | EN `title` | EN `tagline`（优化稿） |
|----|------------|-------------------------|
| 1 | Verified access, automation, and open supply | From **listed, verified agents** in the Agent Hub to **repeatable automation** and an **open supply** of agents—safe, attributable, ready to scale. |
| 2 | Collaboration, policy, and enterprise governance | **Many agents and people** in one conversation under **runtime rules**; **human confirmation** where it matters; **enterprise-grade** orchestration and compliance when you grow. |
| 3 | Network scale and physical integration (outlook) | **Federated networking** and **edge devices** extend collaboration into broader, real-world settings—part of our **long-term vision**, delivered **in stages**. **Timing and scope** show up on the **product roadmap** and **refresh with each release**. |

| 组 | 繁中 `title` | 繁中 `tagline`（优化稿） |
|----|----------------|---------------------------|
| 1 | 可信准入、自動化與開放供給 | 從**智能體中心內已列示、經驗證的智能體**，到**可重複的自動化**與**開放供給**——安全、可歸因、可擴展。 |
| 2 | 協作、策略與企業治理 | **多智能體與多人**在同一對話中，在**執行當下規則**下協作；**必要處由人確認**；成長後銜接**企業級**編排與合規。 |
| 3 | 網絡規模與物理整合（展望） | **聯邦式組網**與**邊緣設備**把協作延伸到更廣的實際場景——是我們**分段兌現的長期願景**。**何時上線、範圍到哪裡**，我們會在**產品路線圖**裡隨釋出更新。 |

| 组 | 简中 `title` | 简中 `tagline`（优化稿） |
|----|----------------|---------------------------|
| 1 | 可信准入、自动化与开放供给 | 从**智能体中心内已列示、经验证的智能体**，到**可重复的自动化**与**开放供给**——安全、可归因、可扩展。 |
| 2 | 协作、策略与企业治理 | **多智能体与多人**在同一会话中，在**执行当下规则**下协作；**必要处由人确认**；成长后衔接**企业级**编排与合规。 |
| 3 | 网络规模与物理整合（展望） | **联邦式组网**与**边缘设备**把协作延伸到更广的实际场景——是我们**分段兑现的长期愿景**。**何时上线、范围到哪里**，我们会在**产品路线图**里随发布更新。 |

### D.3 `engineeringMappingRows`（折叠表内三行）

| theme（EN） | milestones | oneLiner（EN） |
|-------------|------------|----------------|
| Verified Agents, automation, ecosystem supply | 1–3 (M1, M3, M4) | **Accountable runs**, **repeatable workflows**, and **listed agents you can pick**—with **receipts** that travel with results. |
| Collaboration, human approval, enterprise programs | 4–5 (M2, M6) | **People and agents** in one conversation—**runtime policy** holds the line; **humans own the consequential calls**; **tooling scales** as you grow. |
| Network federation, hardware edge (outlook) | 6–7 (M5, M7) | Broader networks and devices **take shape over time**—**dates and scope** show up on the **product roadmap** as plans mature. |

| theme（繁） | milestones | oneLiner（繁） |
|-------------|------------|----------------|
| 可信智能體、自動化、生態供給 | 1–3（M1、M3、M4） | 每次調用**留痕可核**；把可行路徑**固化成可重複流程**；智能體**在中心即可選用**，**收據**隨結果一併留下。 |
| 協作、人審、企業方案 | 4–5（M2、M6） | 多人與多智能體**同場協作**，**執行當下的策略守住邊界**；**關鍵一步由人確認**；團隊變大時，**管理與會話能力一併升級**。 |
| 網絡聯邦、硬體邊緣（展望） | 6–7（M5、M7） | 更廣的連結與終端會**逐步成形**；**時間點與範圍**隨規劃成熟更新在**產品路線圖**。 |

| theme（简） | milestones | oneLiner（简） |
|-------------|------------|----------------|
| 可信智能体、自动化、生态供给 | 1–3（M1、M3、M4） | 每次调用**留痕可核**；把可行路径**固化成可重复流程**；智能体**在中心即可选用**，**收据**随结果一并留下。 |
| 协作、人审、企业方案 | 4–5（M2、M6） | 多人与多智能体**同场协作**，**执行当下的策略守住边界**；**关键一步由人确认**；团队变大时，**管理与会话能力一并升级**。 |
| 网络联邦、硬件边缘（展望） | 6–7（M5、M7） | 更广的连接与终端会**逐步成形**；**时间点与范围**随规划成熟更新在**产品路线图**。 |

### D.4 里程碑卡片 1–7（`milestoneCards`，用户可见主文案）

#### D.4.0 里程碑 1–4：四层递进（联合创始人共识 · 公共叙事）

主线上，**会话与可信闭环、自动化与连接器、上架与发现、多智能体协作与运行时策略**等能力已按依赖关系**递进交付**；对外仍应读成**叠加上去的四步**，避免四张卡片像彼此无关的「功能平铺」：

1. **第一层 — 基础层**：确立**可归因、可验证的调用与收据**，作为对话式智能体协作的**能力基线**（会话、智能体中心、A2A 闭环、稽核）；后续里程碑均在此之上扩展。  
2. **第二层 — 可重复与系统集成**：在单次调用模式稳定后，通过**订阅任务、排程、连接器**实现**可重复运行**，并与既有工具及系统衔接。  
3. **第三层 — 供给与目录**：核心调用与自动化形成可依赖闭环后，开放**托管运行时、上架、可发现性与发布者工具**，支撑目录扩展，**不预设**每位参与者须先行完成自建部署。  
4. **第四层 — 协作与边界**：当参与者与智能体变多，**同一会话、同一时间线**里需要**运行时规则、人工确认、回退与信誉**——把多人多智能体的复杂度**收束在可治理的界面之内**。

**徽章**（`Now` / `In Progress` 等）仍以产品与发布真值为准；上表只约束**文案递进关系**，不替代状态机。

| № | 字段 | EN（优化稿） | 繁中（优化稿） | 简中（优化稿） |
|---|------|----------------|----------------|----------------|
| 1 | `name` | Trusted execution: foundational layer | 可信執行之基礎層 | 可信执行之基础层 |
| 1 | `description` | GaiaLynk **establishes** a baseline for **attributable, verifiable execution**: conversational workflows are fulfilled by **listed, verified agents** in the Agent Hub; untrusted agents are excluded, and each invocation yields an **auditable record with a verifiable receipt**. **Subsequent roadmap capabilities extend this foundation.** | GaiaLynk **建立**可歸因、可驗證之執行基線：於對話工作流中，需求由**智能體中心內已列示且經驗證的智能體**處理；不可信來源不予接入，每次調用產出**可稽核紀錄與可驗證收據**。**後續里程碑均於此基礎上延伸。** | GaiaLynk **建立**可归因、可验证的执行基线：在对话工作流中，需求由**智能体中心内已列示且经验证的智能体**处理；不可信来源不予接入，每次调用产出**可稽核记录与可验证收据**。**后续里程碑均在此基础上延伸。** |
| 1 | `capabilities`（数组，顺序保留） | Conversational messaging; Agent Hub listing and selection; A2A Gateway; Audit trail with verifiable receipts; Protocol documentation and SDK | 對話與訊息流；智能體中心列示與選用；A2A Gateway；稽核軌跡與可驗證收據；協議文檔與 SDK | 对话与消息流；智能体中心列示与选用；A2A Gateway；稽核轨迹与可验证收据；协议文档与 SDK |
| 2 | `name` | Recurring operations and connectors | 週期性任務與系統連接器 | 周期性任务与系统连接器 |
| 2 | `description` | **Following** a stable model for single invocations, the platform adds **repeatable operation**: subscription-based tasks and **connectors** integrate agents with existing systems; pause, resume, and execution history remain **under the account holder’s control**. | **於單次調用模式趨於穩定後**，平台補強**可重複運行**能力：以訂閱式任務與**連接器**將智能體與既有系統銜接；暫停、恢復與執行歷程**由帳戶持有人自主管理**。 | **在单次调用模式趋于稳定后**，平台补强**可重复运行**能力：以订阅式任务与**连接器**将智能体与既有系统衔接；暂停、恢复与执行历程**由账户持有人自主管理**。 |
| 2 | `capabilities` | Subscription-based tasks; Task scheduling; Connectors (integration with existing systems); Evidence of local execution | 訂閱式任務；任務排程；連接器（與既有系統整合）；本地執行之佐證材料 | 订阅式任务；任务排程；连接器（与既有系统整合）；本地执行之佐证材料 |
| 3 | `name` | Publisher listings and catalog discovery | 發布者上架與目錄可發現性 | 发布者上架与目录可发现性 |
| 3 | `description` | **With core invocation and automation in production use**, **publisher-facing capabilities** support **listing agents** for others to select and enable from the Agent Hub—hosted runtime, discovery, and publisher tooling expand the catalog **without** assuming universal self-hosting. | **當核心調用與自動化已具可依賴之閉環**，**面向發布者**之能力隨之開放：支援**上架智能體**，供他人在智能體中心**選用與啟用**；託管運行時、可發現性及發布者工具協同支撐目錄擴充，**無須**假設所有參與者均需先行自建託管。 | **当核心调用与自动化已具备可依赖的闭环**，**面向发布者**的能力随之开放：支持**上架智能体**，供他人在智能体中心**选用与启用**；托管运行时、可发现性及发布者工具协同支撑目录扩充，**无须**假设所有参与者均需先行自建托管。 |
| 3 | `capabilities` | Hosted runtime; Catalog discovery and listings in the Hub; Billing and publisher console; Template library | 託管運行時；智能體中心內之目錄發現與列示；計費與發布者控制台；模板庫 | 托管运行时；智能体中心内之目录发现与列示；计费与发布者控制台；模板库 |
| 4 | `name` | Teams, policy, many agents | 多人協作——策略與多智能體 | 多人协作——策略与多智能体 |
| 4 | `description` | **As work becomes shared**, **multiple agents** and teammates meet on **one timeline**—**runtime rules** and **human review** catch high-impact steps, backed by **reputation** and **fallbacks** when outcomes drift. | **當工作變成多人共事**，**多個智能體**與成員匯入**同一時間線**——以**執行當下規則**與**人工覆核**收束高影響步驟，並以**信譽**與**回退**承接結果波動。 | **当工作变成多人共事**，**多个智能体**与成员汇入**同一时间线**——以**执行当下规则**与**人工复核**收束高影响步骤，并以**信誉**与**回退**承接结果波动。 |
| 4 | `capabilities` | Threads, @mentions, presence; Runtime policy + human review; Retry / switch / degrade; Reputation signals | 對話串、@ 提及、在線狀態；執行規則＋人工覆核；重試／切換／降級；信譽訊號 | 对话串、@ 提及、在线状态；执行规则＋人工复核；重试／切换／降级；信誉信号 |
| 5 | `name` | Enterprise programs | 企業級方案 | 企业级方案 |
| 5 | `description` | **Orchestration** for complex flows; **compliance** artifacts, **white-label**, and **deeper observability**—so sign-off and audit views **scale with the org**. | **編排**複雜流程；**合規**產出、**白標**與**更深可觀測**——讓簽核與審計視圖**隨組織擴展**。 | **编排**复杂流程；**合规**产出、**白标**与**更深可观测**——让签核与审计视图**随组织扩展**。 |
| 5 | `capabilities` | Orchestration DSL & runtime; Visual editor; Compliance reports; TEE, SLA, white-label | 編排 DSL 與運行時；可視化編輯器；合規報表；TEE、SLA、白標 | 编排 DSL 与运行时；可视化编辑器；合规报表；TEE、SLA、白标 |
| 6 | `name` | Network effect | 網絡效應 | 网络效应 |
| 6 | `description` | **Further out on the roadmap**, we’re shaping **subnet federation** and **cross-node** collaboration—**self-hosted nodes**, **broader discovery**, and an **Agent Internet** guided by policy, **in steps** as capabilities mature. | 在**更長的產品路線上**，我們持續探索**子網聯邦**與**跨節點**協作——包含**自建節點**、**更廣的可發現性**，以及在策略下走向 **Agent 互聯網**，**隨能力成熟分階段推進**。 | 在**更长的产品路线上**，我们持续探索**子网联邦**与**跨节点**协作——包含**自建节点**、**更广的可发现性**，以及在策略下走向 **Agent 互联网**，**随能力成熟分阶段推进**。 |
| 6 | `capabilities` | **Wider network participation** on policy-backed terms; **governed links** between deployments so discovery and hand-offs stay accountable; **bridges** to the chat tools teams already use; **sustainable participation** for people who help run the network | **在策略保障下**參與更廣協作網絡；**受治理的環境銜接**，讓可發現性與交接仍可歸因；與**日常慣用之對話工具**銜接；讓**協助維運網絡的參與方**獲得可持續參與空間 | **在策略保障下**参与更广协作网络；**受治理的环境衔接**，让可发现性与交接仍可归因；与**日常惯用之对话工具**衔接；让**协助维运网络的参与方**获得可持续参与空间 |
| 7 | `name` | Physical world | 物理世界 | 物理世界 |
| 7 | `description` | **On the horizon**: bringing **devices and real-world identities**—**shop floors, edge locations**—into the same **governance** you expect from GaiaLynk, **when** the roadmap says we’re ready. | **同樣屬前瞻方向**：把**設備與產線身份**納入同一套**治理模型**，讓實體現場以**可管理的參與方**加入協作——**上線節奏**見**產品路線圖**。 | **同样属前瞻方向**：把**设备与产线身份**纳入同一套**治理模型**，让实体现场以**可管理的参与方**加入协作——**上线节奏**见**产品路线图**。 |
| 7 | `capabilities` | Agent Dock; Local action hub; Execution-agent adapter; Space-level collaboration | Agent Dock；本地行動中樞；執行智能體適配；空間級協同 | Agent Dock；本地行动中枢；执行智能体适配；空间级协同 |

### D.5 官网不展示工程阶段时间线（产品决策）

**结论**：营销站 **`/[locale]/roadmap` 不再呈现** **Phase 0–4+** 与 **子里程碑（M1-a、M2-b…）及 deliverables** 的展开时间线。访客侧只保留：**1–7 阅读顺序**、分组 `journeySections`、各 `milestoneCards` 文案与状态徽章、以及 **§D.3** 可选折叠的「能力主题 ↔ 工程编号」对照表。

**理由（简要）**：工程阶段与子里程碑是**排期与拆解**，对公众易产生「内部站会／交付看板」读感；**进展与范围**已由卡片状态 + 叙事 + 本页整体信息承担，**无需再叠一层 Phase UI**。

**工程与数据（落地指引）**：

- **页面**：从 `roadmap/page.tsx` **移除**工程阶段时间线区块（如 `RoadmapTimeline` 或等价组件）；**不得**再向用户展示 `phases` 展开列表。
- **`roadmap-full.ts`**：`phases` 数组可**暂时保留**，供内部对照 CTO 规格、测试或将来非营销导出；**官网路由不读取渲染**。随清理进度，也可迁入 `docs/` 或独立内部数据源，与营销 i18n 脱钩。
- **文案键**：原 `phasesSectionHeading`、`phasesSectionLead` **官网不使用**（实现上可从 `RoadmapFull` 类型与字典中删除，或保留字段但页面不引用——以代码整洁为准）。
- **工程排期真值**：仍以 CTO 主规格、`docs/` 内工程向文档或仓库内迁移后的数据源为准；**本稿不再维护 Phase 级逐条官网文案表**。

---

## E. 场景故事 `/[locale]/use-cases`

**数据源**：`dictionaries.useCases` + `use-cases/page.tsx`（`JOURNEY_SECTION`、`ROADMAP_CROSS`）+ `use-cases-company-a-journey.ts`

### E.0 CompanyA 叙事意图（联合创始人共识 · 可写入内部 brief）

| 要点 | 说明 |
|------|------|
| **表面** | 读者看到一家虚构 **CompanyA** 与多角色剧情。 |
| **实质** | **每一章对应公众中一种真实「工作尺度」**：个人轻量、个人进阶、团队日常协作、团队高复杂运营、跨团队／伙伴衔接，以及再往前的前瞻段落。 |
| **要传达的一句** | **GaiaLynk 的产品规划不是只服务某一类人**——无论你现在是独自用、小团队用，还是要走到跨团队对接，都能在这条故事线里**找到自己的位置**；路线图负责**时间与可用范围**，故事负责**让你看见自己属于哪一段**。 |
| **对外忌语** | 避免「读前几章就够」「后面是给别人的」——应改为 **「从最接近你的那一段读起」**，并点明**后段是更大尺度与更远图景**，仍属同一产品愿景。 |

### E.1 页头（`dictionaries.useCases`）

**语气**：完整书面句、陈述价值与覆盖范围；首屏不写「写作动机」或阅读指示（归 §E.0 / §E.2）。

| 字段 | EN（v1.2.5 优化稿） | 繁中（v1.2.5 优化稿） | 简中（v1.2.5 优化稿） |
|------|---------------------|------------------------|------------------------|
| `title` | From individual work to teams and partners | 從個人工作，到團隊與夥伴協作 | 从个人工作，到团队与伙伴协作 |
| `description` | Start in the **Agent Hub** with listed agents—**no self-hosting**. **CompanyA** is one continuous illustration: collaboration moves from **individuals** to **shared team work**, then to **partners and cross-team alignment**—showing the **full span** GaiaLynk is built for. **What’s available now and what’s next** is on the **product roadmap**. | 於**智能體中心**選用已上架智能體即可開始，**無須自建託管**。**CompanyA** 為一條連續示範：協作由**個人**走向**團隊共事**，再延伸至**夥伴與跨團隊對齊**——呈現 GaiaLynk 意圖支撐的**完整跨度**。**目前已開放與後續規劃**見**產品路線圖**。 | 在**智能体中心**选用已上架智能体即可开始，**无须自建托管**。**CompanyA** 为一条连续示范：协作由**个人**走向**团队共事**，再延伸至**伙伴与跨团队对齐**——呈现 GaiaLynk 意图支撑的**完整跨度**。**目前已开放与后续规划**见**产品路线图**。 |
| `primaryCta` | Open app | 打開應用 | 打开应用 |
| `seoTitle` | Stories — GaiaLynk | 場景故事 — GaiaLynk | 场景故事 — GaiaLynk |
| `seoDescription` | **CompanyA** shows governed agent collaboration from solo work to teams and partners—starting from the **Agent Hub**. The **roadmap** shows **what you can use today** and **where we’re headed next**. | **CompanyA** 示範從個人、團隊到夥伴與跨組織的受治理智能體協作——起點在**智能體中心**。**路線圖**呈現**目前已可用與接下來的方向**。 | **CompanyA** 演示从个人、团队到伙伴与跨组织的受治理智能体协作——起点在**智能体中心**。**路线图**呈现**目前已可用与接下来的方向**。 |

### E.2 页内 `JOURNEY_SECTION`（`use-cases/page.tsx`）

| 字段 | EN（优化稿） | 繁中（优化稿） | 简中（优化稿） |
|------|----------------|----------------|----------------|
| `eyebrow` | How the story unfolds | 故事如何展開 | 故事如何展开 |
| `title` | Choose the chapter that fits you | 選擇最貼近你的一章 | 选择最贴近你的一章 |
| `intro` | Each chapter reflects a **different scale**—solo, team, or **across organizations**. You’re still reading **one product story**. **What’s available today and what’s next**—open the **roadmap** link in the banner above. | 每一章對應**不同工作尺度**——個人、團隊或**跨組織**；讀起來仍是**同一條產品故事線**。**當前可用與後續規劃**——見上方橫幅的**路線圖**連結。 | 每一章对应**不同工作尺度**——个人、团队或**跨组织**；读起来仍是**同一条产品故事线**。**当前可用与后续规划**——见上方横幅的**路线图**链接。 |

### E.3 页眉内 `ROADMAP_CROSS`（横幅下第二段，链至 `/roadmap`）

| 部分 | EN | 繁中 | 简中 |
|------|-----|------|------|
| `before` | Curious what’s **available now**—and **what we’re focusing on next**? Open the | 想了解**現在能做什麼**，以及**接下來我們優先往哪裡做**？打開 | 想了解**现在能做什么**，以及**接下来我们优先往哪里做**？打开 |
| `link` | roadmap | 產品路線圖 | 产品路线图 |
| `after` | . We update it as capabilities ship. | 。隨能力上線持續更新。 | 。随能力上线持续更新。 |

**协作备注**：故事页首屏**不必**堆 Phase 编号或「研发合并视图」等内部说法；读者分工是 **情境（故事）** 与 **时间与范围（路线图）** 各管一段即可。

### E.4 CompanyA 六章 — 全文优化稿（对照 `use-cases-company-a-journey.ts`）

**徽章 `outlookBadge`（非展望章）**：对外可统一为 **Outlook**（EN）／**展望**（繁简）；第六章 `isOutlookChapter: true` 时，正文与 `outlookNotice` **建议**用白话写清：**这是前瞻方向，不是今天就能逐项打开的功能清单**。

#### E.4.0 各章 `title` / `narrative` / `journeyHeading` / `capabilitiesHeading` / `closure` / `outlookNotice`

| 章 | 字段 | EN | 繁中 | 简中 |
|----|------|-----|------|------|
| 1 | `label` | Chapter 1 | 第一章 | 第一章 |
| 1 | `title` | Natural-language requests and routed execution | 自然語言需求與智能路由 | 自然语言需求与智能路由 |
| 1 | `narrative` | You state needs in everyday language; the platform **routes** work, applies **policy**, and keeps **verifiable receipts**. **No company setup is required** to start.<br><br>**CompanyA** is a **fictional five-role sketch** (marketing, leadership, engineering, procurement, operations) showing how the path widens as more people take part. **Solo use follows the same shape.**<br><br>Before shared threads, each role works in a **private thread**, choosing **listed agents** in the Agent Hub—**without** an org-wide kickoff. | 您以自然語言提出需求；平台完成**智能路由**、套用**信任策略**，並留存**可驗證收據**。**不以**具備企業主體為前提。<br><br>**CompanyA** 為**示範性虛構情境**（行銷、高階管理、工程、採購、營運五類角色），說明參與面擴大時能力如何延伸；**個人使用亦從同一形狀開始**。<br><br>在共享對話之前，各角色於**獨立對話**作業，於**智能體中心**選用**已上架智能體**，**無須**全組織啟動會議。 | 您以自然语言提出需求；平台完成**智能路由**、应用**信任策略**，并保留**可验证收据**。**不以**具备企业主体为前提。<br><br>**CompanyA** 为**演示性虚构情境**（市场、高层管理、工程、采购、运营五类角色），说明参与面扩大时能力如何延伸；**个人使用亦从同一形状开始**。<br><br>在共享会话之前，各角色在**独立会话**作业，在**智能体中心**选用**已上架智能体**，**无须**全组织启动会议。 |
| 1 | `journeyHeading` | Five opening exchanges | 五則初始互動 | 五则初始互动 |
| 1 | `capabilitiesHeading` | What you get | 能力要點 | 能力要点 |
| 1 | `capabilities` | ① Agents in the Agent Hub show trust signals clearly.<br>② Plain-language requests become routed execution.<br>③ History stays available for audit and replay. | ① 智能體中心內智能體**明示信任訊號**。<br>② 自然語言輸入對應**受路由的執行**。<br>③ 歷程**可留存、可覆核**。 | ① 智能体中心内智能体**明示信任信息**。<br>② 自然语言输入对应**经路由的执行**。<br>③ 历程**可留存、可复核**。 |
| 1 | `closure` | Each role reaches a **first useful outcome**; work still lives **across separate threads**. | 各角色取得**可用的第一階段成果**；協作仍**分散於各對話**。 | 各角色取得**可用的第一阶段成果**；协作仍**分散于各会话**。 |
| 2 | `label` | Chapter 2 | 第二章 | 第二章 |
| 2 | `title` | Repeatable, policy-aware workflows | 可重複、受策略約束的工作流 | 可重复、受策略约束的工作流 |
| 2 | `narrative` | The same people **turn proven requests into workflows** you can run again—steps in natural language or from **templates builders publish**. | 同一批參與者將已驗證的需求**固化為可重複執行的工作流**——步驟可以自然語言描述，或由**開發者發布之範本**初始化。 | 同一批参与者将已验证的需求**固化为可重复执行的工作流**——步骤可以自然语言描述，或由**开发者发布的模板**初始化。 |
| 2 | `journeyHeading` | Longer run sequences | 延伸之作業序列 | 延伸之作业序列 |
| 2 | `capabilitiesHeading` | What you get | 能力要點 | 能力要点 |
| 2 | `capabilities` | ① Multi-step flows feel like **one** experience.<br>② Routing without wiring each run by hand.<br>③ Fits **personal** initiatives and **team** programs. | ① 多步驟流程，**一體化**體驗。<br>② **無須**每次手動串接即可完成路由。<br>③ 適用**個人**專案與**部門**計畫。 | ① 多步骤流程，**一体化**体验。<br>② **无须**每次手动串接即可完成路由。<br>③ 适用**个人**项目与**部门**计划。 |
| 2 | `closure` | The same team can **run the workflow on a cadence**. | 同一批參與者可**按節奏重複執行**該工作流。 | 同一批参与者可**按节奏重复执行**该工作流。 |
| 3 | `label` | Chapter 3 | 第三章 | 第三章 |
| 3 | `title` | Collaboration in a shared thread | 共享對話內的協作 | 共享会话内的协作 |
| 3 | `narrative` | As more people join—**home, client, or internal** settings—**shared threads** replace scattered DMs. People align on decisions; **agents** help draft and summarize, with **verifiable records** in one place. | 參與方增加後——**家庭、客戶或內部組織**——**共享對話**取代分散私訊。眾人對齊決策；**智能體**協助起草與摘要，並於同一脈絡留存**可驗證紀錄**。 | 参与方增加后——**家庭、客户或内部组织**——**共享会话**取代分散私信。众人对齐决策；**智能体**协助起草与摘要，并于同一语境留存**可验证记录**。 |
| 3 | `journeyHeading` | One place to align | 協作範圍彙整 | 协作范围整合 |
| 3 | `capabilitiesHeading` | What you get | 能力要點 | 能力要点 |
| 3 | `capabilities` | ① Membership and permissions mirror real structure.<br>② One timeline for **people and agents**.<br>③ Speed **with** clear governance boundaries. | ① 成員與權限貼合實際結構。<br>② **人與智能體**共用同一時間線。<br>③ 在清楚治理邊界下提升效率。 | ① 成员与权限贴合实际结构。<br>② **人与智能体**共用同一时间线。<br>③ 在清楚治理边界下提升效率。 |
| 3 | `closure` | People and agents advance **one shared narrative**. | 人員與智能體依**同一業務敘事**推進。 | 人员与智能体依**同一业务叙事**推进。 |
| 4 | `label` | Chapter 4 | 第四章 | 第四章 |
| 4 | `title` | Partner agents in the thread | 夥伴智能體接入對話 | 伙伴智能体接入会话 |
| 4 | `narrative` | Where policy allows, **agents run by partner organizations** may join the session, **working with information within the scope each partner has authorized for disclosure outside their organization**—**what can appear in the thread follows that partner’s authorization**. **If you don’t need cross-org work yet**, treat this as context; the **same invitation pattern** applies when you do. | 於策略允許時，**由合作方營運之智能體**可加入對話；**可見與可處理之內容，以各該合作方已授權、得對外揭露之範圍為準**。**若尚無跨組織需求**，可視為補充；實際需要時**邀請機制不變**。 | 在策略允许时，**由合作方运营的智能体**可加入会话；**可见与可处理的内容，以各该合作方已授权、可对外披露的范围为准**。**若尚无跨组织需求**，可视为补充；实际需要时**邀请机制不变**。 |
| 4 | `journeyHeading` | External participants | 外部協作參與方 | 外部协作参与方 |
| 4 | `capabilitiesHeading` | What you get | 能力要點 | 能力要点 |
| 4 | `capabilities` | ① **Partner-run agents are listed in the Agent Hub** and join through the **same invitation mechanics** as your other agents—**cross-org collaboration stays on one product path**.<br>② **Who may connect** is defined by policy.<br>③ **One pattern**, many scenarios. | ① **由合作方營運之智能體於智能體中心列示**，並以與內部其他智能體**相同之邀請與接入方式**加入對話，**跨組織協作沿用同一產品路徑**。<br>② **誰可連線**由策略定義。<br>③ **單一模式**，多種情境。 | ① **由合作方运营的智能体在智能体中心列示**，并以与内部其他智能体**相同的邀请与接入方式**加入会话，**跨组织协作沿用同一产品路径**。<br>② **谁可连线**由策略定义。<br>③ **单一模式**，多种情境。 |
| 4 | `closure` | Cross-org work stays **visible and policy-governed**. | 跨組織協作**過程可見、規則可管**。 | 跨组织协作**过程可见、规则可管**。 |
| 5 | `label` | Chapter 5 | 第五章 | 第五章 |
| 5 | `title` | Human confirmation for consequential actions | 重大操作的人工確認 | 重大操作的人工确认 |
| 5 | `narrative` | Agents prepare drafts and evidence. **Purchases, public posts, workforce moves, and customer commitments** need **explicit human approval**—for individuals, usually **the account owner**; in larger orgs, **named accountable roles**. | 智能體負責初稿與佐證材料。**採購承諾、對外發布、人力排班與對客義務**等，須經**具名人員明示授權**——個人情境通常為**帳戶持有人**；較大組織為**明確職責角色**。 | 智能体负责初稿与佐证材料。**采购承诺、对外发布、人力排班与对客户义务**等，须经**具名人员明示授权**——个人场景通常为**账户持有人**；较大组织为**明确职责角色**。 |
| 5 | `journeyHeading` | People keep the decision | 責任仍屬人員 | 责任仍属人员 |
| 5 | `capabilitiesHeading` | What you get | 能力要點 | 能力要点 |
| 5 | `capabilities` | ① Sensitive steps can require approval **with reasons on record**.<br>② Decisions map cleanly to what ran.<br>③ Pause or escalate **without losing context**. | ① 敏感步驟可要求確認並**留存理由**。<br>② 決策與實際執行**相互對應**。<br>③ 可暫停或升級，**脈絡不中斷**。 | ① 敏感步骤可要求确认并**留存理由**。<br>② 决策与实际执行**相互对应**。<br>③ 可暂停或升级，**脉络不中断**。 |
| 5 | `closure` | **Agents prepare; people decide.** | **智能體提供準備性產出；決策權在人。** | **智能体提供准备性产出；决策权在人。** |
| 6 | `label` | Chapter 6 | 第六章 | 第六章 |
| 6 | `title` | Where the product heads next | 產品後續方向（展望） | 产品后续方向（展望） |
| 6 | `outlookNotice` | **This section looks ahead** at where we’re taking the product—it’s **not** a switchboard of features you can flip on today. **What’s live and what’s coming** stays on the **public roadmap**. | **以下談的是我們想把產品帶往哪裡**，**並非**一鍵全開的功能清單。**目前已可用與後續規劃**請看**公開產品路線圖**。 | **以下谈的是我们想把产品带往哪里**，**并非**一键全开的功能清单。**目前已可用与后续规划**请看**公开产品路线图**。 |
| 6 | `narrative` | **Planned themes** include richer discovery in the Agent Hub, deeper operational playbooks, and governance visibility that scales with adoption—for **individuals and organizations**. **Cross-org trust** and **field operations** roll out **on the public roadmap** as capabilities mature. | **規劃方向**包含智能體中心更易檢索、更完整作業劇本，以及隨採用擴大的治理可見度——涵蓋**個人與組織**。**跨組織信任**與**實體現場覆蓋**會隨能力成熟、**在公開路線圖上**逐步推出。 | **规划方向**包含智能体中心更易检索、更完整作业剧本，以及随采用扩大的治理可见度——涵盖**个人与组织**。**跨组织信任**与**实体现场覆盖**会随能力成熟、**在公开路线图上**逐步推出。 |
| 6 | `journeyHeading` | Strategic outlook | 策略展望 | 战略展望 |
| 6 | `capabilitiesHeading` | What we’re building toward | 我們正在往哪裡前進 | 我们正在往哪里前进 |
| 6 | `capabilities` | ① **Richer discovery** in the Agent Hub and **steadier trust between organizations**—delivered **in stages**; **pace and scope** stay on the **public roadmap**.<br>② **Governance you can follow**: policies, approvals, and history stay **legible** as you move from solo use to **larger teams**.<br>③ **Physical sites and devices** join the **same collaboration model** over time—**timing and detail** appear on the **public roadmap** as plans mature. | ① **智能體中心更易找到對的智能體**，並在**跨組織協作**上走向**更穩的可信銜接**——**分階段釋出**；**節奏與範圍**見**公開產品路線圖**。<br>② **治理看得懂**：從個人使用到**更大團隊**，策略、確認與紀錄**仍清楚可追、可對應查閱**。<br>③ **實體現場與裝置**逐步納入**同一套協作與信任框架**——**時點與做法**隨路線圖更新公開。 | ① **智能体中心更易找到对的智能体**，并在**跨组织协作**上走向**更稳的可信衔接**——**分阶段释出**；**节奏与范围**见**公开产品路线图**。<br>② **治理看得懂**：从个人使用到**更大团队**，策略、确认与记录**始终清晰、可追溯、可查阅**。<br>③ **实体现场与设备**逐步纳入**同一套协作与信任框架**——**时点与做法**随路线图更新公开。 |

#### E.4.1 — E.4.6 `storyMoments`（`headline` + `body`）

| 章 | `headline`（示例以 EN 为准；繁简角色名见下栏对应） | EN `body` | 繁中 `body` | 简中 `body` |
|----|---------------------------------------------------|-----------|-------------|-------------|
| 1 | Maya · Marketing / 行銷 / 市场 | Request: **three short videos this week for a new device.** A video agent returns scripts and rough cuts; outputs stay **visible in the Agent Hub**, not trapped in a private side channel. | 需求：**本週三支短片介紹新裝置。** 影音智能體依目標產出腳本與粗剪；結果**列於智能體中心**，而非僅存非正式私訊。 | 需求：**本周三支短片介绍新设备。** 影音智能体依目标产出脚本与粗剪；结果**列于智能体中心**，而非仅存非正式私信。 |
| 1 | Alex · Executive leadership / 高階管理 / 高层管理 | Request: **a 90-day product narrative and a tight requirements outline.** You get narrative text, a short brief, and **open questions** ready for review. | 需求：**九十天產品敘事與精簡需求大綱。** 回傳敘事文本、簡要文件及**待釐清事項**，供審議。 | 需求：**九十天产品叙事与精简需求大纲。** 返回叙事文本、简要文件及**待澄清事项**，供审议。 |
| 1 | Jordan · Engineering / 工程 | Request: **a weekly summary of hardware–software interface changes.** The answer is short, with **risk notes**; no forced cross-team meeting yet. | 需求：**彙整本週軟硬體介面變更。** 回覆精煉並附**風險註記**；此階段不強制跨部門會議。 | 需求：**汇总本周软硬件接口变更。** 回复精炼并附**风险注记**；此阶段不强制跨部门会议。 |
| 1 | Dana · Procurement / 採購 / 采购 | Request: **a structured comparison of public quotes.** Uses **public sources only**—clear boundary before contracts. | 需求：**將公開報價整理為對照表。** 僅用**公開來源**，合約前維持邊界清晰。 | 需求：**将公开报价整理为对照表。** 仅用**公开来源**，合同前保持边界清晰。 |
| 1 | Raj · Operations / 營運 / 运营 | Request: **next week’s shift plan** under line constraints. The agent returns an **editable draft**; the manager keeps authority. | 需求：**依產線規則編排次週班表。** 智能體產出**可編修初稿**；現場裁量權屬負責主管。 | 需求：**按产线规则编排次周班表。** 智能体产出**可编辑初稿**；现场裁量权属负责主管。 |
| 2 | Maya · Marketing | **Pipeline:** concept → draft → pre-publish checks → review—**within what agents list in the Agent Hub today**. | **序列化流程：**概念→稿件→發布前檢查→回饋檢視——**以智能體中心當前列示能力為範圍**。 | **序列化流程：**概念→稿件→发布前检查→反馈检视——**以智能体中心当前列示能力为范围**。 |
| 2 | Alex · Executive leadership | **Layered refinement:** assumptions, priorities, milestones, risks—**multiple turns in one thread**. | **逐層深化：**假設、優先序、里程碑與風險——**於同一對話內多輪迭代**。 | **逐层深化：**假设、优先级、里程碑与风险——**在同一会话内多轮迭代**。 |
| 2 | Jordan · Engineering | **Cross-domain chain:** design constraints, interface specs, joint integration checklist. | **跨域鏈結：**設計限制、介面規格與聯合驗證清單。 | **跨域链结：**设计限制、接口规格与联合验证清单。 |
| 2 | Dana · Procurement | **Structured passes** on specs, lead times, MOQs—**tabular, validated**, not messy paste. | **結構化多輪補全：**規格、交期、最小訂購量——**表格式、可驗證**。 | **结构化多轮补全：**规格、交期、最小订货量——**表格式、可验证**。 |
| 2 | Raj · Operations | Skills, maintenance windows, and shift patterns in **one view**. | 技能、保養視窗與班表等參數，**以統一視圖呈現**。 | 技能、维保窗口与班表等参数，**以统一视图呈现**。 |
| 3 | Raj · Operations + line supervision | People post **blackout times**; a **shared scheduling agent** recomputes; **named approvers** sign off. | 參與者宣告**不可排班時段**；**共用排班智能體**重新計算；**指定核可人**確認定案。 | 参与者声明**不可排班时段**；**共用排班智能体**重新计算；**指定核准人**确认定案。 |
| 3 | Jordan · Engineering + integration | Mechanical, firmware, and validation **in one thread**. Agents capture minutes, sketches, and test notes on **one timeline**. | 機構、韌體與驗證**於同一對話協調**；智能體記錄紀要、介面草案與測試要點——**時間線一致**。 | 结构、固件与验证**于同一会话协调**；智能体记录纪要、接口草案与测试要点——**时间线一致**。 |
| 3 | Alex · Executive leadership | A **strategy alignment thread** with the right stakeholders—each can pair **people and agents** as needed. | **策略對齊對話**納入指定干係人；每人可依需要配置**人員與智能體**。 | **战略对齐会话**纳入指定干系人；每人可按需配置**人员与智能体**。 |
| 3 | Dana · Procurement + finance / legal | Before anything goes external, procurement, finance, and legal review **one consolidated pack**. | 對外揭露前，採購、財務與法務審閱**同一份彙整材料包**。 | 对外披露前，采购、财务与法务审阅**同一份整合材料包**。 |
| 4 | Dana · Procurement — supplier agent | Invite a **discoverable** supplier agent; answers stay within **policy-authorized public facts**—no unofficial channel posing as “official help.” | 邀請**可檢索**之供應商智能體；回覆限於**策略授權之公開範圍**，避免非正式管道冒充官方。 | 邀请**可检索**的供应商智能体；答复限于**策略授权之公开范围**，避免非正式渠道冒充官方。 |
| 4 | Maya · Marketing — specialist agent | The **same invitation path** for specialist agents listed in the Agent Hub—**one integration pattern, many domains**. | **同一邀請機制**適用於智能體中心內專家型智能體——**單一接入模式，多種職能場景**。 | **同一邀请机制**适用于智能体中心内专家型智能体——**单一接入模式，多种职能场景**。 |
| 5 | Dana · Procurement — PO | **Authorized reps on both sides** align terms before commitment; agents stay in **document prep**. | **雙方授權代表**對齊條款後方具效力；智能體僅承擔**文件準備**。 | **双方授权代表**对齐条款后方具效力；智能体仅承担**文件准备**。 |
| 5 | Maya · Marketing — publish | **Marketing or legal** reviews outward content; **high-impact posts wait for a person** before they go live. | **行銷或法務**審核對外內容；**高影響貼文在人工確認後才會對外發出**。 | **市场或法务**审核对外内容；**高影响帖文在人工确认后才会对外发出**。 |
| 5 | Raj · Operations — scheduling | A **named owner** approves the final plan; **schedules aren’t set by software alone**. | **具名負責人**確認定案；**班表不會只靠軟體自動拍板**。 | **具名负责人**确认定案；**排班不会只靠软件自动拍板**。 |
| 5 | Alex · Executive leadership — customer commitments | **Management** owns customer-facing commitments; agents supply drafts and evidence. | **管理層**簽發對客規格；智能體提供底稿與證據支援。 | **管理层**签发对客户规格；智能体提供底稿与证据支持。 |
| 6 | Network / 協作網路 / 协作网络 | **Stronger discovery** first; **tighter cross-org trust** comes **later on the roadmap**. | 近期先把**可檢索性**做紮實；中長期再往**更穩的跨組織可信協作**延伸——**節奏見路線圖**。 | 近期先把**可检索性**做扎实；中长期再往**更稳的跨组织可信协作**延伸——**节奏见路线图**。 |
| 6 | Governance visibility / 治理可見度 / 治理可见性 | Policy scope and observability **grow with deployment**—from personal history to org-wide views. | 策略範圍與可觀測性**隨部署規模擴展**——由個人紀錄至組織視角。 | 策略范围与可观测性**随部署规模扩展**——由个人记录至组织视图。 |
| 6 | Physical operations / 實體現場 / 实体现场 | Lines, warehouses, and field work as **governed identities** in the same trust model—**timing on the roadmap**. | 產線、倉儲與外勤以**可治理身份**納入同一信任模型——**何時推進見路線圖**。 | 产线、仓储与外勤以**可治理身份**纳入同一信任模型——**何时推进见路线图**。 |

### E.5 `/use-cases/[slug]`（条目页 `title` / `description` 优化稿）

| slug | EN `title`（可兼作列表标题） | EN `description` | 繁中 `title` | 繁中 `description` |
|------|------------------------------|-------------------|--------------|---------------------|
| multi-agent-dev | Multiple listed agents, one thread | Pick **several listed agents** in the Agent Hub; handoffs stay **legible** in one conversation. | 單一對話，多個已上架智能體 | 於**智能體中心**選用**多個已上架智能體**；交接在同一對話中**清楚可讀**。 |
| high-risk-approval | High-impact steps wait for you | Sensitive actions **pause** until **you** confirm—policy and review before execution. | 高影響步驟等待您確認 | 敏感操作**暫停**，直至**您**確認——執行前經策略與覆核。 |
| node-collaboration | Cross-node collaboration | **Exploring** federated node topologies—**timing and scope** stay on the **roadmap**. | 跨節點協作 | 正在**探索**聯邦節點拓撲——**時間與範圍**請看**路線圖**。 |
| autonomous-revenue-ops | Recurring operations | **Early exploration:** recurring-ops stories—**when they land** follows the **roadmap**. | 週期性營運場景 | **早期探索**：週期性營運相關敘事——**何時可做**隨**路線圖**更新。 |

**简中**：与繁中同义简体（「智能體」→「智能体」、「覆核」→「复核」等）。

### E.6 `/use-cases/enterprise-governance` 重定向（用户可见提示）

| EN | 繁中 | 简中 |
|-----|------|------|
| Taking you to **Stories**, Chapter 5—**consequential decisions stay with people**. | 正在前往**場景故事**第五章——**重大決定仍由人作出**。 | 正在前往**场景故事**第五章——**重大决定仍由人作出**。 |
## F. 开发者 `/[locale]/developers`

**数据源**：`dictionaries.developers` + `developers/page.tsx`（`NAV_CARDS`）

**定位（全页语气）**：服务对象为 **供给方（发布者／开发者）**：将智能体**上架**至平台，供他人在**同一工作区内的对话**中从**智能体中心**选用并调用。**请避免**让读者以为终端用户必须先自建部署。页首可加一句 EN *End users open the app and select agents in the Agent Hub—this section is for listing, publishing, and integration.*

### F.0 字典 `developers`

| 字段 | EN | 繁中 | 简中 |
|------|-----|------|------|
| title | Publish agents for governed in-chat work | 將智能體上架於受治理的對話工作區 | 将智能体上架于受治理的对话工作区 |
| description | Connect and list agents so people can **select them in the Agent Hub** and run them in chat—no self-hosting walkthrough required. APIs and semantics match the product UI: routing, runtime rules, confirmation before sensitive steps, and histories you can review. | 接入並上架智能體，供他人在**智能體中心**選用並於對話內調用，無須依賴自建託管教學。API 與語義與產品介面一致：路由、運行時規則、敏感步驟前之確認，以及可供查閱之紀錄。 | 接入并上架智能体，供他人在**智能体中心**选用并在对话内调用，无须依赖自建托管教学。API 与语义与产品界面一致：路由、运行时规则、敏感步骤前的确认，以及可供查阅的记录。 |
| primaryCta | Open Quickstart | 打開 Quickstart | 打开 Quickstart |

### F.1 开发者主页四卡（`NAV_CARDS`）

1. **Quick start**：短引导接上第一个智能体（与 Provider 流程一致）。  
2. **SDK & API**：TypeScript、Python、REST；与 UI 同一信任与纪录语义。  
3. **A2A protocol**：端点契约、运行时可问责。  
4. **15-minute listing**：最短上架路径；与控制台检查对齐。

三语描述与 CTA 标签按现有结构写满即可。

### F.2 `/developers/quickstart`

| 字段 | EN | 繁中 |
|------|-----|------|
| title | Quick start | 快速開始 |
| subtitle | Connect your first agent in minutes. Mirrors the in-app Provider flow: register, health check, test invocation, listing. | 數分鐘內接上首個智能體；與應用內 Provider 流程一致：註冊、健康檢查、測試調用、上架。 |

正文步骤保持清晰；**移除面向用户的「Ask path」表述**，改为 *in-chat flow* / *主流程*。

### F.3 `/developers/sdk`

| 字段 | EN | 繁中 |
|------|-----|------|
| title | SDK & API reference | SDK 與 API 參考 |
| description | TypeScript, Python, REST. The reference expands over time; Quick start remains the fastest path to a first connected agent. | TypeScript、Python、REST；詳盡參考持續補齊，接上首個智能體仍以 Quick start 最快。 |

### F.4 `/developers/protocol`

| 字段 | EN | 繁中 |
|------|-----|------|
| title | A2A protocol | A2A 協議 |
| description | How the platform reaches your agent endpoint: discovery, capabilities, requests, errors. Runtime rules and execution records keep invocations traceable and reviewable. | 平台如何呼叫您的智能體端點：發現、能力、請求、錯誤；運行時規則與執行紀錄使調用可追溯、可供查閱。 |

**sections**：What is A2A；Runtime rules（正文可一句标注 *trust policy*）；Execution records（首句白话）。

### F.5 `/developers/evidence`

| 字段 | EN | 繁中 |
|------|-----|------|
| title | Developer view: policy hit and record digest | 開發者視圖：規則命中與紀錄摘要 |
| description | For integrators: rule outcomes, reason codes, record references, and signature material—supporting audit and replay workflows. | 供接入方查閱：規則結果、原因碼、紀錄引用與簽名材料，支援稽核與回放流程。 |

### F.6 `/developers/minimal-onboarding`

| 字段 | EN | 繁中 |
|------|-----|------|
| title | 15-minute minimal listing | 15 分鐘最小上架 |
| subtitle | Shortest path from a working A2A endpoint to a listing: read the contract, echo once, declare concurrency, submit. Matches in-app Provider console checks. | 從可用 A2A 端點到上架之最短路徑：閱讀契約、echo 一次、宣告併發、提交；與應用內 Provider 檢查一致。 |

---

## G. 定价 `/[locale]/pricing`

**数据源**：`content/pricing-page.ts`

- 维持「未定价、公平用量、不刊登虚假价格」。  
- **计量维度**第二条用白话：**已连接应用的外呼（日历、笔记等）**。  
- **付费层**写更高上限、托管编排、更强管控、支持等，**不写未定价数字**。  
- **`freeNowBody` 等可嵌一句消费者向说明**（与 Hero 同命题）：EN *You start with agents listed in the Agent Hub; publishing your own stays optional for publishers and developers.* 繁 *個人使用自智能體中心選用已上架智能體開始；自行上架仍為發布者與開發者之選項。* 简中同义。
- **无预约 Demo**（v1.2.3）：「取得更新」区仅 **路线图 + 帮助中心** 两枚 CTA；Pro/Team/Enterprise 意向链至 **帮助中心**。

三语全字段按此原则在 `pricing-page.ts` 内替换。

---

## H. ~~预约 Demo~~（已移除，v1.2.3）

官网不再提供 `/[locale]/demo`。**旧链接**：`next.config.ts` 将 `/en|zh-Hant|zh-Hans/demo` **永久重定向**至同语系 **`/help`**。线索 API 仍接受历史 `type: "demo"` 导出；**无**对外预约 Demo 表单页。

---

## I. 帮助中心 `/[locale]/help`

**数据源**：`content/help-center.ts`

| 字段 | EN | 繁中 | 简中 |
|------|-----|------|------|
| metaDescription | Concise help for chat, connectors, privacy, confirmations, usage, and troubleshooting. | 對話、連接器、隱私、確認、用量與疑難排解之精簡說明。 | 对话、连接器、隐私、确认、用量与疑难排解之精简说明。 |
| subtitle | Matches what is live today. Labels read **Now** or **In progress**. | 與當前上線能力一致；條目標示**已上線**或**進行中**。 | 与当前上线能力一致；条目标示**已上线**或**进行中**。 |

**入门第一篇**：用户登入后打开应用、进入对话；**第二句**与 Hero 一致——**从智能体中心选用已上架智能体即可开始，无需先行部署自有智能体**；全篇避免以 **Ask** 作品牌动词。

**收据说明**：标题可改为 **What is an execution record?** / **執行紀錄（常稱收據）**。

**规则说明**：标题 **Rules in plain language** / **規則白話說明**；正文第二句 *engineers call this trust policy* / **工程語境下即信任策略**，與首頁「執行當下邊界」敘述銜接。

各篇 body 减少同一屏多次「策略+收据+审计」堆叠。

---

## J. 关于 `/[locale]/about`

**数据源**：`app/[locale]/(marketing)/about/page.tsx` 内 `COPY`

| 字段 | EN（要点） | 繁中（要点） |
|------|------------|--------------|
| visionBody | Work is converging on chat-shaped collaboration. **Most people begin with agents published on the platform—select them in the Agent Hub; no self-deployment required.** GaiaLynk emphasizes clear boundaries, **confirmation before sensitive steps**, and **histories you can review**. Publishers grow the Agent Hub; broader connection is long-term direction—see the roadmap. | 工作正匯聚於對話形態的人與智能體協作。**多數人從智能體中心選用已上架智能體即可起步，無需先行自建部署。** GaiaLynk 著重清楚邊界、**敏感步驟前之確認**與**可供查閱之紀錄**；發布者豐富智能體中心，長期走向更廣連接——進度見路線圖。 |
| teamBody | We build runtime safety, explicit rules, and evidence that audits can use. | 打造運行時安全、明確規則，以及可供稽核取證之材料。 |

简中为繁中同义简体。**首段不以「Agent 互联网」为唯一主句**。

`seoTitle` / `seoDescription` 与 vision 同命题。

---

## K. 节点协作 `/[locale]/node-collaboration`

**数据源**：`node-collaboration/page.tsx`

| 字段 | EN | 繁中 |
|------|-----|------|
| description（要点） | **On the roadmap**: self-hosted nodes with clear trust boundaries, shared discovery where policy allows, governed relay—a **step beyond** what most people use in the product **today**. | **路線圖上的方向**：自建節點、清楚信任邊界、於策略允許下的可發現性、可治理中繼——**比多數人今天在手機／網頁上用到的主路徑再往前一階**。 |

**visionItems**：每条前加 **Planned:** / **規劃：**，避免「已全能」误读。简中同义简体。

---

## L. 隐私与 Cookie

**数据源**：`privacy/page.tsx`、`cookies/page.tsx`（当前多为英文硬编码，建议三语化）

### Privacy

| EN | 繁中 | 简中 |
|-----|------|------|
| We collect only the minimum lead fields and basic funnel events. We do not put sensitive content in analytics payloads. | 僅蒐集必要留資欄位與基礎轉化事件；敏感內容不寫入分析 payload。 | 仅收集必要留资字段与基础转化事件；敏感内容不写入分析 payload。 |

### Cookies

| EN | 繁中 | 简中 |
|-----|------|------|
| Locale preference and minimal analytics to understand conversion by page and locale. You can withdraw consent in the browser. | 語系偏好與最小化之轉化分析；可於瀏覽器撤回同意。 | 语言偏好与最小化之转化分析；可于浏览器撤回同意。 |

---

## M. 字典中「官网顶栏未展示」的键（与叙事对齐）

若产品区仍引用 **`trust`、`docs`、`waitlist`、`ask`、`recovery`、`subscriptions`、`connectors`**：

- 营销与用户可见层 **不使用「Ask 路径」**；统一改为 **主流程／in-chat flow／从智能体中心选用智能体** 等 title、description、seo。  
- 独立路由若在**产品区**而非官网营销区，可在内部「产品壳文案表」维护；**本稿不增加官网页面**。

---

## N. 工程对照表（派活用）

| 路由 | 主要文案来源 |
|------|----------------|
| `/[locale]` | `dictionaries.ts`（home）+ `feature-showcase.ts` + `roadmap-preview.ts` + `developer-ecosystem.ts` + `i18n/product-mockup-copy.ts` |
| `/roadmap` | `roadmap-full.ts` |
| `/use-cases` | `dictionaries.useCases` + `use-cases/page.tsx` + `use-cases-company-a-journey.ts` |
| `/use-cases/[slug]` | `use-cases/[slug]/page.tsx` |
| `/developers` | `dictionaries.developers` + `developers/page.tsx`（NAV_CARDS） |
| `/developers/*` | 各子页 `page.tsx` 内 COPY |
| `/pricing` | `pricing-page.ts` |
| `/help` | `help-center.ts` |
| `/about` | `about/page.tsx` |
| `/node-collaboration` | `node-collaboration/page.tsx` |
| `/privacy`、`/cookies` | 各自 `page.tsx` |
| 顶栏 | `dictionaries.nav`（实际用到的键）+ `marketing/layout.tsx` |
| 页脚 | `dictionaries.footer` |

---

## 修订记录

| 日期 | 说明 |
|------|------|
| 2026-03-24 | v1：定稿「结构不变 · 逐页」优化稿并入 `docs/` |
| 2026-03-24 | v1.1：增补「消费者直接使用平台上已发布可信智能体、免自建部署」为核心痛点与对外策略；更新首页 Hero/SEO/模块要点、路线图 lead、场景页、开发者区定位、定价/演示/帮助/关于及 slug 示例。 |
| 2026-03-24 | v1.1.1：重写 C.1 Hero 为正式官网语气；C.2 SEO 与 Hero 对齐。 |
| 2026-03-24 | v1.1.2：缩短 C.1 Hero `subtitle` 三语篇幅。 |
| 2026-03-24 | v1.1.3：C.1 区分消费者友好 subtitle 与附录正式版；微调 eyebrow；C.2 `seoDescription` 与主方案对齐，并补充读者分层说明。 |
| 2026-03-24 | v1.1.4：消费者友好主方案改为更接近 Apple/Google 的克制正式话术（eyebrow、subtitle、C.2 seoDescription）。 |
| 2026-03-24 | v1.1.5：对齐 V1.3 §4/§5.1——**不**承诺对上架 Agent 做内部代码审核；Hero/SEO/附录与 §0、§C.3 用语改为「已上架、目录、调用治理、分级与评测信号」等。 |
| 2026-03-24 | v1.1.6：C.1 `eyebrow` 采用「Your work / Platform agents / One workspace」三拍结构；英文避免 *Their agents* 歧义，中文「平台上的智能体／智能體 · 同一工作区／區」对齐目录与工作台语境。 |
| 2026-03-24 | v1.1.7：在 Hero 定稿语气下通盘优化 D–L 与各指导段：消费者路径统一 **已上架 + 平台目錄 + 工作區**；英文 **confirmation / review** 与 Hero subtitle 对齐；C.2 SEO、C.3 模块指引、路线图、场景、开发者、Demo、帮助、关于等表格与说明句一并收紧。 |
| 2026-03-24 | v1.1.8：用户可见层将「平台目录／directory」统一为 **智能体中心／智能體中心** 与 **Agent Hub**；文首增补术语说明与 *Marketplace* A/B 备注；新增 **§0.3 称谓表**（原对外营销策略顺延为 §0.4）；附录、SEO、各页表格与 C.3 指引同步替换；并已对齐 `packages/website` 中帮助中心、场景旅程、路线图、开发者子页、产品 i18n（`product-experience`、onboarding）、特性展示等用户可见文案（代码键名与 `AgentDirectory` 等保留）。 |
| 2026-03-24 | v1.1.9：澄清路线图语义——**研发方向与交付状态合一**；第六章前瞻主题**纳入同一路线图叙事**；更新 §E.1–E.3、`use-cases/page.tsx` 之 `ROADMAP_CROSS`／`JOURNEY_SECTION`、`use-cases-company-a-journey.ts` 第六章与 `dictionaries.useCases.seoDescription`，避免「仅以路线图核对已上线」排除前瞻研发内容之误读。 |
| 2026-03-24 | v1.2.0：全站对外语气——**禁止用户可见句像内部备忘**；§0.4 增「语气」行；§E.1–E.3 与场景页 `dictionaries.useCases`、`use-cases/page.tsx`、`use-cases-company-a-journey` 第六章改为营销可读短句；路线图真值仍留在路线图数据与对内说明，营销首屏不堆 Phase／状态机用语。 |
| 2026-03-24 | v1.2.1：场景故事 **CompanyA** 定调——**各章对应不同公众工作尺度**（个人轻量／进阶、团队简单／复杂、跨团队等），传达**产品规划面向所有人**；新增 **§E.0**；§E.1–E.2 与 `dictionaries.useCases`、`use-cases/page.tsx` 之 `JOURNEY_SECTION` 同步；去除「读开头几段就够」类易被误读表述。 |
| 2026-03-24 | v1.2.2：§E.1 页头 **title / description / seoDescription** 改为正式对外营销句——去元叙事与「教怎么读」；与 `dictionaries.useCases` 三语同步。 |
| 2026-03-24 | v1.2.3：移除官网 **预约 Demo**（删 `demo/page`、`dictionaries.demo`、首页/定价等 Demo CTA）；`/demo` → `/help` 301；页脚去重；§A/B/H/N 与定价、关于、场景子页、节点协作、`vision-coverage`、`help-center` 内链同步。 |
| 2026-03-24 | v1.2.4：明确 **文档 vs 代码**——「优化/标注」默认**仅更新本稿**；工程落地须**单独明示**；文首增 **与工程实施的分工**。 |
| 2026-03-24 | v1.2.5：**§D 路线图**与 **§E 场景故事** 全文优化稿入表（含里程碑卡片 1–7、分组 tagline、CompanyA 六章逐段三语等）；当时曾附工程阶段文案表，**v1.2.8 起官网不展示该块**，见 §D.5。 |
| 2026-03-24 | v1.2.6：全稿去除对用户可见句中偏「合同／纪要」的硬口吻（路线图页眉、里程碑 6–7、对照表一句、场景故事与 slug 示例、开发者区禁令式用语等），改为访客向说明语气；文首「文档 vs 代码」协作说明同步软化。并已对齐 `roadmap-full.ts`、`use-cases-company-a-journey.ts`、`use-cases/page.tsx`、`use-cases/[slug]/page.tsx`、`dictionaries.useCases.seoDescription`。 |
| 2026-03-24 | v1.2.7：§D.3 折叠对照表前两行 **oneLiner** 重写（三语 + EN）；同步 `roadmap-full.ts` 之 `engineeringMappingRows`。 |
| 2026-03-24 | v1.2.8：路线图页**取消**官网展示「工程阶段 + 子里程碑」时间线（原 §D.5 全文移除，改 §D.5 决策与落地指引）；§D.1 `journeyIntroNote` 改为仅说明 1–7 与对照表 **M** 编号差异；`phasesSectionHeading` / `phasesSectionLead` 从官网规格表删除。 |
| 2026-03-24 | v1.2.9：§D.4 增 **D.4.0** 四层递进叙事；里程碑卡片 **1–4** `name`/`description`/`capabilities` 三语重写（起手闭环→节奏连接器→供给发现→多人策略）；同步 `roadmap-full.ts`。 |
| 2026-03-24 | v1.2.10：里程碑 **1–3** 改为正式对外语气（§D.4.0 前三条与表内 EN／繁／简）；同步 `roadmap-full.ts`。 |
| 2026-03-24 | v1.2.11：§E CompanyA 第 4 章 `narrative` 三语——合作方智能体数据范围改为**已授权可对外披露**，替代「公开规格、参考交期、公示价格」等固定列举；本稿更新，代码另约同步。 |
| 2026-03-24 | v1.2.12：同段 `narrative` 去掉否定式补充句，改为**仅以各合作方授权之对外披露范围为准**的正面表述（EN／繁／简）。 |
| 2026-03-24 | v1.2.13：§E CompanyA 第 4 章 `capabilities` ① 重写——**列示于智能体中心 + 与内部智能体同一邀请接入路径 + 跨组织仍走同一产品路径**；去除「检索取代私下约定」之误读；工程同步另约。 |
| 2026-03-24 | v1.2.14：§E 第六章 `capabilitiesHeading`/`capabilities` 改为访客向**展望价值**表述；§D.4 里程碑 6 `capabilities` 去 Node–Hub／中繼等工程词，改为公众利益句（三语）；`roadmap-full.ts` 等另约同步。 |

---

*本文档由营销叙事与 V1.3 会话主线对齐，并以「智能体中心即用、供给另径」为消费者主命题；**可信**表述与规格 **§4 治理轨 + 质量轨** 一致，**不**对外承诺对第三方上架代码做「通盘源码审查」。上线时请与产品真实能力及 `entry-page-governance` 等状态位一致，避免过度承诺。*
