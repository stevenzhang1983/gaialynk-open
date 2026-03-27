import { isPostgresEnabled, query } from "../../infra/db/client";

export type RetentionTableName =
  | "messages"
  | "audit_events"
  | "receipts"
  | "invocations"
  | "orchestration_runs"
  | "external_action_receipts";

export interface RetentionTableResult {
  table: RetentionTableName;
  /** Rows matching age + not yet archived */
  candidate_count: number;
  /** Rows updated (0 when dryRun) */
  updated_count: number;
}

const TABLE_ORDER: RetentionTableName[] = [
  "receipts",
  "invocations",
  "external_action_receipts",
  "orchestration_runs",
  "messages",
  "audit_events",
];

function parseDaysEnv(key: string, fallbackDays: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallbackDays;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallbackDays;
}

/** TTL in days per table; env override `DATA_RETENTION_<TABLE>_DAYS` with table in UPPER_SNAKE. */
export function getRetentionDaysForTable(table: RetentionTableName): number {
  const envKey = `DATA_RETENTION_${table.toUpperCase()}_DAYS`;
  const defaults: Record<RetentionTableName, number> = {
    messages: 365,
    audit_events: 2555,
    receipts: 365,
    invocations: 365,
    orchestration_runs: 365,
    external_action_receipts: 365,
  };
  return parseDaysEnv(envKey, defaults[table]);
}

function retentionTimestampColumn(table: RetentionTableName): "created_at" | "issued_at" {
  return table === "receipts" ? "issued_at" : "created_at";
}

async function countCandidatesAsync(table: RetentionTableName, ttlDays: number): Promise<number> {
  const ts = retentionTimestampColumn(table);
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM ${table}
     WHERE archived = FALSE AND ${ts} < NOW() - ($1::bigint * INTERVAL '1 day')`,
    [ttlDays],
  );
  return Number(rows[0]?.n ?? "0");
}

async function archiveBatchAsync(table: RetentionTableName, ttlDays: number): Promise<number> {
  const ts = retentionTimestampColumn(table);
  const result = await query<{ n: string }>(
    `WITH u AS (
       UPDATE ${table}
       SET archived = TRUE, archived_at = NOW()
       WHERE archived = FALSE AND ${ts} < NOW() - ($1::bigint * INTERVAL '1 day')
       RETURNING 1
     ) SELECT COUNT(*)::text AS n FROM u`,
    [ttlDays],
  );
  return Number(result[0]?.n ?? "0");
}

/**
 * Marks expired rows as archived per Data Retention Matrix TTLs.
 * When `dryRun` is true, only returns candidate counts (no UPDATE).
 */
export async function runDataRetentionArchivalAsync(options: {
  dryRun: boolean;
}): Promise<{ results: RetentionTableResult[] }> {
  if (!isPostgresEnabled()) {
    return { results: [] };
  }

  const results: RetentionTableResult[] = [];
  for (const table of TABLE_ORDER) {
    const ttlDays = getRetentionDaysForTable(table);
    const candidate_count = await countCandidatesAsync(table, ttlDays);
    let updated_count = 0;
    if (!options.dryRun && candidate_count > 0) {
      updated_count = await archiveBatchAsync(table, ttlDays);
    }
    results.push({ table, candidate_count, updated_count });
  }
  return { results };
}

let retentionTimer: ReturnType<typeof setInterval> | undefined;

/** Optional 24h loop; enable with DATA_RETENTION_JOB_ENABLED=1 (requires DATABASE_URL). */
export function startDataRetentionJobLoop(intervalMs = 86_400_000): void {
  if (retentionTimer) return;
  if (process.env.DATA_RETENTION_JOB_ENABLED !== "1") return;
  if (!isPostgresEnabled()) return;
  retentionTimer = setInterval(() => {
    void runDataRetentionArchivalAsync({ dryRun: false }).catch(() => {});
  }, intervalMs);
}
