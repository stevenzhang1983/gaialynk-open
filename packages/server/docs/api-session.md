# 会话 API（T-5.1）

> 依据：CTO-Execution-Directive-v1 §5、CTO-Website-Optimization-Plan-v1 §8

## 基础路径

- 前缀：`/api/v1`
- 响应格式：成功 `{ data: T, meta?: { pagination?, next_cursor? } }`，错误 `{ error: { code, message, details? } }`

## 接口清单

### 1. 创建会话

- **POST** `/api/v1/conversations`
- Body: `{ title: string; conversation_topology?: "T1"|"T2"|"T3"|"T4"|"T5"; authorization_mode?: "user_explicit"|"policy_based"|"delegated"; visibility_mode?: "full"|"summarized"|"restricted"; risk_level?: "low"|"medium"|"high"|"critical" }`
- 响应 201: `{ data: Conversation }`

### 2. 会话列表（分页、排序）

- **GET** `/api/v1/conversations`
- Query: `cursor?: string; limit?: number; sort?: "created_at:desc" | "created_at:asc"`
- 响应 200: `{ data: Conversation[] }` 或 `{ data: Conversation[]; meta: { next_cursor?: string } }`

### 3. 会话详情

- **GET** `/api/v1/conversations/:id`
- 响应 200: `{ data: { conversation: Conversation; participants: Participant[]; messages: Message[] } }`
- 404: `conversation_not_found`

### 4. 删除会话

- **DELETE** `/api/v1/conversations/:id`
- 响应 200: `{ data: { id: string; deleted: true } }`
- 404: `conversation_not_found`

### 5. 发送消息

- **POST** `/api/v1/conversations/:id/messages`
- Body: `{ sender_id: string; text: string; thread_id?: string; mentions?: string[]; target_agent_ids?: string[]; delegation_ticket_id?: string }`
- 响应 201/202: 见现有实现（含 trust_decision、invocation_id 等）

### 6. 消息列表（分页）

- **GET** `/api/v1/conversations/:id/messages`
- Query: `cursor?: string; limit?: number; sort?: "created_at:desc" | "created_at:asc"`
- 响应 200: `{ data: Message[]; meta?: { next_cursor?: string } }`
- 404: `conversation_not_found`

### 7. 消息流式推送（SSE）

- **GET** `/api/v1/conversations/:id/messages/stream`
- 响应 200: `Content-Type: text/event-stream`，服务端在新消息产生时发送 `event: message`、`data: <JSON Message>`
- 404: `conversation_not_found`

## TypeScript 类型（来自 conversation.store）

- `Conversation`: `id, title, state, created_at, updated_at, conversation_topology?, authorization_mode?, visibility_mode?, risk_level?`
- `Participant`: `id, conversation_id, participant_type, participant_id, role, joined_at`
- `Message`: `id, conversation_id, sender_type, sender_id, content: { type: "text"; text: string; thread_id?; mentions? }, created_at`
