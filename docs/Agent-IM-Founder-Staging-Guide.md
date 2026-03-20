# Staging 部署：创始人配合指引（零基础版）

> 本文是 **CTO 需要你介入时** 的唯一操作手册：按顺序做，做到某一步卡住或做完一步，都可以把「我做到第 X 步 / 卡在 Y」发给我，我会根据你的进度继续推进或给你下一步指引。  
> 目标：拿到「主线 Staging 地址」和「官网 Staging 地址」，并填好环境变量，以便 CTO 跑通三连门禁并完成上线判定。

---

## 一、你需要提前准备的

| 准备项 | 说明 |
|--------|------|
| **GitHub 账号** | 代码仓库在该账号下（或你有该仓库的访问权限）。后面会用 GitHub 登录 Railway 和 Vercel。 |
| **约 30 分钟** | 第一次按指引做建议预留半小时，中间可能需等待部署完成。 |
| **能打开** | https://railway.app 、 https://vercel.com 、本仓库的 GitHub 页面。 |

---

## 二、整体流程（你先做哪块、后做哪块）

1. **先部署主线（后端）**：在 Railway 上创建项目、挂上数据库、部署代码 → 得到「主线 Staging 地址」和 `DATABASE_URL`。  
2. **生成并保管一个密钥**：用我提供的命令生成 `ACTOR_TRUST_TOKEN`，同一串要填进 Railway 和后面的 Vercel。  
3. **再部署官网（前端）**：在 Vercel 上创建项目、填环境变量（其中主线地址和密钥用上面两步的）→ 得到「官网 Staging 地址」。  
4. **把结果发给我**：发我「主线 Staging 地址」「官网 Staging 地址」以及「按指引变量已填好」，我就可以跑门禁并给出 Go/No-Go。

下面按步骤写，每一步都写清楚：**你要在哪里点、填什么、怎么确认**。

---

## 三、第一步：部署主线（Railway）

### 3.1 注册 / 登录 Railway

1. 浏览器打开：**https://railway.app**  
2. 点右上角 **Login**，选 **Login with GitHub**。  
3. 按页面提示授权 Railway 访问你的 GitHub（若弹出权限选择，勾选包含本仓库的组织/账号）。  
4. 登录成功后应进入 Railway 的 **Dashboard**（仪表盘）。

**确认**：页面左上或顶部能看到 Railway 的 Logo，且没有报错。

---

### 3.2 新建项目并添加数据库

1. 在 Dashboard 里点 **New Project**（或 **+ New Project**）。  
2. 在弹出内容里选 **Deploy from GitHub repo**（或 **Empty Project** 再单独添加；下面按「从 GitHub 部署」写）。  
3. 若第一次用 Railway 连 GitHub：  
   - 会提示 **Configure GitHub App** 或 **Install GitHub App**，点进去。  
   - 在 GitHub 里选择「只选这个仓库」或「All repositories」（按你习惯），然后 **Install**。  
   - 回到 Railway，再点 **New Project** → **Deploy from GitHub repo**。  
4. 在仓库列表里找到 **gaialynk.com**（或你放代码的仓库名），点选它。  
5. Railway 会创建一个新项目并开始部署。先不要管部署是否成功，我们先把数据库加上。  
6. 在项目页面里点 **+ New**（或 **Add Service**），选 **Database** → **PostgreSQL**。  
7. 等几秒，Railway 会创建一个 Postgres 服务，并自动生成连接串。

**确认**：项目里能看到两个「块」：一个是从 GitHub 来的服务（名字可能是仓库名），一个是 **PostgreSQL**。

---

### 3.3 把数据库连到「主线服务」

1. 点你刚创建的那个 **GitHub 部署的服务**（不是 Postgres 那个），进入该服务的详情。  
2. 点 **Variables**（或 **Settings** → **Variables**）。  
3. 若 Railway 已自动注入 `DATABASE_URL`（有时在「Variables」里会显示来自 Postgres 的引用），则不用自己填；若没有：  
   - 点 **PostgreSQL** 那个服务 → **Variables** 或 **Connect** 标签。  
   - 找到 **Connection URL** 或 **DATABASE_URL**，复制整串（形如 `postgresql://postgres:xxx@xxx.railway.app:5432/railway`）。  
   - 回到 **GitHub 部署的那个服务** → **Variables**，点 **+ New Variable**，名称填 `DATABASE_URL`，值粘贴刚才复制的串，保存。  
4. 再添加一个变量：名称 `ACTOR_TRUST_TOKEN`，值见下一步「生成 ACTOR_TRUST_TOKEN」。

**确认**：该服务下 Variables 里至少有 `DATABASE_URL` 和 `ACTOR_TRUST_TOKEN`。

---

### 3.4 生成 ACTOR_TRUST_TOKEN（你本机执行一次）

在你本机（已拉取本仓库的电脑）打开「终端」：

- **Mac**：打开「终端」应用（Terminal），或 VS Code / Cursor 里的终端。  
- **Windows**：打开「命令提示符」或 PowerShell，或 VS Code 里的终端。

在终端里执行（复制整行，粘贴到终端后回车）：

```bash
cd /Users/stevenzhang/gaialynk.com && node scripts/generate-staging-token.mjs
```

（若你的仓库不在 `/Users/stevenzhang/gaialynk.com`，请把路径改成你电脑上仓库的路径。）

终端会打出一串**很长的英文字母+数字**。  
**整串复制**（不要带空格或换行），然后：

1. 回到 Railway → 你的主线服务 → **Variables**。  
2. 若还没加过 `ACTOR_TRUST_TOKEN`：点 **+ New Variable**，名称填 `ACTOR_TRUST_TOKEN`，值粘贴这一串，保存。  
3. **把这串妥善保存**（例如记在备忘录里），后面在 Vercel 填 `MAINLINE_ACTOR_TRUST_TOKEN` 时要填**同一串**。

**确认**：Railway 该服务的 Variables 里已有 `DATABASE_URL` 和 `ACTOR_TRUST_TOKEN`。

---

### 3.5 让主线用「仓库根」的 Dockerfile 部署（重要）

Railway 默认可能用「自动检测」的方式部署。我们要明确用**仓库根目录的 Dockerfile** 来部署主线。

1. 在你从 GitHub 部署的**那个服务**里，点 **Settings**（设置）。  
2. 找到 **Root Directory**、**Builder** 或 **Build / Deploy** 相关设置：  
   - **Root Directory**：留空（表示用仓库根）。  
   - **Builder** 或 **Build Method**：若有选项，选 **Dockerfile**（不要选 Nixpacks 或 Auto）。  
   - **Dockerfile Path** 或 **Dockerfile**：若有这一项，填 `Dockerfile` 或 `./Dockerfile`。  
   - **Build Command**：留空即可（由 Dockerfile 决定）。  
3. **保存**。若 Railway 自动触发重新部署，等部署完成（状态变为 Success / Live）。  
4. 若部署失败：点进该次 Deploy 的 **View Logs**，把**最后几行报错**复制发给我，我会根据报错给你下一步。

**确认**：该服务 Deployments 里最新一次是成功状态。

---

### 3.6 给主线服务一个对外访问地址（拿到 MAINLINE_BASE_URL）

1. 仍在**该主线服务**的详情页，点 **Settings**。  
2. 找到 **Networking** 或 **Public Networking** 或 **Generate Domain**。  
3. 点 **Generate Domain**（或 **Add Public Domain**），Railway 会分配一个地址，形如：  
   `https://gaialynk-com-production-xxxx.up.railway.app`  
4. 复制这个**完整地址**（要带 `https://`，末尾不要加斜杠）。  
   - 这就是 **MAINLINE_BASE_URL**（也是后面官网要填的 **MAINLINE_API_URL**）。  
5. 在浏览器新开一个标签，访问：  
   `你复制的地址/api/v1/health`  
   若页面显示类似 `{"status":"ok"}` 或一段 JSON，说明主线已对外可访问。

**确认**：你有一个「主线 Staging 地址」，且 `/api/v1/health` 能打开、有正常内容。

---

### 3.7 主线第一次部署后：跑一次数据库迁移（可选但建议）

Railway 部署成功后，数据库里还没有表结构，需要跑一次「迁移」。

1. 在 Railway 项目里，点你的**主线服务**（GitHub 部署的那个）。  
2. 找 **Shell**、**Console**、**Run Command** 或 **One-off Command** 这类入口（不同版本文案可能不同）。  
3. 若**有 Shell**：在 Shell 里执行（一行一行复制）：  
   ```bash
   npm run db:migrate
   ```  
   若提示 `npm: command not found`，可试：  
   ```bash
   npx run db:migrate
   ```  
   或只运行迁移脚本（开发可给你一条备用命令）。  
4. 若**没有 Shell**：把「我找不到 Shell / Run Command」发给我，我会给你替代做法（例如在本地用你的 `DATABASE_URL` 跑一次迁移，或提供一条可粘贴到 Railway 的启动前命令）。

**确认**：迁移无报错（或你已把报错原文发给我）。

---

## 四、第二步：部署官网（Vercel，完整嵌入版）

> **本章前提**：你已按第三章完成 **Railway 主線部署、Postgres 已创建、本机已用 `DATABASE_PUBLIC_URL` 跑通 `db:migrate`、主線 `/api/v1/health` 可用、已填 `ACTOR_TRUST_TOKEN`。**若你还没做完第三章，请先回去做完再进本章。**

### 4.1 本章开始时你手上应该已经有的东西

| 项目 | 从哪里拿 |
|------|----------|
| **主線對外地址** | 3.6 的 `MAINLINE_BASE_URL`（形如 `https://xxx.up.railway.app`） |
| **主線密鑰** | 3.4 的 `ACTOR_TRUST_TOKEN`（與 Railway 主線 Variables 里一致） |
| **Postgres 外網連線串** | Railway **Postgres** 服務 → **Variables** → 複製 **`DATABASE_PUBLIC_URL`**（與你跑遷移時用的是同一類；**不要用** `postgres.railway.internal`） |
| **GitHub** | 能登入 Vercel 並授權本倉庫 |

---

### 4.2 在 Vercel 创建项目并连上仓库

1. 打开 **https://vercel.com**。  
2. 用 **GitHub** 登录。  
3. 登录后点 **Add New…** → **Project**。  
4. 在仓库列表里找到 **gaialynk.com**（或你實際的仓库名），点 **Import**。  
5. 若看不到仓库，点 **Configure GitHub App**，把该仓库授权给 Vercel。  
6. 进入 **Configure Project** 页面后，先确认它确实是当前仓库。

**确认**：你能看到仓库名、分支名，而且是要部署的那个仓库。

---

### 4.3 设置 Root Directory 和构建方式

本项目是 **Monorepo**，官网代码在子目录里，所以这里很关键。

1. 在 **Configure Project** 页面找到 **Root Directory**。  
2. 点 **Edit**，填：`packages/website`。  
3. **Framework Preset** 保持 **Next.js**。  
4. **Build Command**：通常留空即可；如果你看到需要手动填，可以用 `npm run build`。  
5. **Output Directory**：留空。  
6. **Install Command**：留空或 `npm install`。  
7. 先**不要**点 Deploy，先把环境变量填好。

**确认**：Root Directory 是 `packages/website`，不是仓库根，也不是别的子目录。

---

### 4.4 先填环境变量，再首次 Deploy

在 **Environment Variables** 里添加变量，**Environment** 选 **Production**（需要 Preview 可一并勾选）。

#### 第一组：連主線（必填）

| 变量名 | 值 |
|--------|-----|
| `MAINLINE_API_URL` | 與 3.6 的 `MAINLINE_BASE_URL` **完全相同**（含 `https://`，末尾無斜杠） |
| `MAINLINE_ACTOR_TRUST_TOKEN` | 與 Railway 主線里的 `ACTOR_TRUST_TOKEN` **完全相同** |

#### 第二組：官網自身網址（首次可先佔位）

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SITE_URL` | **優先**：在 **Settings → Domains** 看 Vercel 已分配的 `https://xxx.vercel.app`，填完整 URL。**若尚未顯示**：可先填你預備綁定的正式域（如 `https://gaialynk.com`）；首 Deploy 成功後若實際先用 `*.vercel.app`，請按 **4.6** 改成 Visit 上的真實網址並 Redeploy。 |

#### 第三組：Postgres（你已有一個 Railway Postgres，**建議一併填上**）

主線和官網可以**共用同一個 Railway Postgres**（表名不同，一般不衝突）。Vercel 在雲上訪問庫，必須用**外網連線串**：

| 变量名 | 值 |
|--------|-----|
| `DATABASE_URL` | Railway **Postgres** → **Variables** → **`DATABASE_PUBLIC_URL`** 的完整值（與你本機跑 `npm run db:migrate` 時用的是同一條） |

填了 `DATABASE_URL` 後，建議同時加上（讓分析/線索能落庫；若暫不需要可只填上面兩組也能部署）：

| 变量名 | 值 |
|--------|-----|
| `GAIALYNK_ANALYTICS_STORE` | `postgres` |
| `GAIALYNK_ANALYTICS_PG_TABLE` | `website_analytics_events` |
| `GAIALYNK_LEADS_STORE` | `postgres` |
| `GAIALYNK_LEADS_EXPORT_KEY` | 自設一串隨機字串（32 位以上） |
| `GAIALYNK_ANALYTICS_HEALTH_KEY` | 自設一串隨機字串（32 位以上） |

> **說明**：若你**刻意不想**官網寫庫（只做靜態展示），可暫不填 `DATABASE_URL` 與上述 `GAIALYNK_*`，官網仍能構建上線，但持久化分析/線索不可用。一般建議與主線共用同一 `DATABASE_PUBLIC_URL`。

> **建表**：若開發要求官網分析/線索表，需在該庫執行遷移或 SQL；你可把需求轉給開發，或按倉庫文檔執行官網側 migrate。

**确认**：`MAINLINE_API_URL` / `MAINLINE_ACTOR_TRUST_TOKEN` 無錯；`DATABASE_URL` 若已填，必須是 **PUBLIC** 連線串，不是 `*.railway.internal`。

---

### 4.5 第一次 Deploy

1. 环境变量填好后，点 **Deploy**。  
2. 等 Vercel 构建完成。  
3. 成功后会出现一个 **Visit** 链接，形如：  
   `https://gaialynk-com-xxx.vercel.app`

**确认**：Visit 能打開首頁，即使某些功能暂时还没连通也没关系。

---

### 4.6 拿到官网 Staging 地址后，立即做一次 Redeploy

1. 把 `NEXT_PUBLIC_SITE_URL` 改成你刚拿到的 Visit 地址。  
2. 回到项目的 **Deployments**。  
3. 找到最新部署，点右边 **⋯** 或 **Redeploy**。  
4. 重新部署一次，讓 `NEXT_PUBLIC_SITE_URL` 生效。

**确认**：最新一次部署是成功的，而且打开 Visit 仍然正常。

---

### 4.7 绑定官网域名（可延後）

若暫時只用 **`*.vercel.app`** 作 Staging、最後再上正式域，**可先跳過整節**；完成 4.1–4.6 後即可把該 Visit 網址當作「官網 Staging 地址」交給 CTO 跑門禁（見 4.10、第五節）。

若現在就要把官网连到 `gaialynk.com`，继续下面步骤。

#### 在 Vercel 里加域名

1. 进入项目 **Settings** → **Domains**。  
2. 添加 `gaialynk.com`。  
3. 需要的话再添加 `www.gaialynk.com`。  
4. Vercel 会告诉你该去 DNS 那边填什么记录。

#### 到域名服务商那里改 DNS

1. 登录你买域名的地方（Cloudflare、NameSilo、阿里云等）。  
2. 找到 DNS 解析页面。  
3. 按 Vercel 要求添加记录：  
   - 根域通常是 **CNAME** 或 **A 记录**  
   - `www` 通常是 **CNAME**  
4. 保存后等待生效。  
5. 回 Vercel 的 Domains 页面等状态变成 **Valid**。

**确认**：`https://gaialynk.com` 能打开官网，而且浏览器地址栏有锁。

---

### 4.8 （可選）單獨庫或 Neon

**未執行可略過**，後續再考慮即可。若你希望官網數據與主線庫**物理隔離**，可另建一個 Postgres（如 Neon），把該庫的 **外網連線串**填到 Vercel 的 `DATABASE_URL`，並同樣配置 `GAIALYNK_*_STORE=postgres`。預設路線仍是：**與第三章同一個 Railway Postgres + `DATABASE_PUBLIC_URL`**。

---

### 4.9 上线前你要自己点一遍的页面

把下面網址里的 **`你的官網域名`** 換成：**尚未綁定域名時用 `https://xxx.vercel.app`；已綁定後用 `https://gaialynk.com`**。

- 首页：`你的官網域名/en`
- Ask：`你的官網域名/en/ask`
- 恢复与 HITL：`你的官網域名/en/recovery-hitl`
- 订阅任务：`你的官網域名/en/subscriptions`
- 连接器治理：`你的官網域名/en/connectors-governance`
- 开发者：`你的官網域名/en/developers`
- Sitemap：`你的官網域名/sitemap.xml`
- Robots：`你的官網域名/robots.txt`

若某頁報錯，把**網址 + 現象**發給我。

---

### 4.10 官网部署完成的判断

- Vercel 項目已建立，`Root Directory` 為 `packages/website`
- 已填 `MAINLINE_API_URL`、`MAINLINE_ACTOR_TRUST_TOKEN`
- （建議）已填 `DATABASE_URL` = Railway Postgres 的 **`DATABASE_PUBLIC_URL`** 及對應 `GAIALYNK_*`
- 首次 Deploy 成功；`NEXT_PUBLIC_SITE_URL` 已改為真實 Visit 並 Redeploy（4.6）
- **未綁自定義域名時**：以 `https://<專案>.vercel.app` 作為官網 Staging，**仍視為本階段完成**；4.7 可之後再補。
- **已上線正式域時**：`gaialynk.com`（等）已 Valid；關鍵頁可打開

---

## 五、第三步：把结果发给我（CTO）

请你把下面**三样**发给我（可直接复制填空）：

1. **主线 Staging 地址（MAINLINE_BASE_URL）**  
   例如：`https://gaialynk-a2a-production.up.railway.app`

2. **官网 Staging 地址**  
   例如：`https://gaialynk-com-xxx.vercel.app`

3. **变量已按指引填好**  
   你只需回复一句（按實際填寫調整）：  
   「Railway 主線已填 `DATABASE_URL`、`ACTOR_TRUST_TOKEN`；Vercel 已填 `MAINLINE_API_URL`、`MAINLINE_ACTOR_TRUST_TOKEN`、`NEXT_PUBLIC_SITE_URL`（及建議的 `DATABASE_URL` = Postgres `DATABASE_PUBLIC_URL` 與 `GAIALYNK_*`）。」

**不需要**把 `DATABASE_URL` 或 `ACTOR_TRUST_TOKEN` 的原文发给我（安全考虑）。  
我只需要确认「你有主线地址、官网地址，且变量已填」，然後我會用你給的主線/官网地址在门禁环境里配置并跑三连门禁。  

#### 進度範例（Founder 填寫後可複製給 CTO）

以下為**結構範例**（實際 URL 以你環境為準；官網 Staging 未綁域時用 `https://xxx.vercel.app`，**不要**強求結尾斜杠一致）：

1. **MAINLINE_BASE_URL**：`https://gaialynk-a2a-production.up.railway.app`  
2. **官網 Staging**：`https://gaialynk-a2a.vercel.app`  
3. **變數**：Railway 主線已填 `DATABASE_URL`、`ACTOR_TRUST_TOKEN`；Vercel 已填 `MAINLINE_API_URL`、`MAINLINE_ACTOR_TRUST_TOKEN`、`NEXT_PUBLIC_SITE_URL`（及建議的 `DATABASE_URL` = Postgres `DATABASE_PUBLIC_URL` 與 `GAIALYNK_*`）。  
4. **備註**（可選）：4.7 綁定自定義域名延後；4.8 獨庫暫未執行。

---

## 六、卡住时怎么办

- **不知道点哪里**：告诉我「我做到第 X 步（例如 4.4 / 4.7），卡在 Y」，我按你的界面逐步指给你。  
- **报错**：把**完整报错原文**或截图发给我，并说明你卡在官网部署的哪一步。  
- **没有终端**：告诉我「我没有终端」或「我不会运行命令」，我会改成纯网页点选版指导。

---

## 七、自检清单（你做完可打勾）

- [ ] 已用 GitHub 登录 Vercel，并创建官网项目  
- [ ] Root Directory 设为 `packages/website`  
- [ ] 已填 `MAINLINE_API_URL`、`MAINLINE_ACTOR_TRUST_TOKEN`、`NEXT_PUBLIC_SITE_URL`  
- [ ] 第一轮 Deploy 成功，Visit 可打开  
- [ ] 已做一次 Redeploy，让 `NEXT_PUBLIC_SITE_URL` 生效  
- [ ] 已绑定自定義域名，**或**已約定延後（Staging 用 `*.vercel.app`）  
- [ ] 浏览器能打开官网关键页面  
- [ ] （建議）`DATABASE_URL` 已填 Railway Postgres 的 `DATABASE_PUBLIC_URL`，並按需填 `GAIALYNK_*`  
- [ ] 已把「主线 Staging 地址」「官网 Staging 地址」「变量已按指引填好」发给我  

若 4.7 延後，第七章中「綁域」一項勾選**延後 Staging** 即可；其餘完成並把第五節三樣發給 CTO 後，我會接手跑三連門禁並給出 Go/No-Go 結論。
