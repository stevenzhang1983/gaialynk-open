# Phase 1 Task Package TODO

> 目标：在不破坏现有 API 契约的前提下，从内存实现平滑过渡到 PostgreSQL 优先实现，并建立稳定的本地/CI 验证闭环。

## Phase 1 映射（M1-M4）

### M1（W1-W3）：可信链路硬化

- [x] 收据签名升级：支持 Ed25519/JWS（保留 HMAC 回退）
- [x] 审计查询增强：`agent_id / actor_type / from / to`
- [x] 人审流程幂等与防重复确认：`processing_confirmation` 中间态
- [x] 风险决策可解释输出：`policy_version / policy_rule_id / explain_text`
- [x] 高风险路径与收据链路测试补齐

### M2（W4-W6）：体验与发现补强（主线接口优先）

- [x] 线程 / @ 数据结构支持（消息 `thread_id / mentions`）
- [x] 在线状态接口（会话 `presence`）
- [x] 目录基础推荐接口（`/agents/recommendations`）
- [x] 首次会话成功率指标补齐（metrics）

### M3（W7-W9）：节点可用化

- [x] 节点目录同步 + 节点中继最小闭环（`/nodes/relay/invoke`）
- [x] 节点兼容性接口（`/nodes/compatibility`）
- [x] 用量计数接口（`/usage/counters`）
- [x] 节点异常重试与离线恢复策略增强（heartbeat staleness + relay retry）

### M4（W10-W12）：增长与产品线协同

- [x] 只读脱敏接口（`/public/overview`）
- [x] 开发者元信息接口（`/meta`）
- [x] OSS vs Cloud 能力边界矩阵（docs）
- [x] 指标口径与官网入口联调（`/public/entry-events` + `/public/entry-metrics`）

## Phase 1 首个 2 周迭代拆解（执行中）

### Iteration A（Week 1）

- [x] 开源边界审计并整改（密钥与能力边界）
- [x] 收据签名升级与回退策略
- [x] 风险决策可解释字段标准化
- [x] 审计查询过滤增强

### Iteration B（Week 2）

- [x] 线程/@ 数据结构与 presence 接口
- [x] 节点最小中继闭环
- [x] 只读概览与开发者元信息接口
- [x] 官网入口线只读接口联调验收（入口指标接口已可联调）

## Task Package 1（Conversation 持久化起步）

- [x] T1: 创建任务包 TODO 文档并约定更新节奏
- [x] T2: 新增 PostgreSQL 基础接入（连接层 + schema SQL + migration 脚本）
- [x] T3: 将 `conversation` 模块迁移为 PostgreSQL 优先存储（内存回退）
- [x] T4: 调整 `app` 与相关服务调用以兼容异步 conversation 访问
- [x] T5: 补充/调整测试并完成 `typecheck + test` 验证

## Task Package 2（持久化扩展）

- [x] P2-T1: 扩展 migration，覆盖 agents/invocations/audit/receipts/nodes
- [x] P2-T2: 迁移 directory 存储为 PostgreSQL 优先（内存回退）
- [x] P2-T3: 迁移 invocation 存储为 PostgreSQL 优先（内存回退）
- [x] P2-T4: 迁移 audit/receipt 存储为 PostgreSQL 优先（内存回退）
- [x] P2-T5: 迁移 node-hub 存储为 PostgreSQL 优先（内存回退）
- [x] P2-T6: 调整 app/metrics 调用并完成 typecheck+test

## Task Package 3（PostgreSQL 集成验证）

- [x] P3-T1: 扩展 TODO，定义 PostgreSQL 集成验证任务
- [x] P3-T2: 新增 PostgreSQL 集成测试（端到端调用主路径）
- [x] P3-T3: 新增测试脚本与运行说明（`test:pg`）
- [x] P3-T4: CI 增加 PostgreSQL service job 并执行 migration + `test:pg`
- [x] P3-T5: 完成本轮验证（typecheck + test + 文档更新）

## Task Package 4（稳定性加固）

- [x] P4-T1: 扩展 TODO，定义稳定性加固任务
- [x] P4-T2: 新增 `db:reset` 与 `db:seed` 脚本
- [x] P4-T3: 新增本地一键 PostgreSQL 验证脚本（migrate + test:pg）
- [x] P4-T4: 强化 CI/分支门禁（要求 `postgres-integration` 检查）
- [x] P4-T5: 完成本轮验证并更新文档

## Task Package 5（流程收敛与一键化）

- [x] P5-T1: 重构 TODO 文档结构（任务包与变更日志分离）
- [x] P5-T2: 新增本地一键 PG 启动+迁移+种子+验证脚本
- [x] P5-T3: 将一键脚本接入 `package.json` 与 README
- [x] P5-T4: 完成本轮验证并回写日志

## 变更日志（按时间）

- 2026-03-14: 完成 T1，初始化任务包清单。
- 2026-03-14: 完成 T2，新增 DB client、migrate runner、`0001_conversation_core.sql` 与 `db:migrate` 脚本。
- 2026-03-14: 完成 T3，conversation 存储改为 PostgreSQL 优先（`DATABASE_URL` 存在时）+ 内存回退。
- 2026-03-14: 完成 T4，`app` conversation 路由改为异步调用，metrics 逻辑改为异步汇总。
- 2026-03-14: 完成 T5，`npm run typecheck` 与 `npm test` 全通过。
- 2026-03-14: 完成 P2-T1，migration 增补 agents/invocations/audit_events/receipts/nodes 表结构。
- 2026-03-14: 完成 P2-T2，directory 模块新增 async PostgreSQL 路径并保留内存回退。
- 2026-03-14: 完成 P2-T3，invocation 模块新增 async PostgreSQL 路径并保留内存回退。
- 2026-03-14: 完成 P2-T4，audit/receipt 模块新增 async PostgreSQL 路径并保留内存回退。
- 2026-03-14: 完成 P2-T5，node-hub 模块新增 async PostgreSQL 路径并保留内存回退。
- 2026-03-14: 完成 P2-T6，app/metrics 切换 async 调用并通过 typecheck + 全量测试。
- 2026-03-14: 完成 P3-T1，定义 PostgreSQL 集成验证任务清单。
- 2026-03-14: 完成 P3-T2，新增 postgres-integration 端到端测试覆盖 trusted invocation 主路径。
- 2026-03-14: 完成 P3-T3，新增 `test:pg` 脚本并补充 README 的 PostgreSQL 集成测试说明。
- 2026-03-14: 完成 P3-T4，CI 新增 postgres-integration job（PostgreSQL service + migration + test:pg）。
- 2026-03-14: 完成 P3-T5，验证通过（typecheck + 全量测试），`test:pg` 在无 DATABASE_URL 环境下按预期 skip。
- 2026-03-14: 完成 P4-T1，定义稳定性加固任务清单。
- 2026-03-14: 完成 P4-T2，新增 `db:reset` 与 `db:seed` 脚本并接入 package scripts。
- 2026-03-14: 完成 P4-T3，新增 `verify:pg:local` 一键本地 PostgreSQL 验证脚本。
- 2026-03-14: 完成 P4-T4，main 分支门禁新增 `postgres-integration` 必需检查。
- 2026-03-14: 完成 P4-T5，验证通过（typecheck + test + test:pg + verify script syntax check）。
- 2026-03-14: 完成 P5-T1，重构 TODO 文档结构并统一维护格式。

- 2026-03-14: 完成 P5-T2，新增 `bootstrap-pg-local.sh` 一键启动 Postgres+迁移+重置+种子+验证。

- 2026-03-14: 完成 P5-T3，新增 `bootstrap:pg:local` script 并补充 README 一键初始化说明。

- 2026-03-14: 完成 P5-T4，验证通过（bootstrap/verify 脚本语法 + typecheck + 全量测试）。
- 2026-03-15: 完成 M1 收敛项：收据签名升级（Ed25519/JWS + HMAC fallback）、审计过滤增强、风险决策可解释输出。
- 2026-03-15: 完成 M2 接口项：消息线程/@字段、presence、目录推荐与相关测试。
- 2026-03-15: 完成 M3 接口项：relay invoke、compatibility、usage counters、nodes health（离线判定+重试策略）。
- 2026-03-15: 完成 M4 入口协同项：`/public/entry-events` + `/public/entry-metrics` + `public overview/meta` 对齐。
