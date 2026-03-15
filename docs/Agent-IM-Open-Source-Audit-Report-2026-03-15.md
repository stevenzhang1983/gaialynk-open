# Agent IM 开源边界审核报告（2026-03-15）

审核依据：

- `Agent-IM-Open-Source-Boundary-and-Audit-Guide.md`
- `Agent-IM-Mainline-Review-and-Phase1-Execution-Plan.md`

---

## 1. 审核范围

- 路径：`packages/server`, `packages/console`, `scripts`, `docs`, `README.md`
- 范围：截至当前工作区变更（Phase 1 主线推进中的改动）

## 2. 发现列表（按标签）

### OPEN-OK

- `packages/server`：协议、最小可信调用、审计与收据、节点接入闭环符合开源基础能力定位。
- `packages/console`：保持极简演示与调试用途，未引入商业后台能力。
- `scripts`：本地演示与验证脚本不含敏感生产流程。
- `docs`：补充 Open Core 边界矩阵，增强边界清晰度。

### MOVE-CLOSED

- 无（当前未发现必须迁移到闭源层的代码）。

### SPLIT-NEEDED

- 收据签名实现：已完成“开源接口 + 生产密钥配置分层”，通过环境变量注入密钥，避免在 OSS 内固化运营密钥。

### RISK-REVIEW

- 暂无需 CTO 立即拍板的高风险边界争议项。

## 3. 高风险项 Top 5（及处理建议）

1. 收据签名若硬编码密钥会造成安全与边界风险。  
   - 处理：已改为环境变量注入，支持 Ed25519/JWS，保留 HMAC 回退。
2. 审计查询若暴露内部运营字段可能越界。  
   - 处理：当前仅提供基础过滤，不暴露商业运营控制字段。
3. 只读公共接口若返回原始审计明细，可能泄露内部上下文。  
   - 处理：新增 `public` 接口仅返回聚合与脱敏字段。
4. 节点中继若混入托管调度策略，可能越界到闭源能力。  
   - 处理：当前仅保留最小 relay 闭环，不包含运营调度策略。
5. 文档若不区分 OSS 与 Cloud，会造成能力承诺混淆。  
   - 处理：新增 OSS vs Cloud 能力矩阵并在 README 链接。

## 4. 本周可完成整改项

- [x] 收据签名升级与密钥注入分层
- [x] OSS vs Cloud 能力矩阵
- [x] README Open Core 边界声明
- [x] 审计查询能力增强与测试补齐

## 5. 需 CTO 决策项

- 暂无阻塞性决策项。  
- 可选后续决策：收据签名生产环境是否强制 Ed25519（禁用 HMAC 回退）。

