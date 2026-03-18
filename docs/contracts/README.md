# Mainline API contract baseline

**Contract drift** (`npm run contracts:drift:mainline`) compares the in-process server snapshot to the frozen file:

`mainline-api-contract-baseline.v1.json`

## First-time setup (required before drift is meaningful)

After API shape changes intentionally, or on a **fresh clone** where the baseline file was never committed, you must initialize it once:

```bash
node --import tsx scripts/mainline-contract-drift-report.ts --init-baseline
```

Then commit `docs/contracts/mainline-api-contract-baseline.v1.json`. Until this file exists, the drift script exits with a clear error (no silent ENOENT).

## Updating the baseline

When a contract change is **approved**, re-run `--init-baseline` and commit the updated JSON as part of that change.
