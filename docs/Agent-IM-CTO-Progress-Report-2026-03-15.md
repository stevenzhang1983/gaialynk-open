# Agent IM 主线开发进展报告（提交 CTO）

日期：2026-03-15  
汇报人：主线后端工程（Agent）

---

## 1. 执行范围与原则

- 本报告仅覆盖主线工程（`packages/server`），不包含 website 线新增工作。
- 严格对齐 `docs/Agent-IM-Mainline-Review-and-Phase1-Execution-Plan.md` 的 M2-M4 目标与 DoD。
- 执行原则：优先“可持续使用基础设施”的稳定性与可验证性，避免范围扩张。

---

## 2. 今日核心产出（截至目前）

## 2.1 M2（体验与发现补强）

- 推荐接口风控逻辑修正：`GET /api/v1/agents/recommendations`
  - 不再仅按首个 capability 判断风险。
  - 改为按“与 intent 匹配能力优先、全能力回退”的风险上限过滤。
  - 结果：避免混合能力 Agent 在低风险筛选中误入推荐列表。

- 错误结构一致性增强：
  - 对无效请求体统一输出 `400 validation_error`（含结构化 `details`）。
  - 提升上层调用方对错误的可预测性与可处理性。

## 2.2 M3（节点可用化）

- 节点健康查询参数强校验：`GET /api/v1/nodes/health`
  - `stale_after_sec` 限制为 `1..86400`，非法入参返回 `400 invalid_nodes_health_query`。

- 中继调用边界行为回归完善：`POST /api/v1/nodes/relay/invoke`
  - 覆盖 `node_not_found`（404）、`agent_not_found`（404）、`agent_node_mismatch`（400）等关键边界错误码一致性。

- 目录同步缺失节点路径确认：`POST /api/v1/nodes/sync-directory`
  - node 不存在时返回 `404 node_not_found`，并已纳入回归测试。

## 2.3 M4（增长与产品线协同）

- 入口埋点接口健壮性增强：`POST /api/v1/public/entry-events`
  - 非法 JSON 与非法 payload 均稳定返回 `400 invalid_public_entry_event`（避免潜在 500）。
  - 兼容旧客户端：缺失 `referrer/timestamp` 自动补全默认值。

- 入口指标口径修正：`GET /api/v1/public/entry-metrics`
  - `page_view_home` 仅统计首页 PV（`home` / `/en` / `/zh-Hant` / `/zh-Hans`）。
  - `cta_click_start_building` 仅统计 `cta_id=start_building`。

- 用量计数接口增强（为后续免费额度/计费做准备）：`GET /api/v1/usage/counters`
  - 新增 `window_from`、`event_type_counts`。
  - `window_days` 强校验（`1..365`），非法入参返回 `400 invalid_usage_counters_query`。

- 开发者元信息增强：`GET /api/v1/meta`
  - 新增 `node_protocol` 与 `quickstart_endpoints`，降低接入摩擦。

- 审计查询参数校验补齐：`GET /api/v1/audit-events`
  - 新增查询 schema 校验，非法参数返回 `400 invalid_audit_events_query`。

---

## 3. 测试与验证证据

- 全量测试：`npm test` 通过（`48 passed | 1 skipped`）
- 类型检查：`npm run typecheck` 通过
- 本轮改动文件 lint：无错误

新增/强化测试覆盖（主线）：

- `packages/server/tests/phase1-mainline-apis.test.ts`
  - 推荐风控修正回归
  - 入口事件错误码与兼容性回归
  - 节点中继错误码一致性回归
  - confirm 无效 payload 的 `validation_error` 回归
- `packages/server/tests/response-format-consistency.test.ts`
  - 无效请求体统一 `400 validation_error` 回归
- `packages/server/tests/audit-events-query.test.ts`
  - 审计查询参数非法时 `400 invalid_audit_events_query` 回归

---

## 4. 与 Phase 1 目标对齐结论

- M2：已从“有接口”推进到“可预测行为 + 风险过滤准确性”。
- M3：已从“可调用”推进到“异常边界可观测且错误码稳定”。
- M4：已从“可联调”推进到“指标口径更一致、外部输入更稳健”。

当前判断：主线 M2-M4 进入可交付收口状态，后续重点应转向发布前的最终整理与集成验收节奏。

---

## 5. 风险与待决事项

- 仍有并行 website 分支/构建产物变更存在于工作区（非本报告范围），提交主线时需做提交范围隔离，避免误带入。
- `npm` 的 `Unknown env config "devdir"` 为环境告警，当前不影响测试与类型检查通过。

---

## 6. 下一步建议（面向 CTO 决策）

1. 允许进入“最终交付整理”阶段（仅主线）：
   - 整理提交说明（按 M2/M3/M4 分组）
   - 产出 PR 描述（目标-变更-验证-风险）
2. 触发一次主线最终验收清单复核：
   - 核对关键接口契约与错误码矩阵
   - 核对指标口径与对外说明一致性
3. 完成后执行合并流程与发布节奏确认。

