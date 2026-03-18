# 手动三连门禁 Workflow（Secrets 与证据链）

## 触发方式

GitHub → **Actions** → **Release gate manual (triple)** → **Run workflow**。

## 必填 Repository Secrets

| Secret | 说明 |
|--------|------|
| `MAINLINE_BASE_URL` | 主线 staging，如 `https://gaialynk-a2a-production.up.railway.app` |
| `ACTOR_TRUST_TOKEN` | 与 Railway 主线一致 |
| `MAINLINE_API_URL` | 通常等于 `MAINLINE_BASE_URL` |
| `MAINLINE_ACTOR_TRUST_TOKEN` | 与 `ACTOR_TRUST_TOKEN` 相同 |
| `NEXT_PUBLIC_SITE_URL` | Staging 官网，如 `https://gaialynk-a2a.vercel.app` |

> `DATABASE_URL` 不是此 workflow 的必填 Secret。`test:pg` 在 workflow 内使用 CI Postgres service（`postgresql://postgres:postgres@127.0.0.1:5432/gaialynk_ci`），避免真实 staging 数据库污染导致的非确定性失败。
> workflow 在三连门禁前会先执行一次 `npm run db:migrate`（针对 CI Postgres service）。

## 产出物

- 成功或失败均上传 **artifact**：`triple-gate-logs-<run_id>-<attempt>`，内含 `triple-gate-full.log`（完整 stdout/stderr）。
- 额外上传 staging 证据：`staging-mainline-health.json` 与 `staging-mainline-meta.json`。
- **Go 评审**：以 workflow 成功 + 上述日志为输入；失败时根据日志修根因后重跑。

## 可调（reachability，可选）

- `MAINLINE_REACHABILITY_TIMEOUT_MS`（默认 20000）
- `MAINLINE_REACHABILITY_RETRIES`（默认 1，共 2 次尝试）
- `MAINLINE_REACHABILITY_RETRY_DELAY_MS`（默认 1000）

可在 workflow 的 `env` 中追加（需改 YAML）。
