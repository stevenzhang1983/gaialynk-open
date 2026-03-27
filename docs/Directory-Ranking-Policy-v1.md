# 目录排序与推荐策略 v1（E-9 / §17.4）

> **状态**：与 `CTO-V1.3-Execution-Directive-v1.md` E-9 及补充规格 §17.4 对齐；实现见 `packages/server/src/modules/directory/ranking.service.ts` 与 `directory-ranking-config.store.ts`。

## 1. 决策摘要（R1–R6）

| 决策 | 落地 |
|------|------|
| **R1 搜索默认排序** | 有关键词且未显式指定 `sort`（或 `sort=relevance_trust:desc`）时：**相关性 primary**，**信任徽章 tie-breaker**（`consumer_ready` 优先于 `high_sensitivity_enhanced`，再优于 `unverified`）；同分按名称升序。显式 `sort=created_at:asc|desc` 时走库内时间序，不用本策略。 |
| **R2 新手友好运营位** | `beginner_friendly` 槽位仅允许配置中的 `allowed_trust_badges`；**默认仅 `consumer_ready`**，**永不包含 `unverified`**。 |
| **R3 新上架冷启动** | `new_listings`：`max_listing_age_days`（默认 7 天）、`impression_cap_per_agent`（默认 500 次展示上限）、`min_trust_badge=consumer_ready` 与最低评测等级门槛；每次成功返回 `new_listings` 会对其中 Agent **累加展示计数**（PostgreSQL）。 |
| **R4 运营位入池** | `hot` / `beginner_friendly` / `low_latency` / `new_listings` 各有：**最低声誉等级**、**近窗错误率上限**、**最短上架天数**、**槽位条数上限**；`low_latency` 可要求 `health_check_status === ok`。阈值可通过管理 API 覆盖默认值。 |
| **R5 与意图推荐** | `GET /api/v1/agents/recommendations` 在相同意图得分下应用**同一信任 tie-breaker**，与目录信任叙事一致。 |
| **R6 降级** | 指标批量查询或排序逻辑异常时：`GET /api/v1/agents` 使用**字母序 + deprecated 置后**；`GET /api/v1/agents/discovery` 仍返回非空槽位并标记 `meta.ranking_fallback=true`。 |

## 2. API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/agents` | `search` 存在时默认启用 R1；响应可带 `meta.ranking_fallback`。分页 `limit`/`cursor` 在排序后于内存切片。 |
| `GET` | `/api/v1/agents/recommendations` | 意图得分 + 信任 tie-breaker。 |
| `GET` | `/api/v1/agents/discovery` | 空搜运营位：`hot`、`beginner_friendly`、`low_latency`、`new_listings`；`?simulate_ranking_failure=1` 仅用于联调/测试降级。 |
| `GET` | `/api/v1/directory-ranking/config` | 当前生效配置（默认值 + 库内补丁合并）。 |
| `PATCH` | `/api/v1/directory-ranking/config` | 部分更新 JSON；需 Bearer JWT，且 **`DIRECTORY_RANKING_ADMIN_USER_IDS` 包含该用户 `sub`**；测试环境（`VITEST=true`）下任意登录用户可 PATCH。 |

## 3. 声誉与错误率

- **声誉等级**：与 `getAgentStatsAsync` 一致的计分公式，在 `audit_events` 上按 Agent **聚合**（批量查询，避免 N+1）。
- **近窗错误率**：默认近 **30 天**内 `invocation.failed / (completed + failed)`（无分母则为 0）。

## 4. 运维说明

- **迁移**：`0024_directory_ranking_e9.sql`（`directory_ranking_config`、`directory_new_listing_impressions`）。
- **生产 PATCH 权限**：务必配置 `DIRECTORY_RANKING_ADMIN_USER_IDS`（逗号分隔用户 UUID），否则生产环境无人可改配置。
- **对外承诺**：开发者门户说明排序因素时引用本文档，避免过度承诺「黑盒排名」。

---

*本文档随 E-9 代码迭代；与产品法务/运营数值最终定稿可对 `PATCH /api/v1/directory-ranking/config` 微调阈值。*
