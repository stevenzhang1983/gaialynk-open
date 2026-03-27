# GaiaLynk 桌面 Connector 通信协议（E-19 / 与 E-20 契约）

本文档约定 **Connector 客户端**与**主线 API**之间的 HTTP 契约；E-20 在服务端实现校验与持久化时需与此保持一致。

## 1. 配对轮询

**请求**

```http
GET /api/v1/connectors/desktop/pair-status?pairing_code={6位数字}
```

**响应 JSON（示例）**

```json
{
  "status": "pending",
  "device_token": null,
  "device_secret": null,
  "device_id": null
}
```

配对完成后：

```json
{
  "status": "completed",
  "device_token": "<JWT>",
  "device_secret": "<utf8 secret for HMAC>",
  "device_id": "<uuid>"
}
```

> Web 侧 `POST /api/v1/connectors/desktop/pair` 由 **E-20** 定义；Connector 仅需轮询 `pair-status`。

## 2. 本机 HTTP（127.0.0.1 随机端口）

仅绑定 **回环地址**。所有 `/fs/*` 路由：

| 头 | 规则 |
|----|------|
| `Authorization` | `Bearer {device_token}`，与配对结果一致 |
| `Origin` | 若存在，必须在 Connector 本地配置的 `allowed_web_origins` 列表中 |
| `X-Gaialynk-Confirmed` | `POST /fs/write` 须为 `true`（大小写不敏感），否则 **403**（Trust 确认流由 Web/E-20 负责） |

### 2.1 `GET /fs/list?path=`

`path` 为相对于**某一挂载根**的相对路径；空表示第一个挂载根的根目录。解析后经 `canonicalize` 校验必须仍位于某一挂载根之下。

**响应**：`[{ "name", "is_dir", "size" }]`

### 2.2 `GET /fs/read?path=`

单文件读取，上限 **10MB**；超出返回 **413**。

**响应**：`{ "encoding": "base64", "content": "..." }`

### 2.3 `POST /fs/write`

**Body JSON**

```json
{
  "path": "相对挂载根的路径",
  "content_base64": "..."
}
```

### 2.4 `GET /fs/watch?path=`

**SSE**（`text/event-stream`），`event: fs`，`data` 为 notify 事件的 JSON 字符串。  
TRUST-DEBT：每个连接会常驻一条 watcher 线程；生产应限流与连接生命周期治理。

## 3. 执行收据上送

每次 **list / read / write** 成功后，Connector **异步**调用（失败仅日志，不阻塞本机 API）：

```http
POST /api/v1/connectors/desktop/receipts
Authorization: Bearer {device_token}
Content-Type: application/json
```

**Body 字段**

| 字段 | 说明 |
|------|------|
| `device_id` | 配对下发 |
| `action` | `file_list` \| `file_read` \| `file_write` |
| `path_hash` | SHA-256（hex）对 **绝对路径字符串** UTF-8 字节 |
| `status` | `ok` \| `error` |
| `error_code` | 可选 |
| `ts` | RFC3339 UTC |
| `env_signature` | hex(HMAC-SHA256(`device_secret`, **签名体 JSON 字符串**)) |

**签名体**：与请求 body 结构相同，但 **不含** `env_signature`，且为 `ReceiptSignEnvelope` 的 `serde_json::to_string` 结果（字段顺序固定为 `action`, `device_id`, `error_code`, `path_hash`, `status`, `ts`；`error_code` 缺省时序列化省略）。

实现参考：`packages/connector/src-tauri/src/pairing.rs` 中 `ReceiptSignEnvelope` 与 `build_signed_receipt`。

## 4. 环境变量

| 变量 | 含义 |
|------|------|
| `GAIALYNK_MAINLINE_URL` | 默认主线基址（无配置文件时） |
