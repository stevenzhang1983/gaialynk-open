# 实时通道与客户端协议（E-3 + E-12）

> 依据：CTO-V1.3-Execution-Directive-v1 §E-3、§E-12；SSE 为 WebSocket 的降级路径。

## 1. WebSocket（主通道）

- **URL**：`ws://<host>:<port>/api/v1/realtime/ws`
- **Query**（必填）：
  - `token` 或 `access_token`：与 REST 相同的 Bearer Access JWT（WS 握手无法带 `Authorization` 头时使用 query）。
  - `conversation_id`：订阅的会话 UUID。
- **Query**（可选）：
  - `last_event_id`：断线重连时传入**已收到的最后一条消息**的 `id`（即 `event_id`）；服务端会补推该 id **之后**的消息（按 `created_at` 升序，最多 500 条）。

### 1.1 服务端下行帧（JSON 文本）

每条消息为一行 JSON 对象：

| `type` | 说明 |
|--------|------|
| `message` | 新消息或补推；字段：`event_id`（= `messages.id`）、`data`（与 REST `Message` 一致，含 `status`）。 |
| `connected` | 握手完成；字段：`conversation_id`、`replayed_count`（本次补推条数）。 |
| `message_read` | E-12 已读回执；字段：`message_id`、`user_id`、`read_at`（ISO）。由客户端上行 `message_read` 触发持久化后广播。 |
| `typing_start` / `typing_stop` | E-12 输入状态；字段：`conversation_id`、`user_id`。不持久化；`typing_start` 后服务端 **10s** 无新 `typing_start` 则自动下发 `typing_stop`。 |
| `presence_update` | E-12 Space 会话：字段：`space_id`、`user_id`、`status`（`online` \| `away`）。连接建立时 `online`；断线约 30s 标 `away` 时经 WS 扇出（仍以 `GET .../presence` 为准查全量）。 |

### 1.2 鉴权与访问控制

- JWT 无效或过期：连接关闭，建议 code `4401`。
- 非 Space 会话：用户须为该会话的 **user 参与者**。
- Space 会话：用户须为该 **Space 成员**（与 REST `enforceSpaceConversationAccess` 一致）。

### 1.2.1 客户端上行（JSON 文本）

连接鉴权成功后，可发送：

| `type` | 字段 | 说明 |
|--------|------|------|
| `message_read` | `message_id`（UUID） | 将当前用户对该消息的已读写入 `message_read_receipts` 并向会话成员广播 `message_read`。 |
| `typing_start` | 无额外必填 | 广播正在输入；重置 10s 空闲计时。 |
| `typing_stop` | 无额外必填 | 立即广播停止输入。 |

### 1.3 Presence（Space）

- 对 **带 `space_id` 的会话** 建立 WS 且鉴权成功后，服务端将该用户对应 Space 标为 **online**。
- 连接关闭后 **约 30s** 将状态标为 **away**（若未再次连接）。
- 查询在线列表：`GET /api/v1/spaces/:id/presence`（需 Bearer，且为成员）。响应 `data.members[]` 含 `presence_status`: `online` | `away` | `offline`。

## 2. SSE（降级）

- **GET** `/api/v1/conversations/:id/messages/stream`
- `Content-Type: text/event-stream`
- 事件：`event: message`，`data` 为消息 JSON（与 WS `message` 的 `data` 同形）。

## 3. 消息状态机（用户可见）

| 状态 | 含义 |
|------|------|
| `sending` | 客户端已发出、尚未收到服务端确认（主要由客户端展示；可选与将来重试 id 对齐）。 |
| `delivered` | 服务端已持久化并已向实时通道发出广播（成功 `POST .../messages` 的返回体中 `status` 即为 `delivered`）。 |
| `failed` | 请求失败、被拒绝或超时；客户端应允许重试（重新发送同内容或后续「重试」API，以产品为准）。 |

REST 返回 **4xx/5xx** 且无 `data` 消息体时，客户端应视为 **`failed`**，不依赖数据库行。

## 4. 性能与容量

- 单连接补推上限 **500** 条；更大缺口应使用 `GET /api/v1/conversations/:id/messages` 分页拉取。
- 目标：**同会话多设备** 端到端送达 P95 ≤ 3s（依赖网络与环境）。
- **E-12**：配置 `REDIS_URL` 时，会话扇出经 **Redis Pub/Sub**（`conv:{conversation_id}`），支持多副本；无 Redis 时退化为单机进程内 WS 扇出。

## 5. 安全提示

- Query 中的 JWT 可能出现在代理/访问日志中；生产环境应使用 **短 TTL**、**WSS**，并优先在支持时改用子协议或首帧鉴权（V1.3.1 可演进）。
