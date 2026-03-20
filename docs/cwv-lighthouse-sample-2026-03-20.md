# Lighthouse 样本（Lab，2026-03-20）

**站点**：`https://gaialynk-a2a.vercel.app`（未绑自定义域）  
**命令**：`cd packages/website && npm run lighthouse:cwv`（报告目录：`artifacts/cwv-lighthouse/`，默认不提交）

以下为 **Performance** 类别、本地 CLI 单次采样（与真实用户 CrUX 有偏差）。

| 页面 | Performance 分数 | LCP (ms) | CLS |
|------|------------------|----------|-----|
| `/zh-Hans` | 0.91 | 2790 | 0 |
| `/en` | 0.96 | 2733 | 0 |
| `/zh-Hant/roadmap` | 0.95 | 2044 | 0 |

**解读**：Directive 目标为 LCP &lt; 2.5s。本次采样中 **`/zh-Hant/roadmap` 达标**；首页 `/en`、`/zh-Hans` 的 LCP 在 **2.73–2.79s** 区间，略超阈值，可作为下一迭代优化项（图片优先级、Hero 子资源、字体子集等）。各页 CLS 均为 0，表现良好。

> 绑域、CDN 与缓存策略变化后请重新跑 `npm run lighthouse:cwv` 并更新本表或替换为新日期的证据文档。
