# Agent IM 内部进展记录（2026-03-18）

> 文档性质：内部记录（对内同步与复盘）  
> 记录范围：本轮从 Staging 收口到 Release Gate 全绿的执行闭环

---

## 1. 当前结论

- 主线与官网 Staging 均已可用：
  - 主线：`https://gaialynk-a2a-production.up.railway.app`
  - 官网：`https://gaialynk-a2a.vercel.app/`
- 手动三连门禁 workflow 已跑通并全绿：
  - [Release gate manual (triple) #23239329455](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23239329455)
- 早期阻塞项（baseline 缺失、门禁非确定性、workflow 依赖与环境问题）已完成修复闭环。
- 当前发布判定可进入 Go 轨道（按灰度 -> 全量节奏推进）。

---

## 2. 本轮目标与达成情况

### 2.1 目标

- 完成“产品更新落地后的最终收口与上线门禁验证”。
- 保证证据链可审计（日志、artifact、可重复执行）。
- 将 No-Go/Conditional-Go 阶段的阻塞项逐项清零。

### 2.2 达成

- 已完成主线与官网的 staging 可达性验证。
- 已完成 release gate workflow 的生产化改造（可重复、可诊断、可留证）。
- 已完成 Node20 deprecation 维护项修复并验证（升级 action 版本）。

---

## 3. 关键执行链路（按时间）

1. Founder 回传主线/官网 Staging 与变量配置完成。  
2. CTO 执行首轮门禁，暴露阻塞（合同基线、网络路径、测试环境耦合等）。  
3. 主线团队完成 A1/B1/C/D 改造并合并。  
4. 新建手动三连 workflow，持续复跑并根据日志定点修复。  
5. 引入 CI Postgres service + `db:migrate`，将 `test:pg` 从 staging 数据库耦合中解耦。  
6. 修复 `postgres-integration` 与 `api-health-gate` 的契约断言偏差。  
7. 最终三连全绿，形成可追溯 artifact 证据。  
8. 单独完成 Node20 deprecation 维护项并验证成功。

---

## 4. 关键 PR 记录

- [#20](https://github.com/GaiaLynk/gaialynk-A2A/pull/20) chore: harden release gate for staging-to-go rollout  
- [#21](https://github.com/GaiaLynk/gaialynk-A2A/pull/21) hotfix: track mainline API contract baseline for CI drift  
- [#22](https://github.com/GaiaLynk/gaialynk-A2A/pull/22) hotfix: isolate preflight full suite from DATABASE_URL  
- [#23](https://github.com/GaiaLynk/gaialynk-A2A/pull/23) hotfix: isolate preflight contract checks from DATABASE_URL  
- [#24](https://github.com/GaiaLynk/gaialynk-A2A/pull/24) hotfix: run release gate test:pg on CI Postgres service  
- [#25](https://github.com/GaiaLynk/gaialynk-A2A/pull/25) hotfix: migrate CI Postgres before triple release gate  
- [#26](https://github.com/GaiaLynk/gaialynk-A2A/pull/26) fix(test): include actor_id for local-action-receipts in pg integration  
- [#27](https://github.com/GaiaLynk/gaialynk-A2A/pull/27) hotfix: install website deps in manual release gate workflow  
- [#28](https://github.com/GaiaLynk/gaialynk-A2A/pull/28) fix(website): accept reviewQueue 400 in API health gate  
- [#29](https://github.com/GaiaLynk/gaialynk-A2A/pull/29) chore(ci): opt release gate workflow into Node24 action runtime  
- [#30](https://github.com/GaiaLynk/gaialynk-A2A/pull/30) chore(ci): upgrade release-gate actions for Node24

---

## 5. 关键 Workflow 记录

- 首轮失败（用于定位 baseline 缺失）：  
  [#23237466760](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23237466760)
- 中间多轮失败（用于收敛 test/CI 环境问题）：  
  [#23237736637](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23237736637)  
  [#23237947244](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23237947244)  
  [#23238165593](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23238165593)  
  [#23238251709](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23238251709)  
  [#23238475445](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23238475445)  
  [#23238601076](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23238601076)
- 最终全绿（发布证据）：  
  [#23239329455](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23239329455)
- Node24 维护项验证运行（通过）：  
  [#23239700218](https://github.com/GaiaLynk/gaialynk-A2A/actions/runs/23239700218)

---

## 6. 本轮核心问题与解决摘要

### 6.1 合同基线缺失导致 preflight 阻断

- 问题：`docs/contracts/mainline-api-contract-baseline.v1.json` 缺失并被忽略，CI 直接 ENOENT。  
- 处理：跟踪基线文件、补 `--init-baseline`、补文档与脚本入口。  
- 结果：`contracts:drift:mainline` 恢复可重复运行。

### 6.2 测试对真实 staging DB 耦合导致非确定性

- 问题：preflight 全量测试与 contracts/checks 会受真实 `DATABASE_URL` 影响。  
- 处理：在 preflight 中隔离全量测试/contract 检查；`test:pg` 使用 CI Postgres service。  
- 结果：门禁可稳定复现，避免污染 staging 库。

### 6.3 CI workflow 运行时与依赖问题

- 问题：website build 阶段出现 `next: not found`；Node20 deprecation 警告。  
- 处理：补 `npm --prefix packages/website ci`；升级 actions 到支持 Node24 的版本。  
- 结果：workflow 稳定通过，告警清理完成。

### 6.4 API health gate 契约断言偏差

- 问题：`reviewQueue` 在缺少 actor context 时返回 400，原断言未接纳。  
- 处理：将 400 纳入 `reviewQueue` 的可接受状态。  
- 结果：health gate 与真实契约对齐。

---

## 7. 当前风险与建议

- 当前无阻塞级上线风险，但建议保持以下节奏：
  - 持续使用手动三连 workflow 作为最终放行证据入口。
  - 固化“先 migrate 再 gate”的流程，不回退。
  - 保留 staging `/health` 与 `/meta` artifact，便于审计追溯。
- 后续建议补充：
  - 24h/72h 灰度观察记录模板（错误率、延迟、审批链路、收据覆盖）。
  - release gate 失败类型与对应处理手册（Runbook）。

---

## 8. 对内结语

本轮不是“新增功能推进”，而是“上线工程化能力”的一次完整压测与修复。  
当前我们已经把门禁从“偶然可过”提升到“可重复、可定位、可审计地通过”，这是下一阶段稳定扩张的基础。

