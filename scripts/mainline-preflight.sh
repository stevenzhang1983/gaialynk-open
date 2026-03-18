#!/usr/bin/env bash
set -euo pipefail

echo "[preflight] mainline typecheck"
npm run typecheck

echo "[preflight] frozen contract compatibility"
env -u DATABASE_URL npm run test:contracts:mainline

echo "[preflight] contract drift report"
env -u DATABASE_URL npm run contracts:drift:mainline

echo "[preflight] full test suite (isolated, no DATABASE_URL)"
# Keep the full suite deterministic: do not let repository-wide tests hit staging/prod DB.
env -u DATABASE_URL npm test

echo "[preflight] target service reachability"
node --import tsx scripts/mainline-check-target-reachable.ts

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[preflight] DATABASE_URL is required"
  exit 1
fi
echo "[preflight] postgres integration"
npm run test:pg

echo "[preflight] completed"
