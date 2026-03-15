# Agent IM 主线发布门禁清单（v1）

日期：2026-03-15  
范围：`packages/server`  
目标：把契约守卫测试升级为发布前显式门禁。

---

## 1. 必须通过的 CI 检查

以下检查为发布前必过项：

1. `test-and-typecheck`
2. `mainline-contract-compatibility`
3. `postgres-integration`

---

## 2. 对应本地验证命令

在提交前，建议按顺序本地执行：

```bash
npm run typecheck
npm run test:contracts:mainline
npm test
npm run test:pg
```

说明：

- `test:contracts:mainline` 为契约冻结守卫（字段/错误码/语义稳定性）。
- `npm test` 覆盖主线回归测试。
- `test:pg` 验证 PostgreSQL 集成路径不回归。

---

## 3. 契约守卫覆盖接口

`packages/server/tests/mainline-contract-compatibility.test.ts` 当前覆盖：

- `POST /api/v1/public/entry-events`
- `GET /api/v1/public/entry-metrics`
- `GET /api/v1/agents/recommendations`
- `GET /api/v1/nodes/health`
- `POST /api/v1/nodes/relay/invoke`

---

## 4. 失败处理原则

1. 任一门禁失败，禁止合并。
2. 若变更属于契约调整，先更新：
   - `docs/Agent-IM-Mainline-API-Contract-Matrix-v1.md`
   - 对应兼容性守卫测试
3. 若为非预期回归，优先修复代码并补测试，不允许“降标准放行”。

