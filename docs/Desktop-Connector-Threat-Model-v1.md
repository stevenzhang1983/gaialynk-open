# 桌面 Connector 威胁模型 v1（E-19）

> **范围**：轻量桌面 Connector（Tauri 本机进程 + 回环 HTTP + 主网配对/收据）。  
> **相关**：`packages/connector/`、`packages/connector/PROTOCOL.md`、主线 **E-20**（配对 API、收据验签、执行代理）。

## 1. 资产与信任边界

| 资产 | 说明 |
|------|------|
| 用户文件 | 仅应在用户显式挂载的工作区根目录树内被访问 |
| `device_token` / `device_secret` | 配对后存储于本机配置文件，等效于「本机文件代理」的长期凭据 |
| 主网账户 | 通过 Web 输入配对码与设备绑定 |

**信任边界**

- **浏览器 / Web App**：经 `Origin` + Bearer 调用本机回环 API；须防止恶意站点在用户已登录 Web 的前提下滥用 token（见 §3）。
- **本机其他进程**：可扫描回环端口并尝试调用；依赖 Bearer 与可选 Origin 降低误用面（见 §2、§3）。
- **主网**：校验收据 HMAC、设备状态与审计（E-20）。

## 2. 本机恶意软件滥用

**风险**：恶意软件读取 Connector 配置中的 `device_token`，或监听回环端口并重放请求。

**缓解（当前 E-19）**

- 配置文件位于用户配置目录，权限依赖 OS 用户隔离。
- 本机 HTTP 仅监听 **127.0.0.1**。
- 请求需 **Bearer**；浏览器来源需 **Origin 白名单**（可配置）。
- 写操作需 **`X-Gaialynk-Confirmed: true`**，与 Web 侧 Trust 确认流配合（E-20/W-22）。

**残余风险 / 债**

- 回环上的 Bearer 无法对「本机其他进程」做到密码学级隔离；更高保障需 OS 级管道/命名管道 + 每请求一次性票据（SCALE-DEBT）。

## 3. 用户误授权（恶意网站）

**风险**：用户在同一浏览器会话中打开恶意站点，该站点若能获得合法 `device_token`（例如通过 XSS 窃取或不当注入），可调用本机 API。

**缓解**

- **Origin 白名单**：存在 `Origin` 头时必须在 `allowed_web_origins` 内。
- Web 应用应 **不** 将 `device_token` 持久化到可被第三方脚本读取的存储；BFF 仅服务端持有（产品约束，见 W-22）。

**残余风险**

- 若合法 Web 域发生 XSS，攻击面与 token 暴露面仍存在；需 CSP、HttpOnly Cookie 策略与最小权限 token（E-20）。

## 4. 更新劫持

**风险**：攻击者替换更新通道上的二进制，植入恶意版本。

**缓解（目标架构）**

- 使用 **Tauri updater + minisign/Ed25519** 签名；仅信任内置公钥对应的签名包。
- 发布管道与 GitHub Releases 权限最小化。

**当前 E-19 状态**

- 代码仓已预留后续接入 `tauri-plugin-updater` 与正式公钥的位置；**上线前**必须配置真实 `pubkey` 与 `endpoints`，并完成「篡改包拒绝安装」验收。

## 5. Path traversal 与越权访问

**风险**：`../../etc/passwd` 或符号链接跳出挂载根。

**缓解**

- 所有路径经 `canonicalize` 后必须 **`starts_with` 某一挂载根的 canonical 路径**。
- 单测覆盖 `../` 逃逸场景（`fs_ops`）。

**残余风险**

- Windows 路径大小写/前缀形式差异需在 E-20 联调中回归；必要时引入规范化库（SCALE-DEBT）。

## 6. 收据伪造与重放

**风险**：攻击者伪造 `POST .../receipts` 负载。

**缓解（E-20）**

- **HMAC-SHA256**，密钥为配对下发的 `device_secret`；服务端校验失败记审计 `connector.desktop.receipt_rejected`。

**Connector 侧**

- 签名体格式固定为 `PROTOCOL.md` 所述，与服务端解析一致。

## 7. 安全评审检查清单（摘要）

- [ ] 配对码熵与速率限制（E-20）是否足够防在线爆破  
- [ ] `device_token` 撤销与设备解绑后 Connector 行为（E-20）  
- [ ] 更新签名与公钥轮换流程  
- [ ] 本机配置目录权限与全磁盘加密策略（企业场景）  
- [ ] 隐私：`path_hash` 不上传明文路径，主网仅见哈希  

---

**文档版本**：v1  
**最后更新**：2026-03-24  
