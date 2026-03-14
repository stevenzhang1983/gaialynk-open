# GAIALYNK Phase 0

Phase 0 最小交付聚焦可信调用闭环：

- 会话与消息流
- Agent 目录与加入会话
- A2A 调用映射（mock）
- Trust Policy v0（allow / need_confirmation / deny）
- 审计事件与收据验签
- Node-Hub 最小接口（register / heartbeat）
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

## 关键 API

- `POST /api/v1/conversations`
- `GET /api/v1/conversations`
- `GET /api/v1/conversations/:id`
- `POST /api/v1/conversations/:id/messages`
- `POST /api/v1/conversations/:id/agents`
- `POST /api/v1/agents`
- `GET /api/v1/agents`
- `GET /api/v1/agents/:id`
- `GET /api/v1/invocations/:id`
- `POST /api/v1/invocations/:id/confirm`
- `GET /api/v1/audit-events`
- `GET /api/v1/receipts/:id`
- `POST /api/v1/nodes/register`
- `POST /api/v1/nodes/heartbeat`
- `GET /api/v1/metrics`

`GET /api/v1/audit-events` 支持查询参数：

- `event_type`
- `conversation_id`
- `limit`
- `cursor`

## Demo 路径

1. 创建会话
2. 注册 Agent 并加入会话
3. 发送 low 风险消息（自动执行）
4. 发送 high 风险消息（返回 pending_confirmation）
5. 调用确认接口完成执行
6. 查看 audit-events 与 receipts

也可以用脚本一键跑通：

```bash
npm run demo:phase0
```
