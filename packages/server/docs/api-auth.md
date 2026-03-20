# 用户认证 API（T-5.3）

> 依据：CTO-Execution-Directive-v1 §5

## 基础路径

- 前缀：`/api/v1/auth`
- 成功响应：`{ data: T }`；错误：`{ error: { code, message, details? } }`

## 接口清单

### 1. 邮箱注册

- **POST** `/api/v1/auth/register`
- Body: `{ email: string; password: string (min 8); role?: "provider" | "consumer" }`
- 响应 201: `{ data: { access_token, refresh_token, expires_in, user: { id, email, role } } }`
- 409: `email_taken`

### 2. 邮箱登录

- **POST** `/api/v1/auth/login`
- Body: `{ email: string; password: string }`
- 响应 200: `{ data: { access_token, refresh_token, expires_in, user: { id, email, role } } }`
- 401: `invalid_credentials`

### 3. OAuth 发起

- **GET** `/api/v1/auth/oauth/:provider` — provider 为 `github` 或 `google`
- 重定向到第三方授权页；未配置时返回 503

### 4. OAuth 回调

- **GET** `/api/v1/auth/oauth/:provider/callback?code=...`
- 交换 code 换取用户信息，存在则登录、不存在则创建用户后返回本平台 tokens（JSON）

### 5. Token 刷新

- **POST** `/api/v1/auth/refresh`
- Body: `{ refresh_token: string }`
- 响应 200: `{ data: { access_token, refresh_token, expires_in, user } }`
- 401: `invalid_refresh_token`

### 6. 当前用户信息

- **GET** `/api/v1/auth/me`
- Header: `Authorization: Bearer <access_token>`
- 响应 200: `{ data: { id, email, role } }`
- 401: `unauthorized` / `invalid_token`

### 7. 设置/切换用户角色

- **PUT** `/api/v1/auth/me/role`
- Header: `Authorization: Bearer <access_token>`
- Body: `{ role: "provider" | "consumer" }`
- 响应 200: `{ data: { id, email, role } }`

## 环境变量

- `JWT_SECRET`：至少 16 字符，用于签发/校验 access_token（测试时未设置则使用默认值）
- `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`：GitHub OAuth
- `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`：Google OAuth
- `OAUTH_REDIRECT_BASE`：回调基础 URL（如 `https://app.example.com`）

## 验收条件（T-5.3）

- [x] 邮箱注册 + 登录链路可走通
- [x] OAuth（GitHub）发起与回调可配置、可走通
- [x] Token 刷新机制正常
- [x] 用户角色（Provider / Consumer）正确存储和返回
