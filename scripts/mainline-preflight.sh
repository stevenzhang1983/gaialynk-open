#!/usr/bin/env bash
set -euo pipefail

echo "[preflight] mainline typecheck"
npm run typecheck

echo "[preflight] frozen contract compatibility"
npm run test:contracts:mainline

echo "[preflight] contract drift report"
npm run contracts:drift:mainline

echo "[preflight] full test suite"
npm test

echo "[preflight] target service reachability (if MAINLINE_BASE_URL is set)"
node --import tsx scripts/mainline-check-target-reachable.ts

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "[preflight] postgres integration"
  npm run test:pg
else
  echo "[preflight] skip postgres integration (DATABASE_URL not set)"
fi

echo "[preflight] completed"
