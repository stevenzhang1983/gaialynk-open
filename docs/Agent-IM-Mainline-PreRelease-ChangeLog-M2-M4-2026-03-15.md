# Agent IM 主线发布前变更日志（M2/M3/M4）

日期：2026-03-15  
范围：`packages/server`

---

## M2（体验与发现补强）

- 修正 `GET /api/v1/agents/recommendations` 风险过滤语义：
  - 从“首 capability 判断”升级为“intent 匹配能力优先判断”。
- 统一请求校验错误结构：
  - `validation_error`（400）作为通用输入校验失败返回。
- 补充契约守卫测试，防止字段/错误码无意漂移。

---

## M3（节点可用化）

- 强化 `GET /api/v1/nodes/health` 查询参数校验：
  - 非法 `stale_after_sec` 返回 `invalid_nodes_health_query`（400）。
- 强化 `POST /api/v1/nodes/relay/invoke` 边界语义回归：
  - `node_not_found`（404）
  - `agent_not_found`（404）
  - `agent_node_mismatch`（400）
  - `node_unavailable`（503）
- 补充 `POST /api/v1/nodes/sync-directory` 缺失 node 路径回归（404）。

---

## M4（增长与产品线协同）

- 强化 `POST /api/v1/public/entry-events` 稳定性：
  - 非法 JSON / 非法 payload -> `invalid_public_entry_event`（400）。
  - 兼容旧客户端缺省 `referrer` / `timestamp`。
- 校准 `GET /api/v1/public/entry-metrics` 指标口径：
  - `page_view_home` 仅统计首页 PV。
  - `cta_click_start_building` 仅统计 `cta_id=start_building`。
- 增强 `GET /api/v1/usage/counters`：
  - 新增 `window_from`、`event_type_counts`。
  - 非法 `window_days` 返回 `invalid_usage_counters_query`（400）。
- 增强 `GET /api/v1/meta`：
  - 新增 `node_protocol`、`quickstart_endpoints`。
- 强化 `GET /api/v1/audit-events` 查询校验：
  - 非法参数返回 `invalid_audit_events_query`（400）。

---

## 质量证据

- 全量测试通过：`npm test`
- 类型检查通过：`npm run typecheck`

