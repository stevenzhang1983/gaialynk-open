# Agent IM 主线只读脱敏字段清单（v1 冻结）

日期：2026-03-15  
适用对象：官网/入口线、数据联调方  
状态：冻结（发布前）

---

## 1. 目标

- 明确官网/入口线可消费的只读字段范围。
- 明确哪些字段可暴露，哪些字段必须脱敏或禁止透出。
- 作为跨团队联调边界，避免临时字段诉求。

---

## 2. 只读接口与字段范围

## 2.1 `GET /api/v1/public/overview`

允许字段（公开）：

- `weekly_trusted_invocations`
- `connected_nodes_total`
- `conversations_active_total`
- `go_no_go.decision`
- `go_no_go.reasons`

禁止透出：

- 会话明细内容、用户标识、agent 私有配置、审计 payload 原文。

## 2.2 `GET /api/v1/public/entry-metrics`

允许字段（公开）：

- `locales_supported`
- `weekly_trusted_invocations`
- `first_session_success_rate`
- `connected_nodes_total`
- `conversion_baseline.*`
- `locale_breakdown.*`

禁止透出：

- 原始事件 payload（如 `referrer` 原文、潜在渠道细粒度标识）
- 可追踪到单个用户/会话/agent 的标识字段。

## 2.3 `GET /api/v1/meta`

允许字段（公开）：

- `api_version`
- `trust_policy_version`
- `node_protocol.min`
- `node_protocol.recommended`
- `quickstart_endpoints`
- `features`

禁止透出：

- 内部服务拓扑、密钥配置、未发布实验开关。

---

## 3. 脱敏规则

1. 统计优先：优先返回聚合数值，不返回实体级数据。
2. 最小化原则：仅返回联调必须字段。
3. 可逆标识禁止：不可返回可用于重识别个人/组织的字段。
4. 错误详情克制：`error.details` 不得包含敏感正文与密钥片段。

---

## 4. 口径冻结说明

- 本清单与 `Agent-IM-Mainline-API-Contract-Matrix-v1.md` 同步冻结。
- 若官网/入口线提出新增字段需求，按以下流程处理：
  1) 提交字段用途与必要性；
  2) 安全/隐私审查；
  3) 明确版本变更策略；
  4) 更新契约与回归测试后再放开。

