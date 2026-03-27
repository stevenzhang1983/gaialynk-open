# GaiaLynk V1.3 / V1.3.1 部署 Runbook（Railway 主网 + Vercel 官网 · 单副本 MVP）

> **版本**：v1.3  
> **日期**：2026-03-25（v1.3：执行产物 — 根 `.env.example`、公开部署指南、CI 官网生产构建、CONTRIBUTING 纪律、Connector Releases URL）  
> **适用代码仓**：[GaiaLynk/gaialynk-A2A](https://github.com/GaiaLynk/gaialynk-A2A)（open core）  
> **目标形态**：单副本主网（Railway）+ 托管 PostgreSQL + 单实例 Redis；官网 Vercel；**首周必须提供 Connector 可下载安装包**。  
> **执行角色**：下文「部署负责人」指接手上线的技术负责人（可为 CTO / 外包 SRE）；「创始人」指需提供账号、密钥、域名 DNS、厂商控制台配置的一方。

本文档按**时间顺序**排列：每一步写清**部署负责人要做什么**，以及**该步需要创始人提供哪些外部材料**。  
若某步被阻塞，应停止后续步骤直至材料到齐，避免在生产留下半配置状态。

**GitHub 定位**：[GaiaLynk/gaialynk-A2A](https://github.com/GaiaLynk/gaialynk-A2A) 是项目 **可开源部分** 的社区与对外展示载体；**任何 push 到该仓库的内容均视为可能永久公开**。部署负责人必须在日常操作中 **严格区分** 可开源资产与闭源资产（见 **§0.3**）。

---

## 0. 范围与假设

### 0.0 域名策略（分阶段 · 已拍板）

| 阶段 | 官网对外 URL | 说明 |
|------|----------------|------|
| **现阶段（MVP 先跑通）** | Vercel 自动分配的 **`https://<project>.vercel.app`**（或团队别名域名） | 不依赖 `www.gaialynk.com` DNS；先把构建、`MAINLINE_API_URL`、OAuth 回跳、冒烟跑通。 |
| **收尾（可最后做）** | **`https://www.gaialynk.com`** | 在 Vercel 绑定自定义域 + DNS CNAME/A；随后更新 `NEXT_PUBLIC_SITE_URL`、对外文案与 **OAuth 成功回跳**（若写死旧 URL 需同步改 Railway/Vercel 环境变量及 Google/Notion 控制台）。 |

**主网 API**：可继续使用 **Railway 默认公网域名**（`*.up.railway.app` 等）直至你方单独决定 **API 自定义域**（例如 `api.gaialynk.com`）；与官网域名解耦。Vercel 侧 **`MAINLINE_API_URL` 始终指向当前可用的主网 HTTPS Base URL（无尾斜杠）**。

### 0.1 交付范围

| 组件 | 托管 | 说明 |
|------|------|------|
| 主网 API + WebSocket（含实时、桌面 Connector 信令等） | Railway 单服务实例 | 与仓库根目录 `Dockerfile` 或等价启动命令一致 |
| PostgreSQL | Railway Plugin / 托管实例 | 与主网同区域优先 |
| Redis | Railway Plugin / 托管实例 | V1.3.1 起 WS 扇出、闸门、通知去重等依赖 Redis；**单副本也建议必配** |
| 官网（Next.js） | Vercel | 生产构建需 `MAINLINE_API_URL`（见 `packages/website/scripts/check-env.mjs`） |
| 桌面 Connector 安装包 | **GitHub Releases（推荐）** 或对象存储 + 官网静态链接 | 首周上线硬性要求；签名与渠道见 §9 |

### 0.2 明确不纳入本文执行细节

- 多副本水平扩展与 K8s（MVP 单副本不展开）。
- 企业 SSO、专有硬件（M7）等规格外项。

### 0.3 开源（GitHub）与闭源边界 — 部署与日常纪律（强制）

> **原则**：与仓库 README「[Open Core Boundary](https://github.com/GaiaLynk/gaialynk-A2A#open-core-boundary)」一致 —— **协议向协作、信任基线、可验证原语** 等属于 open core；**托管云运维细节、商业选配能力、生产密钥与可识别生产数据** 等 **不得** 作为「顺便提交」进入公开仓库。

#### 允许进入 GitHub（`gaialynk-A2A`）的典型内容

- **应用与库源码**：`packages/server`、`packages/website`、`packages/shared`、`packages/connector` 等与社区协作、可审计协议实现直接相关的代码（不含内嵌密钥）。  
- **公开文档**：架构说明、贡献指南、公开 API/契约说明、`docs/contracts` 等 **不含** 生产连接串与内网主机名。  
- **可复现的本地/CI 配置**：`Dockerfile`、`docker-compose.yml`、示例 `env` **仅含占位符**（如 `DATABASE_URL=postgres://…` 用文档说明替代真实值）。  
- **GitHub Actions workflow 文件本身**：步骤逻辑可公开；**密钥仅通过 `Secrets` 注入**，不得在 YAML 中写死。  
- **Connector 发布**：公开 **已签名的发行版制品** 挂在 Releases 属于正常开源分发；**签名私钥、公证口令、内部分发渠道凭证** 永不上库。

#### 禁止进入 GitHub（闭源或仅限私有仓 / 密钥管理）

- **一切密钥与等价物**：`JWT_SECRET`、`DATABASE_URL`、生产 `REDIS_URL`、`CONNECTOR_TOKEN_ENCRYPTION_KEY`、`DESKTOP_CONNECTOR_PAIRING_SECRET`、`EXTERNAL_RECEIPT_SECRET`、OAuth Client **Secret**、邮件 SMTP 密码、第三方 API Key、**Apple/Microsoft 签名证书与私钥**、任何 **base64 私钥材料**。  
- **含真实密钥的文件**：`.env`、`.env.production`、下载的 `*.pem`、`.p12`、内网 VPN 配置等 —— 确保在 **`.gitignore`** 中且 **从未提交**。  
- **可复原生产或用户的敏感信息**：生产 DB 转储、含邮箱/手机号的导出、未脱敏日志、内网 API 绝对地址若涉及未公开基础设施且具攻击性面。  
- **明确划在 open core 外的商业/托管代码**：按产品策略应保留在 **私有仓库** 的模块；不得「临时」合并进 public 默认分支。  
- **本 Runbook 若向公开仓同步**：须 **删改** 创始人特定域名、内部时间表、或任何可组合出攻击面的细节；**推荐** 将完整 Runbook 保留在 **私有** 文档仓或团队空间，公开仓仅放 **脱敏后的通用部署说明**。

#### 部署过程中的操作纪律（部署负责人自检）

1. **Push 前**：`git diff` + `git status` 确认无意外新增密钥文件；必要时使用 `git-secrets` / `trufflehog` 或团队等价扫描。  
2. **Issue / PR / Discussion**：不粘贴环境变量；需要复现时给 **占位符** 或私发密钥渠道（密码管理器共享），**禁止** 在公开线程回复真实 Secret。  
3. **Vercel / Railway 面板**：截图发社区前 **打码** 项目 ID、域名、变量名可留、**值必须遮**。  
4. **分叉贡献者**：审查外部 PR 是否引入「指向闭源端点」或硬编码生产 URL；合并前按 open core 边界评估。  
5. **若误推密钥**：立即 **轮换** 该密钥（视为已泄漏），并按 GitHub 指南处理历史记录（`git filter-repo` 等）— 轮换优先于仅删 commit。

---

## 1. 冻结版本与发布分支

### 1.1 部署负责人

1. 在 GitHub 上确认用于上线的 **commit SHA** 或 **tag**（例如 `v1.3.1`），与内部验收通过版本一致。  
2. 将 Railway、Vercel 的部署源均指向该版本（分支或 tag），避免「控制台最新 main」与预期不一致。  
3. 记录本次上线的 **迁移文件最大序号**（仓库内 `packages/server/src/infra/db/migrations/*.sql`），写入内部发布备注。

### 1.2 需要创始人提供

- [ ] GitHub 上 **merge 权限** 或 **由你方指定专人** 打 tag / 保护分支策略说明（若部署负责人无写权限）。  
- [ ] 决策：生产是否 **仅允许 tag 部署**（推荐）。

---

## 2. Railway：创建或核对项目结构

### 2.1 部署负责人

1. 在 Railway 创建（或打开已有）**Project**，建议至少包含：  
   - **Service：Mainline**（Web 服务）  
   - **PostgreSQL**  
   - **Redis**  
2. 将 **PostgreSQL**、**Redis** 的 **连接串变量** 注入 Mainline Service（Railway 通常以 `DATABASE_URL`、`REDIS_URL` 形式引用；名称需与代码一致，见 §5）。  
3. 确认 Mainline Service **对外生成公网 URL**（临时域名即可，后续在 §6 绑自定义域）。

### 2.2 需要创始人提供

- [ ] Railway **项目访问权限**（部署负责人账号加入 Project）。  
- [ ] 若使用团队账单：**支付方式 / 额度** 已就绪，避免上线途中停机。

---

## 3. 主网构建与启动命令（与仓库对齐）

### 3.1 当前 open core 仓库现状（部署负责人必读）

- 根目录 [`Dockerfile`](https://github.com/GaiaLynk/gaialynk-A2A/blob/main/Dockerfile) 使用 `CMD ["npm", "run", "dev:server"]`，即 **`node --import tsx` 直接跑 TypeScript 入口**（`packages/server/src/index.ts`）。  
- **MVP 可接受**：先按此上线以缩短路径。  
- **后续优化（非首周阻塞）**：改为 `tsc` 构建 + `node dist`，减小镜像、加快冷启动；可在首周稳定后排期。

### 3.2 部署负责人

1. Railway Mainline Service：  
   - **Build**：使用仓库根 Dockerfile，或 Railway 的 Nixpacks 配置为等价 `npm ci` + `npm run dev:server`。  
   - **Start**：与 Dockerfile `CMD` 一致即可。  
2. 设置环境变量 **`PORT`**：Railway 通常注入 `PORT`，确保应用读取 `process.env.PORT`（代码已支持）。  
3. 设置 **`NODE_ENV=production`**（用于 JWT 等生产路径；**勿在测试命令里误用 production**）。

### 3.2 需要创始人提供

- 无（纯工程配置）。若 Dockerfile 需调整，由部署负责人提 PR 至 [gaialynk-A2A](https://github.com/GaiaLynk/gaialynk-A2A)。

---

## 4. 数据库迁移（首次上线关键路径）

### 4.1 部署负责人

1. **在指向生产 PostgreSQL 的环境**执行（仅上线窗口、且已备份后）：  
   ```bash
   DATABASE_URL='postgresql://…' npm run db:migrate
   ```  
2. 迁移脚本位于 `packages/server/src/infra/db/migrate.ts`，行为为**按文件名顺序执行整目录 SQL**（当前实现**无** `schema_migrations` 版本表）。  
   - **首次空库**：从 `0001` 顺序执行至最新。  
   - **已存在旧库**：必须由部署负责人评估是否与历史手工变更冲突；冲突时**禁止**盲跑，需 DBA/开发会诊。  
3. 迁移成功后，用主网健康检查或最小 API（如 `GET /api/v1/conversations` 在允许匿名探测的配置下）验证服务可连库。

### 4.2 需要创始人提供

- [ ] **生产 `DATABASE_URL`**（或由 Railway 自动注入，创始人确认仅授权给可信成员）。  
- [ ] 上线窗口 **允许短暂只读/维护** 的决策（若库已有用户数据，迁移风险更高）。

### 4.3 技术债提醒（写入运维备注）

- 长期应在仓库内实现 **带版本的迁移表**，避免每次全量重放 SQL 的生产风险。首周 MVP 可在 Runbook 中登记为 **P1 技术债**。

---

## 5. 主网环境变量清单（Railway）

### 5.1 部署负责人

在 Railway Mainline Service 中配置下列变量（名称以代码为准；值为示例说明）。

| 变量 | 必需性 | 说明 |
|------|--------|------|
| `DATABASE_URL` | **必需** | PostgreSQL 连接串 |
| `REDIS_URL` | **强烈建议 / 与 V1.3.1 能力等价必需** | 无则部分实时/闸门/去重行为退化或异常，以当前代码为准 |
| `JWT_SECRET` | **必需（生产）** | ≥16 字符；用于 Access Token 与部分 OAuth state 回退 |
| `CONNECTOR_TOKEN_ENCRYPTION_KEY` | **连接器生产必需** | 云连接器令牌加密；长度与格式需符合 `token-crypto.ts` 要求 |
| `CONNECTOR_OAUTH_STATE_SECRET` | 建议 | 不填则回退 `JWT_SECRET` |
| `EXTERNAL_RECEIPT_SECRET` | 建议 | 不填则使用内置默认值（**生产应显式设置强随机**） |
| `DESKTOP_CONNECTOR_PAIRING_SECRET` | **桌面 Connector 生产必需** | 配对码/设备信任相关 |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | 若开 Google 日历 | 与 Google Cloud Console 一致 |
| `GOOGLE_OAUTH_REDIRECT_URI` | 若开 Google | 必须与 Console 中授权重定向 URI **完全一致** |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` | 若开 Notion | 与 Notion Integration 配置一致 |
| `NOTION_OAUTH_REDIRECT_URI` | 若开 Notion | 必须与 Notion 后台一致 |
| `CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL` | 建议 | OAuth 完成后回到产品/官网的 URL（由产品设计） |
| `NOTION_MOCK` | 生产 | 必须为 **不开启** 或 `false`（生产真实 OAuth） |
| `CONNECTOR_UPLOAD_DIR` | 视部署 | 默认数据目录；无持久卷时需评估上传功能是否可用 |
| `FAIL_FAST_CONFIG` / `REQUIRE_DATABASE_URL` | 可选 | 需要启动时强校验 DB 时设为 `1` |
| `DATA_RETENTION_JOB_ENABLED` | 可选 | 开启后 24h 周期归档任务；单副本注意仅一处运行 |
| `DISABLE_ORCHESTRATION_SCHEDULER` | 可选 | 多实例前用于避免重复调度；**单副本一般不设** |

部署负责人应 grep 仓库 `process.env.` 做一次 **diff**，与上表合并为「本项目生产 env 真源」（单页表）。

### 5.2 需要创始人提供

- [ ] **JWT_SECRET**、**CONNECTOR_TOKEN_ENCRYPTION_KEY**、**EXTERNAL_RECEIPT_SECRET**、**DESKTOP_CONNECTOR_PAIRING_SECRET**：强随机生成后**仅存入 Railway**（可用密码管理器生成）。  
- [ ] **Google Cloud**：OAuth Client ID/Secret、已配置的 **Authorized redirect URIs**（与 `GOOGLE_OAUTH_REDIRECT_URI` 一致）。  
- [ ] **Notion**：OAuth Client ID/Secret、Redirect URI。  
- [ ] 决策：**CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL** 指向官网哪条路径（如产品内页或带 query 的回跳）。

---

## 6. 自定义域名与 TLS（主网 API）

### 6.1 部署负责人

1. **MVP 阶段**：可直接使用 Railway 提供的 **默认 HTTPS 域名** 作为主网 Base URL，写入内部真源与 Vercel 的 `MAINLINE_API_URL`。  
2. **若启用 API 自定义域**（可选，可与 `www.gaialynk.com` 收尾并行或更晚）：在 Railway Mainline Service 绑定（例如 `api.gaialynk.com`），按指引在 DNS 添加 **CNAME / A**。  
3. 等待证书签发后，用 `curl` 验证 HTTPS 与 WebSocket 升级路径（见 §7）。  
4. 将当前生效的 **`https://…`（无尾斜杠）** 记录为 **主网 Base URL 真源**；若 URL 变更，**必须**同步更新 Vercel `MAINLINE_API_URL` 及 OAuth 相关白名单/回跳（见 §10）。

### 6.2 需要创始人提供

- [ ] **API 自定义域**（若不用默认域名）：DNS 管理权限 + 记录配置。  
- [ ] 若沿用 **仅 Railway 默认域**：无 DNS 亦可先行上线（与 §0.0 一致）。

---

## 7. WebSocket 与 CORS（单副本 MVP 仍必测）

### 7.1 部署负责人

1. 确认浏览器端产品使用的 **WebSocket URL** 与 **API 同域** 或已在服务端允许的来源内（以 `app.ts` / gateway 配置为准）。  
2. 从官网或本地浏览器连生产，验证：连接建立、收发一条业务消息（如实时相关功能）。  
3. 若 WebSocket 走 **wss**，确认证书链完整、**无混合内容**。

### 7.2 需要创始人提供

- [ ] 若存在 **Cloudflare** 等代理：**WebSocket 代理已开启**（橙色云场景下注意兼容）。

---

## 8. Vercel：官网构建与部署

### 8.1 部署负责人

1. Vercel Project 指向 [gaialynk-A2A](https://github.com/GaiaLynk/gaialynk-A2A) 中 **`packages/website`** 目录（Monorepo root 选仓库根，**Root Directory** 设为 `packages/website`）。  
2. **生产环境变量**（至少）：  
   - `NODE_ENV=production`  
   - **`MAINLINE_API_URL`** = 当前主网 Base URL（§6，一般为 **Railway HTTPS 默认域**，**无尾斜杠**）  
3. 生产 build 会执行 `scripts/check-env.mjs`：**缺少 `MAINLINE_API_URL` 时 build 失败**（设计如此）。  
4. **`NEXT_PUBLIC_SITE_URL`**：  
   - **现阶段**：设为 Vercel 部署后的 **`https://<project>.vercel.app`**（与浏览器实际访问一致，用于绝对链接/OG/回跳等）。  
   - **收尾**：改为 **`https://www.gaialynk.com`**，并重新部署一次官网。  
5. 部署成功后跑 **官网 release 门禁**（与 README 一致）：  
   - 主网已可达时：`npm run release:gate:website`（在 CI 或本地，指向生产 API）。  
   - 主网未起时仅 CI：`RELEASE_GATE_SKIP_API_HEALTH=1`（**不得用于生产发布签字**）。

### 8.2 需要创始人提供

- [ ] Vercel **项目权限**。  
- [ ] **`www.gaialynk.com` 绑定（最后做）**：DNS 指向 Vercel；绑定完成后通知部署负责人更新 `NEXT_PUBLIC_SITE_URL` 与 OAuth 回跳（§10）。  
- [ ] 若使用 **PostHog / 分析**：对应 **Project API Key** 与隐私文案已对齐 Cookie 横幅策略。

### 8.3 收尾：绑定 `www.gaialynk.com`（可整段最后执行）

1. Vercel → Domains → 添加 `www.gaialynk.com`，按提示配置 DNS。  
2. 证书就绪后，将 **`NEXT_PUBLIC_SITE_URL`** 更新为 `https://www.gaialynk.com` 并 **Redeploy**。  
3. 若 `CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL` 或第三方控制台里曾写死 `*.vercel.app`，**逐项改为**新官网 URL 或通配策略允许的路径。  
4. 回归：首页、登录、OAuth 回产品、分享链接。

---

## 9. 首周 Connector 下载（硬性）

### 9.1 产品与合规前提（创始人 + 产品）

- [ ] **下载页文案**：版本号、平台（macOS/Windows）、校验方式（SHA256）、**威胁模型摘要链接**（对内文档或官网安全页）。  
- [ ] **Apple / Microsoft 签名与公证**：创始人账号、证书、CI 中 **secrets**（由部署负责人配置 GitHub Actions）。  
- [ ] **单一可信下载源**：推荐 [GitHub Releases](https://github.com/GaiaLynk/gaialynk-A2A/releases) 挂附件；官网仅链到该源，避免多源分叉。

### 9.2 部署负责人

1. 在 CI（GitHub Actions）或使用本地 **受控机** 执行 `npm run build:connector`（Tauri），产出各平台安装包。  
2. 计算 **SHA256** 并写入 Release notes。  
3. 创建 **GitHub Release**（tag 与主网/官网版本策略一致）。  
4. 在官网增加 **固定入口**（例如 `/download/connector` 或帮助中心链接），指向 Release。  
5. 验证 **端到端**：安装 → 配对 → Web 触发 → 主网审计/收据可查（与规格 §1.1 C.3 一致）。

### 9.3 需要创始人提供

- [ ] **Apple Developer**、**Microsoft 代码签名** 证书与密码（通过 CI Secret 注入，不邮件明文）。  
- [ ] GitHub **Releases 写权限**。  
- [ ] 对外 **支持渠道**（邮箱或 Discord）用于首周安装问题。

---

## 10. OAuth 与回跳 URL 联调（生产前在 Staging 复现）

### 10.1 部署负责人

1. **强烈建议** 另建 Railway **Staging** 服务 + 独立 DB + 独立 OAuth Client，先完整跑通 Google / Notion。  
2. 将 Staging 的 `*_REDIRECT_URI` 写入 Google / Notion 控制台。  
3. 生产切换时，在厂商控制台 **新增** 生产 Redirect URI，**禁止** 删除 Staging URI（直至验证完成）。

### 10.2 需要创始人提供

- [ ] Google Cloud / Notion 控制台 **管理员权限** 或配合操作窗口。

---

## 11. 上线当日顺序（Checklist）

### 11.1 部署负责人执行顺序

1. **备份**生产 PostgreSQL（托管面板或 `pg_dump`）。  
2. **迁移**（§4）。  
3. **部署 / 重启** Railway Mainline，确认 **健康检查**（代码中含依赖探测逻辑，见 `app.ts` Launch Closure 相关注释）。  
4. **注入/核对** 全部 §5 环境变量，**重启** 使进程加载。  
5. **Vercel 生产部署**（§8），`MAINLINE_API_URL` 指向当前生产主网 URL；`NEXT_PUBLIC_SITE_URL` 先用 **`*.vercel.app`**（§0.0）。  
6. **自定义域 DNS**：**非阻塞**；若仅 MVP，可跳过直至执行 §8.3（`www.gaialynk.com`）。  
7. **冒烟**：注册/登录 → 发消息 → 目录抽样 →（若启用）连接器 OAuth 各一条 → Connector 下载安装抽检。  
8. **GitHub Release** 发布 Connector 制品（§9）。  
9. 记录 **发布备注**：版本、迁移最高序号、操作人、时间、**当时官网 URL（vercel.app 或 www）**。

### 11.2 需要创始人到场

- [ ] 上线窗口 **拍板**（低峰时段）。  
- [ ] **Twitter/官网** 是否需要同步公告（可选）。

---

## 12. 回滚

### 12.1 部署负责人

- **应用回滚**：Railway / Vercel 回滚到上一部署单元。  
- **数据库**：若无逆向迁移脚本，**禁止**自动回滚 schema；以 **备份恢复** 或 **向前热修** 为准。  
- **密钥**：若已泄漏，轮换 `JWT_SECRET` 会使用户登录态失效，需提前告知。

### 12.2 需要创始人提供

- [ ] 业务决策：**可接受的停机时间** 与 **数据丢失 RPO**（恢复备份可能丢最近写入）。

---

## 13. 创始人外部材料汇总表（按优先级）

| 优先级 | 材料 | 用于环节 |
|--------|------|----------|
| P0 | Railway、Vercel、GitHub 账号权限 | §1–§2、§8–§9 |
| P0 | 生产 `DATABASE_URL` / `REDIS_URL`（或确认 Railway 注入） | §2、§4、§5 |
| P0 | 强随机 `JWT_SECRET`、`CONNECTOR_TOKEN_ENCRYPTION_KEY`、`DESKTOP_CONNECTOR_PAIRING_SECRET`、`EXTERNAL_RECEIPT_SECRET` | §5 |
| P0 | Apple/Microsoft 签名凭证 + GitHub Actions Secrets | §9 |
| P1 | Google OAuth Client + Redirect URI（可先填 `*.vercel.app` 路径，切 www 时再追加/替换） | §5、§10 |
| P1 | Notion OAuth Client + Redirect URI | §5、§10 |
| P1 | `CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL` 产品决策（建议与当前 `NEXT_PUBLIC_SITE_URL` 一致） | §5 |
| P2 | **最后做**：`www.gaialynk.com` DNS + Vercel 绑定（§8.3）；可选 API 自定义域（§6） | §6、§8 |
| P2 | Cloudflare / CDN / 邮件 DNS（若使用） | §7、邮件相关 |

---

## 14. 参考链接

- Open core 仓库：[https://github.com/GaiaLynk/gaialynk-A2A](https://github.com/GaiaLynk/gaialynk-A2A)  
- **对外（可同步至 GitHub 的脱敏部署说明）**：[`docs/deploy-railway-vercel-open.md`](./deploy-railway-vercel-open.md)  
- 根目录 **占位符环境模板**：[`/.env.example`](../.env.example)（勿提交真实密钥）  
- 仓库 README：**[Open Core Boundary](https://github.com/GaiaLynk/gaialynk-A2A#open-core-boundary)**（与 §0.3 部署纪律一致；GitHub 即对外社区，push 前按边界自检）。  
- 仓库 README 中的本地启动与门禁命令（`npm run release:gate:website` 等）与本文 §8、§11 一致。  
- 产品规格仍以内部 `CTO-V1.3-Product-and-Web-Release-Spec.md` 及 V1.3.1 执行指令为需求真源（**默认不进入** public 仓库，除非经脱敏与法务/产品批准）；本文仅覆盖 **Railway + Vercel + 首周 Connector** 的部署落地顺序。

---

*本文档由 CTO 侧起草，用于创始人与部署负责人对齐；执行中若平台 UI 变更，以各服务商最新文档为准。*
