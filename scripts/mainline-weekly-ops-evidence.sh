#!/usr/bin/env bash
set -euo pipefail

WEEK_LABEL="${1:-$(date +%G-W%V)}"
REPORT_DIR="reports/mainline-ops"
REPORT_PATH="${REPORT_DIR}/weekly-ops-evidence-${WEEK_LABEL}.md"
PORT="${MAINLINE_WEEKLY_DRILL_PORT:-3011}"
BASE_URL="http://localhost:${PORT}"

mkdir -p "${REPORT_DIR}"

run_and_capture() {
  local cmd="$1"
  local output
  set +e
  output=$(eval "$cmd" 2>&1)
  local code=$?
  set -e
  echo "$output"
  return $code
}

{
  echo "# Mainline Weekly Ops Evidence (${WEEK_LABEL})"
  echo
  echo "Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo
} > "${REPORT_PATH}"

echo "[weekly] run preflight"
PRELIGHT_OUTPUT="$(run_and_capture "npm run release:preflight:mainline")"
{
  echo "## 1) Preflight"
  echo
  echo '```text'
  echo "${PRELIGHT_OUTPUT}"
  echo '```'
  echo
} >> "${REPORT_PATH}"

echo "[weekly] start local server on ${PORT}"
PORT="${PORT}" node --import tsx packages/server/src/index.ts > /tmp/mainline-weekly-server.log 2>&1 &
SERVER_PID=$!
trap 'kill ${SERVER_PID} >/dev/null 2>&1 || true' EXIT
sleep 1

echo "[weekly] run smoke success path"
SMOKE_SUCCESS_OUTPUT="$(run_and_capture "MAINLINE_BASE_URL=${BASE_URL} npm run release:smoke:mainline")"
{
  echo "## 2) Post-release smoke (success path)"
  echo
  echo '```text'
  echo "${SMOKE_SUCCESS_OUTPUT}"
  echo '```'
  echo
} >> "${REPORT_PATH}"

echo "[weekly] run smoke expected-failure drill"
EXPECTED_FAILURE_OUTPUT=""
set +e
EXPECTED_FAILURE_OUTPUT=$(MAINLINE_BASE_URL="http://127.0.0.1:9" npm run release:smoke:mainline 2>&1)
FAILURE_EXIT_CODE=$?
set -e
if [[ ${FAILURE_EXIT_CODE} -eq 0 ]]; then
  echo "[weekly] expected failure drill unexpectedly passed" >&2
  exit 1
fi
{
  echo "## 3) Rollback drill (expected failure scenario)"
  echo
  echo "Failure scenario command exit code: ${FAILURE_EXIT_CODE}"
  echo
  echo '```text'
  echo "${EXPECTED_FAILURE_OUTPUT}"
  echo '```'
  echo
  echo "Rollback action checklist:"
  echo "1. Freeze release window;"
  echo "2. Roll back to previous stable ref;"
  echo "3. Re-run smoke on rolled-back ref;"
  echo "4. File incident with root cause and owner."
  echo
} >> "${REPORT_PATH}"

kill "${SERVER_PID}" >/dev/null 2>&1 || true
trap - EXIT

echo "[weekly] report generated at ${REPORT_PATH}"
