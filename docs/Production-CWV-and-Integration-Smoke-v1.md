# 生产 CWV 与联调验收（v1）

> 配合 `CTO-Execution-Directive-v1` §9.1（Core Web Vitals）与产品区真实 Mainline 联调。  
> 在**已绑定域名或 Vercel 生产/Preview 构建**上执行；本地 `next dev` 不作为 CWV 最终依据。

## 当前线上入口（未绑自定义域）

截至文档维护时，官网部署在 Vercel 默认域（**尚未关联 `gaialynk.com` 等自定义域**）：

- **根站点**：<https://gaialynk-a2a.vercel.app>
- **简中首页示例**：<https://gaialynk-a2a.vercel.app/zh-Hans>

Lighthouse、CrUX、联调烟测与 `NEXT_PUBLIC_SITE_URL` 均应以**当前浏览器地址栏中的生产 URL**为准；绑定正式域并 Redeploy 后，将 `SITE` 与环改变量同步改为新域即可。

## 1. 前置

| 项 | 说明 |
|----|------|
| 官网 URL | **当前**：`https://gaialynk-a2a.vercel.app`；绑域后：`https://gaialynk.com`（或 `www`） |
| Mainline | `MAINLINE_API_URL` 与 Vercel/Railway 环境一致；官网「治理测试」需 Mainline 可达时可不设 `RELEASE_GATE_SKIP_API_HEALTH` |

## 2. Core Web Vitals / Lighthouse（桌面 + 移动）

使用已安装的 Chrome，或 CLI：

```bash
# 安装（一次性）
npm i -g lighthouse

# 三语首页 + 关键落地页（绑域后把 SITE 换成正式域）
export SITE="https://gaialynk-a2a.vercel.app"
for path in "/" "/en" "/zh-Hant" "/zh-Hans" "/en/roadmap" "/en/app"; do
  lighthouse "${SITE}${path}" \
    --only-categories=performance \
    --output=json --output-path="./lighthouse-${path//\//_}.json" \
    --chrome-flags="--headless" || true
done
```

**验收参考阈值**（与 Directive T-6.4 对齐）：

- LCP &lt; 2.5s  
- CLS &lt; 0.1  
- INP &lt; 200ms（Field 数据以 CrUX / RUM 为准；Lab 用 TBT 作近似）  
- Lighthouse Performance ≥ 90（作为工程回归信号，非唯一标准）

将报告 JSON 或 HTML 存档到 `artifacts/cwv-<date>/` 便于审计。

## 3. 官网 ↔ Mainline 联调（手工烟测）

在浏览器**匿名窗口**执行：

1. **营销站**：打开 `/{locale}`，切换 EN / 繁中 / 简中，确认无裸 key、无横向滚动条。  
2. **Open App**：进入 `/{locale}/app`，未登录可打开 **Agent 目录**。  
3. **写路径**：在会话中触发发送 → 登录弹窗/跳转 → OAuth 或邮箱登录后回到原页（`return_url`）。  
4. **Consumer onboarding**：`…/app/onboarding/consumer` 可在目标时间内走完（计时以你们 PRD 为准）。  
5. **Provider onboarding**：注册 Agent → 健康检查 → 测试调用（需 Provider 角色与 Mainline 真实或 Staging 一致）。  
6. **高风险确认**：触发 `need_confirmation` 时对话流内卡片可确认/拒绝，右侧面板可切到审批/收据（若已接）。

可选：对 `GET /api/v1/conversations`、`GET /api/v1/agents` 经官网同源代理路径跑一遍 200 + JSON 形状抽检。

## 4. 自动化门禁（仓库内）

```bash
# 根目录：主线类型与 T5 API 测试
npx tsc --noEmit
npx vitest run packages/server/tests/t5-*.test.ts

# 官网（未起 Mainline 时跳过 API health）
cd packages/website && RELEASE_GATE_SKIP_API_HEALTH=1 npm run release:gate
```

## 5. 说明

当前执行环境若无法访问公网生产域（超时、证书、防火墙），以上第 2～3 节须在**可访问生产/Preview 的网络**由负责人本地或 CI 完成；本节文档作为**标准作业程序（SOP）**留存。
