# Agent IM 技术栈与基础设施长期规划（CTO 决策版）

> 文档角色：从项目长期规划出发，对「数据库 / 托管平台 / 基础设施」做**一次性统畴决策**，避免按单次部署零散选型。  
> 对齐：`Agent-IM-Product-Plan.md` 八大赛道、Phase 0～3 路线图、架构分层与商业化策略。  
> 本文为 CTO 决策文档，执行时可引用；若业务或合规前提变化，需按文末「何时重新审视」触发复核。

---

## 一、决策总则

1. **抽象优于具体产品**：先定「我们要什么能力」（关系型库、缓存、队列、托管运行时），再选具体产品；避免被单一厂商锁死。  
2. **阶段匹配**：Phase 0～1 优先「能跑通、能验证、成本可控」；Phase 2+ 再为规模、合规、多 region 预留选项。  
3. **可信与审计优先**：主网数据（会话、审计、收据、目录）必须落在我们完全可控的存储与访问链上，不依赖第三方「黑盒」业务逻辑。  
4. **官网与主网解耦**：官网（Marketing Zone）与主网（Hub/产品区）在部署与数据上可分离，便于不同 SLA 与扩展节奏。

---

## 二、数据库：要不要 Supabase？用哪种 Postgres？

### 2.1 结论：**不把 Supabase 作为战略依赖；可关订阅**

| 维度 | 说明 |
|------|------|
| **主网（Core Services）** | 需要**标准 PostgreSQL** 存：会话、参与者、消息、目录、审计事件、收据、delegation、节点注册等。我们要的是「可控 schema + 迁移 + 备份」，不需要 Supabase 的 Auth / Realtime / Storage / Edge Functions。身份与信任由**自有 Trust Engine + 会话身份**承担，审计必须落在自有库。 ⇒ **主网用「任意托管 Postgres」即可，不用 Supabase。** |
| **官网（Marketing 区）** | 分析事件、线索、导出任务等可选存 Postgres。当前设计支持 `memory` / `file` / `postgres` 三种驱动；若用 postgres，**任意提供 Postgres 连接串的服务都可**（Neon、Vercel Postgres、Railway Postgres、RDS 等）。Supabase 只是其一，非必需。 |
| **Supabase 的附加价值** | Auth：我们走自有/第三方 IdP 与 Trust Token，不依赖 Supabase Auth。Realtime：主网实时推送用 SSE/WebSocket + 自有网关，不依赖 Supabase Realtime。Storage：暂无强需求；若有，可用对象存储（S3/R2）或后续再选。 ⇒ **无战略理由必须保留 Supabase。** |

**决策**：  
- 主网与官网均采用「**Postgres-as-a-Service**」抽象：谁提供 Postgres 连接串就用谁，不绑定 Supabase。  
- **可以关掉 Supabase 订阅**。若官网需要持久化分析/线索，可选用：同一主网所用的 Postgres 实例、或 Neon / Vercel Postgres / Railway 等任一托管 Postgres。

### 2.2 长期 Postgres 策略（按阶段）

| 阶段 | 主网 Postgres | 官网 Postgres（若需要） |
|------|----------------|-------------------------|
| **Phase 0～1** | 与主网托管同厂（Railway / Render 自带 Postgres），单实例、单 region，满足 MVP 与早期连接节点。 | 可选：同库划 schema、或独立小实例（Neon 免费档 / Vercel Postgres）。 |
| **Phase 2** | 视用量考虑：只读副本、连接池（PgBouncer/内置）。仍可不换厂商。 | 与主网隔离或同厂商，按合规与成本选。 |
| **Phase 3+** | 若出现多 region、企业数据属地、或合规审计要求，再评估 **AWS RDS / GCP Cloud SQL / 自建**；迁移路径保持「标准 Postgres + 迁移脚本」。 | 同上，或合并到主网数据平面统一治理。 |

---

## 三、托管平台：Render / Railway / Vercel 怎么选？

### 3.1 工作负载拆分

| 负载 | 形态 | 关键需求 |
|------|------|----------|
| **主网（Mainline）** | 长驻进程：Hono API、A2A Gateway、Node–Hub Gateway、SSE/长连接、未来 Worker/Cron | Postgres、可挂载 Redis、稳定长连、Dockerfile 或 build 可定制、环境变量与密钥管理 |
| **官网（Website）** | Next.js 前端 + API Routes（代理到主网、分析/线索等） | 全球边缘、Next 优化、预览/发布流程、与主网解耦 |
| **未来：托管 Agent 运行时** | 隔离执行（沙箱/容器），按需起停 | 与主网同厂商或可打通网络与身份，Phase 2 再定 |

### 3.2 主网（Backend）：Railway 优先，Render 备选；不用 Vercel

| 厂商 | 适用性 | 说明 |
|------|--------|------|
| **Railway** | ✅ 首选（Phase 0～1） | Postgres 一键、Dockerfile 支持、环境变量清晰、免费档可用、扩展为付费即可；与当前《创始人 Staging 指引》一致，创始人可零基础跟做。 |
| **Render** | ✅ 备选 | 同样支持 Docker、Postgres、后台任务；免费档有冷启动；适合「Railway 若遇限流或政策变化」时平移。 |
| **Vercel** | ❌ 不用于主网 | 以 Serverless/Edge 为主；主网为**长驻服务**且需 SSE/WebSocket/长连，放 Vercel 需额外适配且不利于连接数与成本。主网保持**单栈：Railway 或 Render**。 |

**决策**：  
- **主网**：**Railway** 为默认选择；若遇不可接受限制，可切换至 **Render**。二者均为「应用 + Postgres 同平台」，迁移成本可控。  
- 不在主网引入 Vercel；官网与主网在部署上完全分离。

### 3.3 官网（Frontend）：Vercel 固定

| 厂商 | 适用性 | 说明 |
|------|--------|------|
| **Vercel** | ✅ 固定 | Next.js 原生、预览/生产、边缘、Analytics 与集成成熟；与产品规划「官网区 + 产品区」分离一致。 |
| **其他** | 仅特殊需求 | 若未来需数据不出境/私有化展示，再考虑自建或他家；默认不换。 |

**决策**：**官网长期使用 Vercel**，除非出现合规/地域/成本上的硬约束再评估。

### 3.4 小结：谁跑什么

| 组件 | 托管选择 | 数据库/依赖 |
|------|----------|-------------|
| 主网（API + Gateway） | Railway（或 Render） | 同平台 Postgres；后续可加 Redis |
| 官网（Next.js） | Vercel | 可选 Postgres（Neon/Vercel Postgres/或与主网同源），不依赖 Supabase |
| 未来托管运行时 | Phase 2 再定 | 可与主网同云或专用沙箱平台 |

### 3.5 双托管是否影响「官网中的主网入口」？

**不影响。** 与 `Agent-IM-Product-Plan.md` 12.1A 的 **双区模型**一致：

| 规划要求 | 双托管下的实现 |
|----------|----------------|
| 官网区承载价值讲述、CTA、文档入口 | 仍在 **Vercel** 上的 Next.js 页面（`/`、`/docs` 等）。 |
| 产品区 / 主网入口（Ask、控制台、Start Building 等） | 仍在 **同一官网域名**下的路由（如 `/en/ask`、`/app`）；用户浏览器**先打开的是官网**，不是直接打开 Railway 地址。 |
| 主网（Hub）能力 | 由 **Railway** 上的 API 提供；官网通过 **服务端代理**（`MAINLINE_API_URL`）把请求转到主网，并注入信任头。用户通常只看到 `gaialynk.com`，不暴露主网裸 URL。 |

因此：**「主网入口」在体验上仍是官网上的入口**；Railway 只是主网的**后端托管位置**，不是「另开一个网站给用户进主网」。双托管拆的是**运行与扩展**（前端边缘 + 后端长连），不是拆**产品叙事与用户路径**。

**需注意的工程点**（与是否双托管无关，但上线前要满足）：主网需对官网域名配置 **CORS**（若有浏览器直连主网的场景）；以代理为主的路径则主要由服务端调用，对 CORS 依赖较小。自定义域名阶段建议：`www.gaialynk.com` / `gaialynk.com` 指 Vercel，`api.gaialynk.com` 指 Railway，用户路径仍是「从官网进产品」。

---

## 四、技术栈总表（与基础设施一致）

以下与 CTO skill 及现有实现对齐；基础设施选型不改变应用层技术栈。

| 层级 | 选型 | 说明 |
|------|------|------|
| **主网运行时** | Node（当前）/ 可选 Bun | 与 Hono、现有 tsx 与测试链兼容；Bun 可在兼容性验证后替代 Node。 |
| **主网框架** | Hono | 轻量、与 A2A/Node–Hub 网关形态匹配。 |
| **主网数据** | PostgreSQL + 迁移脚本 | 标准 SQL、Drizzle 或裸 pg 均可；schema 与迁移我们完全掌控。 |
| **主网缓存/队列** | Phase 0 可不加；Phase 1+ 引入 Redis 抽象 | 用于 presence、Agent Card 缓存、或事件流时再选（Railway/Render Redis 或 Upstash）。 |
| **官网** | Next.js（App Router）+ 现有栈 | 与 Vercel 最佳匹配。 |
| **身份与信任** | 自有 Trust Engine + ACTOR_TRUST_TOKEN + 会话身份 | 不依赖 Supabase Auth；未来可接 OIDC/OAuth（Clerk/Auth0 等）与租户体系。 |
| **审计与收据** | 自有存储 + 可验签结构 | 必须落在主网可控库，不做进第三方黑盒。 |

---

## 五、Supabase 关停后的具体替代

- **主网**：已采用 Railway（或 Render）自带 Postgres，无需替代动作。  
- **官网**：若曾用 Supabase 存分析/线索，可改为：  
  - 同一主网 Postgres 的独立 schema（如 `website_analytics`, `website_leads`），或  
  - Neon / Vercel Postgres 等任一代管 Postgres，连接串填入 `DATABASE_URL` 与相应 `GAIALYNK_*_STORE=postgres`。  
- 代码与文档中「Supabase」改为「Postgres（任一代管服务）」；不再保留「必须用 Supabase」的表述。

---

## 六、何时重新审视本文

在以下情况发生时，应重新做一次 CTO 级评审并更新本文：

| 触发条件 | 可能动作 |
|----------|----------|
| 企业客户明确要求数据在特定云/区域/on-prem | 评估 AWS/GCP/自建 + RDS/Cloud SQL，或私有化部署包。 |
| 主网连接数或数据量达到单实例/单 region 瓶颈 | 评估只读副本、分库分表、多 region、以及消息/事件流（Kafka/Redis Streams）。 |
| Railway/Render 政策或计费发生不可接受变化 | 启动迁移至另一家（Render↔Railway）或迁至云厂商。 |
| 合规认证（如 SOC2、等保）要求特定基础设施 | 按认证范围选定云与托管形态，并更新本文与部署文档。 |
| 托管 Agent 运行时正式立项 | 选定沙箱/运行时供应商（与主网网络与身份打通），补充进第三节表格。 |

---

## 七、对当前文档与执行的约束

- **《Staging 部署：创始人配合指引》**：已按 Railway + Vercel 编写；与本文一致，无需因「不用 Supabase」而改平台选择。  
- **《官网生产部署清单》**：应将「Supabase」表述改为「Postgres（如 Neon / Vercel Postgres / 主网同库）」并注明「本项目不依赖 Supabase，可关停其订阅」。  
- **环境清单 / 门禁**：不出现「必须使用 Supabase」的检查项；仅要求 `DATABASE_URL`（及可选 `GAIALYNK_*_STORE`）在需要持久化时指向任意可用 Postgres。

---

*文档版本：v1（CTO 长期规划）*  
*与产品规划、架构建议及商业化阶段对齐；执行层以本文为基础设施与平台选型依据，直至触发「何时重新审视」条件。*
