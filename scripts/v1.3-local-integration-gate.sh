#!/usr/bin/env bash
# V1.3 本地联调：Postgres → 迁移 → 主网 :3000 → 官网 release:gate（含 api-health，不设 SKIP）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-postgres://gaialynk:gaialynk@127.0.0.1:5432/gaialynk}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[integration] 未找到 docker，请先安装 Docker Desktop / CLI。"
  exit 2
fi

if ! docker info >/dev/null 2>&1; then
  echo "[integration] Docker daemon 未运行。请启动 Docker Desktop 后重试。"
  exit 2
fi

echo "[integration] 启动 Postgres（docker compose）…"
docker compose up -d postgres

echo "[integration] 等待数据库就绪…"
for i in $(seq 1 40); do
  if docker compose exec -T postgres pg_isready -U gaialynk -d gaialynk >/dev/null 2>&1; then
    echo "[integration] Postgres ready."
    break
  fi
  if [[ "$i" -eq 40 ]]; then
    echo "[integration] Postgres 超时未就绪。"
    exit 1
  fi
  sleep 1
done

echo "[integration] 执行迁移…"
npm run db:migrate

PORT="${PORT:-3000}"
export PORT
MAINLINE_PID=""
cleanup() {
  if [[ -n "${MAINLINE_PID}" ]] && kill -0 "${MAINLINE_PID}" 2>/dev/null; then
    echo "[integration] 停止主网 (pid ${MAINLINE_PID})…"
    kill "${MAINLINE_PID}" 2>/dev/null || true
    wait "${MAINLINE_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "[integration] 启动主网 http://127.0.0.1:${PORT} …"
node --import tsx packages/server/src/index.ts &
MAINLINE_PID=$!

echo "[integration] 等待主网可访问…"
for i in $(seq 1 80); do
  if curl -sf -o /dev/null "http://127.0.0.1:${PORT}/api/v1/conversations"; then
    echo "[integration] 主网已响应。"
    break
  fi
  if ! kill -0 "${MAINLINE_PID}" 2>/dev/null; then
    echo "[integration] 主网进程已退出，请查看上方日志。"
    exit 1
  fi
  if [[ "$i" -eq 80 ]]; then
    echo "[integration] 主网启动超时。"
    exit 1
  fi
  sleep 0.25
done

echo "[integration] 官网发布门禁（含 MAINLINE API 健康探测，MAINLINE_API_URL 默认 http://localhost:${PORT}）…"
cd packages/website
unset RELEASE_GATE_SKIP_API_HEALTH || true
export MAINLINE_API_URL="${MAINLINE_API_URL:-http://127.0.0.1:${PORT}}"
npm run release:gate

echo "[integration] 联调门禁通过。"
