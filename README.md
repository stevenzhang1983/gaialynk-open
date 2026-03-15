# GAIALYNK 

Phase 0 最小交付聚焦可信调用闭环：

- 会话与消息流
- Agent 目录与加入会话
- A2A 调用映射（支持 `mock://` 与 JSON-RPC 外部端点）
- Trust Policy v0（allow / need_confirmation / deny）
- 审计事件与收据验签
- Node-Hub 最小接口（register / heartbeat / directory sync）
- 高风险 Review Queue（pending invocation 列表 + 人审确认）
- 多 Agent 定向调用（单条消息触发多个 Agent）
- go/no-go 指标聚合与控制台可视化
- 极简控制台（本地静态页面）

## 快速开始

```bash
npm install
npm run dev:server
```

服务启动后：

- API: `http://localhost:3000`
- 控制台（新终端）:

```bash
npm run dev:console
```

打开浏览器访问 `http://localhost:5173`

## Docker 一键启动

```bash
docker compose up --build
```

启动后 API 可通过 `http://localhost:3000` 访问。

## 测试

```bash
npm test
npm run typecheck
```

官网入口（Phase 1）开发与构建：

```bash
npm run dev:website
npm run typecheck:website
npm run build:website
```

PostgreSQL 集成测试（需设置 `DATABASE_URL` 并先执行 migration）：

```bash
npm run db:migrate
npm run test:pg
```

也可一键验证：

```bash
npm run verify:pg:local
```

首次本地 PostgreSQL 启动与全流程初始化（启动 + migrate + reset + seed + verify）：

```bash
npm run bootstrap:pg:local
```

## 关键 API

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id`
- `POST /api/v1/conversations/:id/messages`
- `POST /api/v1/conversations/:id/agents`
- `POST /api/v1/agents`
- `GET /api/v1/agents`
- `GET /api/v1/agents/:id`
- `GET /api/v1/invocations`
- `GET /api/v1/invocations/:id`
- `POST /api/v1/invocations/:id/confirm`
- `GET /api/v1/audit-events`
- `GET /api/v1/receipts/:id`
- `POST /api/v1/nodes/register`
- `POST /api/v1/nodes/heartbeat`
- `POST /api/v1/nodes/sync-directory`
- `GET /api/v1/nodes`
- `GET /api/v1/metrics`

`GET /api/v1/audit-events` 支持查询参数：

- `event_type`
- `conversation_id`
- `limit`
- `cursor`

`GET /api/v1/invocations` 支持查询参数：

- `status`（`pending_confirmation` / `completed`）
- `conversation_id`

## 调用与风控说明

`POST /api/v1/conversations/:id/messages` 支持：

- 默认单 Agent 调用（不传 `target_agent_ids`）
- 多 Agent 定向调用（传 `target_agent_ids: string[]`）

多 Agent 返回会聚合：

- `meta.completed_receipts`
- `meta.pending_invocations`
- `meta.denied_agents`
- `meta.failed_agents`

## Demo 路径

1. 创建会话
2. 注册 Agent 并加入会话
3. 发送 low 风险消息（自动执行）
4. 发送 high 风险消息（进入 `pending_confirmation`）
5. 查询 Review Queue（`GET /api/v1/invocations?status=pending_confirmation`）
6. 调用确认接口完成执行
7. 再次查询 Review Queue（应出队）
8. 查看 audit-events / receipts / metrics
9. 节点注册并同步目录
10. 触发节点 Agent + 本地 Agent 的多 Agent 协作调用

也可以用脚本一键跑通：

```bash
npm run demo:phase0
```

## Open Source

- 本仓库遵循 Open Core：开源最小可接入与可验证能力，托管运营与商业化能力保持闭源分层。
- [OSS vs Cloud 能力矩阵（草案）](./docs/Agent-IM-OSS-vs-Cloud-Capability-Matrix.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
