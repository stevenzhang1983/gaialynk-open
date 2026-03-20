# GaiaLynk 组件风格规范（T-1.3）

> 官网区与产品区 **共用** 本规范与 `effects.css` Token；仅 **组合与密度** 不同（营销页更强调玻璃/渐变边/品牌光晕，产品区更偏信息密度与可扫读）。

## 1. 设计锚点

| 来源 | 作用 |
|------|------|
| **T-1.1 / T-1.2** | 色彩与字体为唯一真相源；组件不得引入未 Token 化的色值或第三套字体。 |
| **impeccable.style**（`webapp-03-terminaltechnicalcrisp_light`） | **气质参考**：状态可读、工程感、可追溯（如 `[ACTIVE]`、`//` 注释式辅助文案、等宽数字）。**不**把全站改成纯等宽 UI；仅在 **Badge、代码块、状态行、产品区底部栏** 等场景局部借用。 |
| **本规范** | **视觉主方向**：毛玻璃壳层、渐变描边卡片、品牌色环境光阴影、有层次质感的表面。 |

**禁止**：同一页面混用多种圆角尺度、多种无关阴影语言、或「一半 Material 一半营销玻璃」的拼凑感。

---

## 2. 全局几何与质感

### 2.1 圆角

| Token | 值 | 用于 |
|-------|-----|------|
| `--radius-xs` | 4px | Badge、紧凑 Tag |
| `--radius-sm` | 6px | Input、Icon button |
| `--radius-md` | 8px | Button、Toast、菜单项 |
| `--radius-lg` | 12px | Card、Dialog content 容器 |
| `--radius-xl` | 16px | 首页 Feature 大卡、营销区块 |
| `--radius-full` | pill | 主 CTA（Open App）、筛选 Chip |

### 2.2 阴影（`effects.css`）

| Token | 用途 |
|-------|------|
| `shadow-brand-sm` / `shadow-brand-md` | 主按钮、关键 CTA、Hero 内重点卡片 hover |
| `shadow-brand-glow` | 装饰性光晕（少用，每屏 ≤1 处） |
| `shadow-card` | 默认卡片 resting |
| `shadow-card-hover` | 可点击卡片 hover / focus-visible |
| `shadow-elevated` | Modal、大型抽屉 |

### 2.3 毛玻璃

用于：**官网顶栏（滚动后）**、**悬浮通知条**、**部分营销卡片衬底**。

```css
background: var(--glass-bg);
backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
border-bottom: 1px solid var(--glass-border); /* 顶栏示例 */
```

暗色模式毛玻璃底略深，避免正文对比掉级；亮色模式提高 blur，避免发灰。

### 2.4 渐变描边（「有质感的卡片」）

**结构**：内层实底 + 外层渐变作 border。

```css
/* 概念：padding-box 为 surface，border-box 为 gradient */
border: 1px solid transparent;
background:
  linear-gradient(rgb(var(--color-surface)) 0 0) padding-box,
  var(--gradient-brand) border-box;
border-radius: var(--radius-lg);
```

亮色模式将 `color-surface` 换为卡片对应 surface。**hover** 可略增强 `shadow-card-hover`，勿再加粗渐变边以免噪。

---

## 3. 按钮（Button）

| 变体 | 视觉 | 使用场景 |
|------|------|----------|
| **Primary** | `bg-primary` + `text-primary-foreground`，`rounded-md` 或营销主 CTA 用 `rounded-full` + `px-6`；可选 `shadow-brand-sm`，hover 加深一度 | 单一主行动 |
| **Secondary** | `bg-secondary/15` + `border border-border` + `text-foreground`，hover `bg-surface-raised` | 次行动 |
| **Accent** | `bg-accent` + `text-accent-foreground`；**每屏最多 1～2 个** | Open App、限时转化 |
| **Ghost** | 透明底 + `text-foreground-secondary`，hover `bg-muted` | 工具栏、表格行内操作 |
| **Outline** | `border border-primary/40` + `text-primary`，hover `bg-primary/10` | 开发者向次要 CTA |
| **Destructive** | `bg-destructive` + `text-destructive-foreground` | 删除、不可逆 |

- **高度**：常规 40px（`h-10`），大营销 44–48px。  
- **焦点**：`ring-2 ring-ring ring-offset-2 ring-offset-background`（与 shadcn 一致）。  
- **禁用**：`opacity-50 pointer-events-none`，不改变色相。

---

## 4. 卡片（Card）

| 类型 | 说明 |
|------|------|
| **Standard** | `bg-card` + `border border-border` + `rounded-lg` + `shadow-card` |
| **Elevated** | 同上 + `shadow-card-hover` on hover；用于可点区块 |
| **Gradient border** | §2.4 + 内边距 `p-6`～`p-8`；用于首页能力块、定价高亮列 |
| **Glass inset** | 大色块上的次级信息：`glass-bg` + 弱 border，字色保持 `foreground` / `foreground-secondary` |

卡片内标题：`font-display` + `text-h3` 或 `text-subheading`；正文 `text-body` + `leading-body-relaxed`。

---

## 5. 输入框（Input / Textarea）

- **背景**：`bg-input-background`，**边框**：`border-input`，`rounded-sm`。  
- **Focus**：`ring-2 ring-ring`，边框 `border-primary/50`。  
- **Placeholder**：`text-muted-foreground`。  
- **错误**：边框 `border-destructive`，下方 `text-destructive text-caption`。  
- **只读/禁用**：`bg-muted` + `text-muted-foreground`。

产品区 IM 输入条可适当增大 `radius-md` 与内边距，仍用同一 Token。

---

## 6. 导航（Nav）

| 区域 | 规范 |
|------|------|
| **官网顶栏** | 初始可与背景融合；**滚动后** → 毛玻璃 §2.3 + 底部分割线；Logo + 链接触发 `text-foreground`，默认 `text-foreground-secondary`，**当前页** `text-primary` 或底边 2px `bg-primary`。 |
| **产品顶栏** | 实色 `bg-surface` 或浅玻璃；与官网共享字重与 hover，不共享布局。 |
| **侧栏项** | `rounded-md`，active：`bg-surface-raised` + `text-primary` 左边条 3px |

---

## 7. Tag vs Badge

| | Tag | Badge |
|--|-----|-------|
| **语义** | 分类、过滤、只读标签 | 状态、数量、需要一眼扫读的状态 |
| **样式** | `rounded-full` 或 `rounded-xs`，`bg-muted` + `text-muted-foreground`，小号 `text-caption` | `rounded-xs`，语义色底 + foreground；可配合 **等宽** 数字（impeccable 工程感） |
| **示例** | `Beta`、`SDK` | `[ACTIVE]`、`verified`、`3 pending` |

---

## 8. Modal（Dialog）

- **遮罩**：`bg-[var(--overlay-scrim)]`，可 `backdrop-blur-sm`。  
- **容器**：`rounded-lg` + `shadow-elevated` + `bg-card` + `border border-border`。  
- **标题**：`text-h3 font-display`；关闭按钮 Ghost icon。  
- **页脚**：主按钮右对齐（LTR）；移动端全宽堆叠。

---

## 9. Toast

- **位置**：桌面右下；移动底中或右上。  
- **容器**：`rounded-md` + `shadow-card` + `border`；成功/警告/错误用对应语义色 **左边 4px 条** + 中性底，避免整屏彩色块。  
- **文案**：一行主信息 + 可选次要一行 `text-caption`。  
- **自动消失**：4–6s；错误类可延长或需手动关。

---

## 10. 动效（简要）

- **时长**：150–220ms 交互反馈；营销 hover 可 250ms。  
- **曲线**：`cubic-bezier(0.4, 0, 0.2, 1)`。  
- **尊重**：`prefers-reduced-motion: reduce` 时关闭位移/缩放，保留透明度变化。

---

## 11. shadcn/ui 映射（品牌化定制方向）

| shadcn 组件 | 定制要点 |
|-------------|----------|
| Button | 增加 Accent、Outline primary；营销页 CTA 用 `rounded-full` |
| Card | 默认加 `shadow-card`；变体 `gradient-border` / `glass` |
| Input | 严格 `input-background` / `ring` |
| Dialog | `overlay-scrim` + `shadow-elevated` |
| Toast | 左边语义条 |
| Badge | 对齐 §7 尺寸与圆角 |

---

## 12. 亮色 / 暗色验收清单（设计侧）

- [ ] 所有组件在 `:root` 与 `[data-theme="light"]` 下对比度仍满足 T-1.1 要求。  
- [ ] 毛玻璃在两种模式下边缘清晰、不发脏。  
- [ ] 渐变描边在亮色下不过曝，暗色下不过闷。  
- [ ] 同一视口内圆角、阴影层级一致，无「拼凑感」。

---

## 13. 交付对照（CTO T-1.3）

| 交付物 | 路径 |
|--------|------|
| 组件风格规范（本文） | `design-tokens/COMPONENT-STYLES.md` |
| 效果 Token | `design-tokens/effects.css` |
| Storybook / 组件库实现 | 后续迭代（按共享 shadcn 变体落地） |
