# Agent IM 主线-官网联调演练记录模板（v1）

日期：____-__-__  
参与人：主线后端 / 官网入口 / QA  
环境：`dev | staging | preprod`

---

## 1. 演练目标

验证三条核心漏斗链路在当前主线契约下可稳定跑通，且不需要临时新增接口字段。

核心链路：

1. `Start Building -> docs`
2. `Book a Demo`
3. `Join Waitlist`

---

## 2. 演练前检查

- [ ] 主线服务可用（API 健康检查通过）
- [ ] 官网入口环境可访问
- [ ] 本轮契约文档已对齐：
  - `Agent-IM-Mainline-API-Contract-Matrix-v1.md`
  - `Agent-IM-Mainline-Readonly-Desensitized-Fields-v1.md`
- [ ] CI 门禁均为绿色

---

## 3. 链路一：Start Building -> docs

### 操作步骤

1. 在首页点击 `Start Building`
2. 跳转 docs 入口并完成页面访问

### 预期事件

- `page_view`（home）
- `cta_click`（`cta_id=start_building`）
- `docs_click`

### 验收记录

- 是否成功：`通过 / 失败`
- 失败现象：
- 对应时间窗口：
- `GET /api/v1/public/entry-metrics` 核对值：
  - `conversion_baseline.page_view_home`
  - `conversion_baseline.cta_click_start_building`
  - `conversion_baseline.docs_click`

---

## 4. 链路二：Book a Demo

### 操作步骤

1. 在首页点击 `Book a Demo`
2. 完成 demo 提交流程（或触发 demo 提交事件）

### 预期事件

- `cta_click`（`cta_id=book_demo`）
- `demo_click`
- `demo_submit`（若有提交）

### 验收记录

- 是否成功：`通过 / 失败`
- 失败现象：
- 对应时间窗口：
- `GET /api/v1/public/entry-metrics` 核对值：
  - `conversion_baseline.demo_submit`
  - `locale_breakdown.<locale>.demo_click`（如适用）

---

## 5. 链路三：Join Waitlist

### 操作步骤

1. 在首页点击 `Join Waitlist`
2. 完成 waitlist 提交流程（或触发 waitlist 提交事件）

### 预期事件

- `cta_click`（`cta_id=join_waitlist`）
- `waitlist_submit`

### 验收记录

- 是否成功：`通过 / 失败`
- 失败现象：
- 对应时间窗口：
- `GET /api/v1/public/entry-metrics` 核对值：
  - `conversion_baseline.waitlist_submit`
  - `locale_breakdown.<locale>.waitlist_submit`（如适用）

---

## 6. 问题记录与处理

| 编号 | 问题描述 | 影响链路 | 严重级别 | 责任方 | 处理状态 |
|---|---|---|---|---|---|
| 1 |  |  |  |  |  |
| 2 |  |  |  |  |  |

---

## 7. 本次联调结论

- 结论：`通过 / 有条件通过 / 不通过`
- 是否存在临时接口需求：`无 / 有（需单独评审）`
- 下次复测时间：

签字确认：

- 主线后端：________
- 官网入口：________
- QA：________

