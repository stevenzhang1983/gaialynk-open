# Agent IM 主线 PR 描述草案（2026-03-15）

适用分支：主线后端收口（仅 `packages/server` + 主线相关文档）  
目标：按 CTO 最新指引完成“契约冻结 + 门禁化 + 发布前资产整理”。

---

## PR Title（建议）

`chore(mainline): freeze api contracts and harden release gates for M2-M4`

---

## PR Summary（可直接粘贴）

本 PR 按 CTO 最新主线收口指引，完成 M2-M4 的发布前稳定化工作，重点不是新增功能，而是冻结既有契约并将兼容性测试升级为发布门禁。  

核心结果：

1. 完成 5 个关键接口的契约冻结与兼容性守卫测试：
   - `/api/v1/public/entry-events`
   - `/api/v1/public/entry-metrics`
   - `/api/v1/agents/recommendations`
   - `/api/v1/nodes/health`
   - `/api/v1/nodes/relay/invoke`
2. 强化高风险调用路径与审计查询边界校验，统一错误码可预测性。
3. 产出主线发布前必需文档资产（契约矩阵、脱敏字段清单、门禁清单、联调演练模板、变更日志、覆盖报告）。

---

## Why（业务与工程动机）

- 降低官网/入口线联调期间的“临时接口变更”风险。
- 防止后续重构在无版本说明情况下破坏外部契约。
- 提升发布前可审计性：接口、测试、门禁、文档形成闭环。

---

## Scope（建议纳入本 PR 的文件）

代码与测试：

- `.github/workflows/ci.yml`
- `package.json`
- `packages/server/src/app.ts`
- `packages/server/tests/audit-events-query.test.ts`
- `packages/server/tests/phase1-mainline-apis.test.ts`
- `packages/server/tests/response-format-consistency.test.ts`
- `packages/server/tests/mainline-contract-compatibility.test.ts`

主线文档：

- `docs/Agent-IM-CTO-Progress-Report-2026-03-15.md`
- `docs/Agent-IM-Mainline-API-Contract-Matrix-v1.md`
- `docs/Agent-IM-Mainline-Readonly-Desensitized-Fields-v1.md`
- `docs/Agent-IM-Mainline-Release-Gate-Checklist-v1.md`
- `docs/Agent-IM-Mainline-Website-Integration-Drill-Template-v1.md`
- `docs/Agent-IM-Mainline-High-Risk-Path-Test-Coverage-Report-2026-03-15.md`
- `docs/Agent-IM-Mainline-PreRelease-ChangeLog-M2-M4-2026-03-15.md`

---

## Out of Scope（本 PR 明确不包含）

- `packages/website/**` 的并行改动
- website 相关新增文档（除主线协同所需模板外）
- 非收口目标的大功能扩展（编排、计费等）

---

## Verification（验证结果）

- `npm run test:contracts:mainline` 通过
- `npm test` 通过
- `npm run typecheck` 通过

---

## Risk & Mitigation

- 风险：当前工作区存在大量 website 并行改动，误提交概率高。  
  缓解：提交时严格按路径选择，仅纳入本草案 Scope 文件列表。
- 风险：后续若调整对外字段/错误码，可能破坏联调稳定性。  
  缓解：已新增契约守卫测试 + CI 独立门禁；变更需版本化并更新契约文档。

---

## Test Plan（建议在 PR 描述中附带）

- [x] 主线兼容契约守卫通过
- [x] 主线全量测试通过
- [x] TypeScript 类型检查通过
- [ ] 与官网入口线进行 3 条漏斗联调演练并回填模板

---

## Commit 分组建议（避免一次性大提交）

1. `test(mainline): add contract compatibility guards for frozen APIs`
   - 仅测试文件（含新增守卫测试与边界回归补充）
2. `fix(mainline): harden query validation and standardize error handling`
   - `packages/server/src/app.ts` 的契约/错误码稳定化改动
3. `ci(mainline): add contract compatibility required check`
   - `.github/workflows/ci.yml` + `package.json` 脚本
4. `docs(mainline): add release gate, contracts, desensitized field list, and drill templates`
   - 本轮主线文档资产

