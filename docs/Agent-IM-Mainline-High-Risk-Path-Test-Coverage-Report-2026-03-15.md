# Agent IM 主线高风险路径测试覆盖报告

日期：2026-03-15  
范围：`packages/server` 高风险调用闭环（发布前门禁视角）

---

## 1. 结论

当前高风险调用主路径已达到发布前门禁级覆盖，关键分支具备自动化测试证据，未发现未覆盖的核心阻断分支。

---

## 2. 覆盖范围（关键链路）

## 2.1 高风险进入待确认

- 覆盖点：
  - 高风险能力触发 `need_confirmation`
  - 生成 `pending_confirmation` invocation
- 主要测试：
  - `packages/server/tests/sprint2-trust-closed-loop.test.ts`
  - `packages/server/tests/phase0-api-completeness.test.ts`

## 2.2 人审确认执行与幂等

- 覆盖点：
  - `POST /api/v1/invocations/:id/confirm` 首次成功
  - 二次确认返回 `409 invocation_not_confirmable`
  - confirm 失败时回滚到 `pending_confirmation`
- 主要测试：
  - `packages/server/tests/sprint2-trust-closed-loop.test.ts`
  - `packages/server/tests/response-format-consistency.test.ts`
  - `packages/server/tests/phase1-mainline-apis.test.ts`

## 2.3 审计与收据关联可回溯

- 覆盖点：
  - `invocation.need_confirmation / invocation.confirmed / invocation.completed / invocation.failed`
  - 收据签发与验签可用
  - 审计查询分页与过滤可用
- 主要测试：
  - `packages/server/tests/audit-events-query.test.ts`
  - `packages/server/tests/receipt.store.test.ts`
  - `packages/server/tests/sprint2-trust-closed-loop.test.ts`

## 2.4 中继高风险边界（节点链路）

- 覆盖点：
  - `node_unavailable`（503）
  - `node_not_found`（404）
  - `agent_not_found`（404）
  - `agent_node_mismatch`（400）
- 主要测试：
  - `packages/server/tests/phase1-mainline-apis.test.ts`
  - `packages/server/tests/mainline-contract-compatibility.test.ts`

---

## 3. 本轮新增门禁守卫

新增契约兼容测试文件：

- `packages/server/tests/mainline-contract-compatibility.test.ts`

作用：

- 锁定高风险相关接口的字段与错误码稳定性；
- 防止后续重构引入无版本化的破坏性变更。

---

## 4. 当前门禁结果

- `npm test`：通过
- `npm run typecheck`：通过
- 新增测试已纳入全量测试集

---

## 5. 后续建议

1. 将该测试文件标记为发布前必跑清单的一部分（CI Required Check）。
2. 若后续修改高风险链路字段或错误码，必须先更新契约矩阵并同步新增用例。

