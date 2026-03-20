# GaiaLynk 色彩使用规范（T-1.1）

官网区 `(marketing)` 与产品区 `(product)/app` **共用同一套 CSS 变量与 Tailwind 颜色名**，差异仅在于布局与组件组合，不得 fork 另一套色板。

## 设计方向

| 维度 | 说明 |
|------|------|
| 基底 | 深空色（蓝黑倾向，非纯灰/纯黑） |
| 品牌色 | 冷调蓝绿（青→松石绿渐变意象） |
| 强调 | 高对比 Accent（琥珀），与主色区分层级 |

## Token 一览

### 背景与表面

| Token | Tailwind 示例 | 使用场景 |
|-------|---------------|----------|
| `background` | `bg-background` | 页面最底层、全屏底 |
| `background-subtle` | `bg-background-subtle` | 极弱分区、条纹底 |
| `surface` | `bg-surface` | 卡片、面板、列表行默认底 |
| `surface-raised` | `bg-surface-raised` | 悬停/选中抬升、二级容器 |
| `surface-overlay` | `bg-surface-overlay` | Modal 下衬、抽屉背景层 |
| `card` | `bg-card` | 与 surface 同级语义，兼容旧代码 |

**官网区**：Hero 下可用 `gradient-brand-subtle` 或 `background-subtle` 做层次。  
**产品区**：IM 三栏中侧栏/主区用 `surface` / `surface-raised` 区分线程与消息区。

### 边框

| Token | Tailwind | 场景 |
|-------|----------|------|
| `border` | `border-border` | 默认描边、输入框 |
| `border-strong` | `border-border-strong` | 聚焦、拖拽目标 |
| `border-subtle` | `border-border-subtle` | 分割线、弱网格 |

### 文本

| Token | Tailwind | 场景 |
|-------|----------|------|
| `foreground` | `text-foreground` | 正文、标题 |
| `foreground-secondary` | `text-foreground-secondary` | 副标题、说明 |
| `muted` | `bg-muted` | 次级底、代码块衬底、`hover:bg-muted` |
| `muted-foreground` | `text-muted-foreground` | 占位、元数据、禁用态文案（勿用 `text-muted`，已统一为此前缀） |

暗色模式下以上组合相对 `background` 按 **WCAG AA**（正文 4.5:1）校准；大面积彩色底上勿用 `muted-foreground`，应改用 `primary-foreground` / `accent-foreground` 等。

### 品牌色

| Token | Tailwind | 场景 |
|-------|----------|------|
| `primary` | `bg-primary` `text-primary` | 主按钮、链接、选中态、Logo 延展 |
| `primary-foreground` | `text-primary-foreground` | 主按钮上的文字（暗底上为主色块时） |
| `secondary` | `bg-secondary` | 次按钮、标签、进度条填充 |
| `secondary-foreground` | `text-secondary-foreground` | 深色 secondary 底上的字 |
| `accent` | `bg-accent` | **高注意力** CTA、限时标签、关键徽章 |
| `accent-foreground` | `text-accent-foreground` | Accent 底上的字 |

**规则**：同一屏面上 `accent` 仅用于 1～2 个最高优先级动作；其余用 `primary` / `secondary`。

### 渐变

| 变量 | 场景 |
|------|------|
| `var(--gradient-brand)` | Hero 标题下划线、营销页区块头、空状态插画背景 |
| `var(--gradient-brand-subtle)` | 大区块弱渐变底，不抢正文 |

使用示例：`style={{ background: 'var(--gradient-brand)' }}` 或任意 utility + `@apply` 封装。

### 语义色

| Token | 含义 | 典型用法 |
|-------|------|----------|
| `success` / `success-foreground` | 成功 | Toast、Badge、表单校验通过 |
| `warning` / `warning-foreground` | 警告 | 配额、降级、需注意 |
| `destructive` / `destructive-foreground` | 错误/危险 | 删除、校验失败、阻断操作 |
| `info` / `info-foreground` | 信息 | 提示条、中性通知 |

语义色 **不得单独传达状态**（需配合图标或文案），以满足色觉无障碍。

### 其他

| Token | 场景 |
|-------|------|
| `ring` | `ring-ring` 聚焦环 |
| `input` / `input-background` | 表单边框与输入区底色 |

## 亮色模式

根节点设置 `data-theme="light"` 后，同名 Token 切换为浅色表；组件无需改类名。

## 与 Logo 的关系

主色 `primary` 在色相上接近既有天际青/松石绿系，与深空底形成「可信基础设施 + 冷静科技感」；Accent 琥珀不参与 Logo，仅用于界面层级跳跃。

## 验收对照（T-1.1）

- [x] 主色与常见 GaiaLynk 青色系 Logo 协调  
- [x] 暗色正文/次文本相对背景满足 AA 目标  
- [x] 官网与产品区共用 `design-tokens/colors.css` + Tailwind extend

## 关联：组件风格（T-1.3）

形状、阴影、毛玻璃、渐变描边见 **`COMPONENT-STYLES.md`** 与 **`effects.css`**，色彩仍仅以本文 Token 为准。  
