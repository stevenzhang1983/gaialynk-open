# GaiaLynk 字体系统使用说明（T-1.2）

## 字体选型

| 层级 | 英文字体 | 中文（简/繁） |
|------|-----------|----------------|
| Hero / H1–H3 | **Syne**（600–800） | **Noto Sans SC / TC**（与西文混排时接在西文栈之后） |
| 正文 / UI / caption | **Plus Jakarta Sans**（400–600） | 同上 |

中文与西文同一行时：浏览器按字形回退，拉丁走 Jakarta/Syne，CJK 走 Noto 或系统黑体，基线由字体自身与 `line-height` 统一约束。

## 加载策略（Next.js `next/font`）

- 文件：`packages/website/src/lib/fonts.ts`
- **Syne + Plus Jakarta Sans**：默认预加载，保证首屏英文标题与正文尽快有品牌字形。
- **Noto Sans SC / TC**：`preload: false` + `display: swap`，避免大体积 CJK 阻塞 FCP；首屏可先系统字体，再平滑替换为 Noto。

## CSS Token（`design-tokens/typography.css`）

- 字号：`--text-caption` … `--text-hero`（展示级多为 `clamp`）
- 行高：`--leading-*`
- 字重角色：`--font-weight-regular` … `--font-weight-display`

## 繁简切换

- **`(marketing)` / `(product)` / `PageShell` 根节点**（按路由 `locale` 设置 `data-cjk-prefer`）：主内容区字体栈正确；根 `layout` 不再读 `headers()`，以便官网静态预渲染（T-6.4）。
- **Cookie 条**等根级兄弟节点若不在上述壳内，可能短暂使用 `:root` 默认栈（通常为简体偏置英文回退）。

取值：`sc`（简体）| `tc`（繁体）| `latin`（英文站）。

## Tailwind

- `font-display` — 标题栈
- `font-sans` — 正文栈
- `text-hero` / `text-h1` … `text-caption` — 语义字号
- 组合示例：`className="font-display text-hero font-bold tracking-display"`

## 验收对照（CTO T-1.2）

- Hero：使用 `text-hero` + `font-display` + 容器 `max-w-*` 控制换行。
- 混排：依赖栈顺序 + `--leading-body-relaxed` 类 `leading-body-relaxed`。
- FCP：CJK `preload: false`；展示/正文拉丁字体优先加载。
