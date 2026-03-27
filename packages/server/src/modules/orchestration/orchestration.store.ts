import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query, withTransaction } from "../../infra/db/client";
import { computeNextCronFireIso } from "./orchestration-cron";
import type {
  OrchestrationRun,
  OrchestrationRunStatus,
  OrchestrationStepRow,
  OrchestrationStepStatus,
  TopologySource,
  TopologyStepSpec,
} from "./orchestration.types";

const runsMem = new Map<string, OrchestrationRun>();
const stepsMem = new Map<string, OrchestrationStepRow[]>();

const nowIso = (): string => new Date().toISOString();

const parseStepsJson = (raw: TopologyStepSpec[] | string): TopologyStepSpec[] =>
  typeof raw === "string" ? (JSON.parse(raw) as TopologyStepSpec[]) : raw;

const mergeInputMappingForRow = (spec: TopologyStepSpec): Record<string, unknown> | null => {
  const o = { ...spec.field_mapping, ...spec.input_mapping };
  return Object.keys(o).length > 0 ? o : null;
};

const buildStepRowsForRun = (runId: string, stepsSpec: TopologyStepSpec[]): OrchestrationStepRow[] =>
  stepsSpec.map((spec, idx) => ({
    id: randomUUID(),
    run_id: runId,
    step_index: idx,
    agent_id: spec.agent_id,
    status: "pending" as const,
    input_json: null,
    output_json: null,
    run_id_per_step: randomUUID(),
    started_at: null,
    finished_at: null,
    pending_invocation_id: null,
    error_message: null,
    output_schema: spec.output_schema ?? null,
    input_mapping: mergeInputMappingForRow(spec),
    output_snapshot: null,
    lease_expires_at: null,
  }));

const mapRunRow = (row: Record<string, unknown>): OrchestrationRun => ({
  id: row.id as string,
  conversation_id: row.conversation_id as string,
  user_id: row.user_id as string,
  topology_source: row.topology_source as TopologySource,
  steps_json: parseStepsJson(row.steps_json as TopologyStepSpec[] | string),
  current_step: Number(row.current_step),
  status: row.status as OrchestrationRunStatus,
  user_message: (row.user_message as string) ?? "",
  idempotency_key: (row.idempotency_key as string | null) ?? null,
  step_timeout_ms: Number(row.step_timeout_ms),
  cancel_requested: Boolean(row.cancel_requested),
  paused_reason: (row.paused_reason as string | null) ?? null,
  created_at: row.created_at as string,
  updated_at: row.updated_at as string,
  finished_at: (row.finished_at as string | null) ?? null,
  schedule_cron: (row.schedule_cron as string | null) ?? null,
  next_run_at: (row.next_run_at as string | null) ?? null,
});

const mapStepRow = (row: Record<string, unknown>): OrchestrationStepRow => ({
  id: row.id as string,
  run_id: row.run_id as string,
  step_index: Number(row.step_index),
  agent_id: row.agent_id as string,
  status: row.status as OrchestrationStepStatus,
  input_json: (row.input_json as Record<string, unknown> | null) ?? null,
  output_json: (row.output_json as Record<string, unknown> | null) ?? null,
  run_id_per_step: row.run_id_per_step as string,
  started_at: (row.started_at as string | null) ?? null,
  finished_at: (row.finished_at as string | null) ?? null,
  pending_invocation_id: (row.pending_invocation_id as string | null) ?? null,
  error_message: (row.error_message as string | null) ?? null,
  output_schema: (row.output_schema as Record<string, unknown> | null) ?? null,
  input_mapping: (row.input_mapping as Record<string, unknown> | null) ?? null,
  output_snapshot: (row.output_snapshot as Record<string, unknown> | null) ?? null,
  lease_expires_at: (row.lease_expires_at as string | null) ?? null,
});

export const resetOrchestrationStore = (): void => {
  runsMem.clear();
  stepsMem.clear();
};

export interface CreateOrchestrationRunInput {
  conversationId: string;
  userId: string;
  topologySource: TopologySource;
  steps: TopologyStepSpec[];
  userMessage: string;
  idempotencyKey?: string;
  stepTimeoutMs: number;
  scheduleCron?: string;
  /** Tests / deterministic scheduler */
  nextRunAtIso?: string;
}

const runSelectList = `id, conversation_id, user_id, topology_source, steps_json, current_step, status, user_message,
            idempotency_key, step_timeout_ms, cancel_requested, paused_reason,
            created_at::text AS created_at, updated_at::text AS updated_at, finished_at::text AS finished_at,
            schedule_cron, next_run_at::text AS next_run_at`;

const stepSelectList = `id, run_id, step_index, agent_id, status, input_json, output_json, run_id_per_step,
            started_at::text, finished_at::text, pending_invocation_id, error_message,
            output_schema, input_mapping, output_snapshot, lease_expires_at::text AS lease_expires_at`;

/** Same user + idempotency_key → reuse snapshot (any terminal state) for client retries (E-5). */
export const findRunByUserIdempotencyKeyAsync = async (
  userId: string,
  idempotencyKey: string,
): Promise<OrchestrationRun | null> => {
  if (!isPostgresEnabled()) {
    let best: OrchestrationRun | null = null;
    for (const run of runsMem.values()) {
      if (run.user_id === userId && run.idempotency_key === idempotencyKey) {
        if (!best || run.created_at > best.created_at) best = run;
      }
    }
    return best;
  }

  const rows = await query<Record<string, unknown>>(
    `SELECT ${runSelectList}
     FROM orchestration_runs
     WHERE user_id = $1 AND idempotency_key = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, idempotencyKey],
  );
  return rows[0] ? mapRunRow(rows[0]) : null;
};

export const createOrchestrationRunWithStepsAsync = async (
  input: CreateOrchestrationRunInput,
): Promise<{ run: OrchestrationRun; steps: OrchestrationStepRow[] }> => {
  const runId = randomUUID();
  const ts = nowIso();
  const scheduled = Boolean(input.scheduleCron?.trim());
  const nextRunAt =
    scheduled && input.scheduleCron
      ? (input.nextRunAtIso ?? computeNextCronFireIso(input.scheduleCron, new Date()))
      : null;

  const run: OrchestrationRun = {
    id: runId,
    conversation_id: input.conversationId,
    user_id: input.userId,
    topology_source: input.topologySource,
    steps_json: input.steps,
    current_step: 0,
    status: scheduled ? "scheduled" : "running",
    user_message: input.userMessage,
    idempotency_key: input.idempotencyKey ?? null,
    step_timeout_ms: input.stepTimeoutMs,
    cancel_requested: false,
    paused_reason: null,
    created_at: ts,
    updated_at: ts,
    finished_at: null,
    schedule_cron: scheduled ? input.scheduleCron!.trim() : null,
    next_run_at: nextRunAt,
  };

  const steps = buildStepRowsForRun(runId, input.steps);

  if (!isPostgresEnabled()) {
    runsMem.set(runId, run);
    stepsMem.set(runId, steps);
    return { run, steps };
  }

  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO orchestration_runs (
        id, conversation_id, user_id, topology_source, steps_json, current_step, status, user_message,
        idempotency_key, step_timeout_ms, cancel_requested, paused_reason, created_at, updated_at, finished_at,
        schedule_cron, next_run_at
      ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        run.id,
        run.conversation_id,
        run.user_id,
        run.topology_source,
        JSON.stringify(run.steps_json),
        run.current_step,
        run.status,
        run.user_message,
        run.idempotency_key,
        run.step_timeout_ms,
        run.cancel_requested,
        run.paused_reason,
        run.created_at,
        run.updated_at,
        run.finished_at,
        run.schedule_cron,
        run.next_run_at,
      ],
    );

    for (const s of steps) {
      await client.query(
        `INSERT INTO orchestration_steps (
          id, run_id, step_index, agent_id, status, input_json, output_json, run_id_per_step,
          started_at, finished_at, pending_invocation_id, error_message,
          output_schema, input_mapping, output_snapshot, lease_expires_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16)`,
        [
          s.id,
          s.run_id,
          s.step_index,
          s.agent_id,
          s.status,
          s.input_json,
          s.output_json,
          s.run_id_per_step,
          s.started_at,
          s.finished_at,
          s.pending_invocation_id,
          s.error_message,
          s.output_schema ? JSON.stringify(s.output_schema) : null,
          s.input_mapping ? JSON.stringify(s.input_mapping) : null,
          s.output_snapshot ? JSON.stringify(s.output_snapshot) : null,
          s.lease_expires_at,
        ],
      );
    }
  });

  return { run, steps };
};

export const getOrchestrationRunAsync = async (runId: string): Promise<OrchestrationRun | null> => {
  if (!isPostgresEnabled()) {
    return runsMem.get(runId) ?? null;
  }
  const rows = await query<Record<string, unknown>>(`SELECT ${runSelectList} FROM orchestration_runs WHERE id = $1`, [
    runId,
  ]);
  return rows[0] ? mapRunRow(rows[0]) : null;
};

/** 用户名下所有仍带 cron 的编排 Run（含运行中 / 等待调度 / 用户暂停等），不含已取消。 */
export const listUserScheduledOrchestrationRunsAsync = async (
  userId: string,
  limit = 80,
): Promise<OrchestrationRun[]> => {
  if (!isPostgresEnabled()) {
    return [...runsMem.values()]
      .filter(
        (r) =>
          r.user_id === userId &&
          Boolean(r.schedule_cron?.trim()) &&
          r.status !== "canceled",
      )
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  }

  const rows = await query<Record<string, unknown>>(
    `SELECT ${runSelectList}
     FROM orchestration_runs
     WHERE user_id = $1
       AND schedule_cron IS NOT NULL
       AND TRIM(schedule_cron) <> ''
       AND status <> 'canceled'
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return rows.map(mapRunRow);
};

export const listOrchestrationStepsAsync = async (runId: string): Promise<OrchestrationStepRow[]> => {
  if (!isPostgresEnabled()) {
    return [...(stepsMem.get(runId) ?? [])].sort((a, b) => a.step_index - b.step_index);
  }
  const rows = await query<Record<string, unknown>>(
    `SELECT ${stepSelectList} FROM orchestration_steps WHERE run_id = $1 ORDER BY step_index ASC`,
    [runId],
  );
  return rows.map(mapStepRow);
};

export const updateOrchestrationRunAsync = async (
  runId: string,
  patch: Partial<
    Pick<
      OrchestrationRun,
      | "current_step"
      | "status"
      | "cancel_requested"
      | "paused_reason"
      | "updated_at"
      | "finished_at"
      | "schedule_cron"
      | "next_run_at"
    >
  >,
): Promise<void> => {
  const updatedAt = patch.updated_at ?? nowIso();
  if (!isPostgresEnabled()) {
    const r = runsMem.get(runId);
    if (!r) return;
    runsMem.set(runId, {
      ...r,
      ...patch,
      updated_at: updatedAt,
    });
    return;
  }

  const sets: string[] = ["updated_at = $2"];
  const vals: unknown[] = [runId, updatedAt];
  let i = 3;
  if (patch.current_step !== undefined) {
    sets.push(`current_step = $${i}`);
    vals.push(patch.current_step);
    i++;
  }
  if (patch.status !== undefined) {
    sets.push(`status = $${i}`);
    vals.push(patch.status);
    i++;
  }
  if (patch.cancel_requested !== undefined) {
    sets.push(`cancel_requested = $${i}`);
    vals.push(patch.cancel_requested);
    i++;
  }
  if (patch.paused_reason !== undefined) {
    sets.push(`paused_reason = $${i}`);
    vals.push(patch.paused_reason);
    i++;
  }
  if (patch.finished_at !== undefined) {
    sets.push(`finished_at = $${i}`);
    vals.push(patch.finished_at);
    i++;
  }
  if (patch.schedule_cron !== undefined) {
    sets.push(`schedule_cron = $${i}`);
    vals.push(patch.schedule_cron);
    i++;
  }
  if (patch.next_run_at !== undefined) {
    sets.push(`next_run_at = $${i}`);
    vals.push(patch.next_run_at);
    i++;
  }

  await query(`UPDATE orchestration_runs SET ${sets.join(", ")} WHERE id = $1`, vals);
};

export const updateOrchestrationStepAsync = async (
  stepId: string,
  patch: Partial<
    Pick<
      OrchestrationStepRow,
      | "status"
      | "input_json"
      | "output_json"
      | "run_id_per_step"
      | "started_at"
      | "finished_at"
      | "pending_invocation_id"
      | "error_message"
      | "output_schema"
      | "input_mapping"
      | "output_snapshot"
      | "lease_expires_at"
    >
  >,
): Promise<void> => {
  if (!isPostgresEnabled()) {
    for (const list of stepsMem.values()) {
      const s = list.find((x) => x.id === stepId);
      if (s) {
        Object.assign(s, patch);
        return;
      }
    }
    return;
  }

  const sets: string[] = [];
  const vals: unknown[] = [stepId];
  let i = 2;
  const push = (col: string, v: unknown): void => {
    sets.push(`${col} = $${i}`);
    vals.push(v);
    i++;
  };
  if (patch.status !== undefined) push("status", patch.status);
  if (patch.input_json !== undefined) push("input_json", patch.input_json);
  if (patch.output_json !== undefined) push("output_json", patch.output_json);
  if (patch.run_id_per_step !== undefined) push("run_id_per_step", patch.run_id_per_step);
  if (patch.started_at !== undefined) push("started_at", patch.started_at);
  if (patch.finished_at !== undefined) push("finished_at", patch.finished_at);
  if (patch.pending_invocation_id !== undefined) push("pending_invocation_id", patch.pending_invocation_id);
  if (patch.error_message !== undefined) push("error_message", patch.error_message);
  if (patch.output_schema !== undefined) push("output_schema", patch.output_schema);
  if (patch.input_mapping !== undefined) push("input_mapping", patch.input_mapping);
  if (patch.output_snapshot !== undefined) push("output_snapshot", patch.output_snapshot);
  if (patch.lease_expires_at !== undefined) push("lease_expires_at", patch.lease_expires_at);
  if (sets.length === 0) return;
  await query(`UPDATE orchestration_steps SET ${sets.join(", ")} WHERE id = $1`, vals);
};

export const getOrchestrationStepByRunAndIndexAsync = async (
  runId: string,
  stepIndex: number,
): Promise<OrchestrationStepRow | null> => {
  const steps = await listOrchestrationStepsAsync(runId);
  return steps.find((s) => s.step_index === stepIndex) ?? null;
};

export const refreshStepRunIdPerStepAsync = async (stepId: string): Promise<string> => {
  const newId = randomUUID();
  await updateOrchestrationStepAsync(stepId, { run_id_per_step: newId });
  return newId;
};

/** B 类：下一轮执行前将步骤重置为 pending（同一 run_id）。 */
export const resetOrchestrationStepsForRunAsync = async (runId: string): Promise<void> => {
  const run = await getOrchestrationRunAsync(runId);
  if (!run) return;
  const steps = buildStepRowsForRun(runId, run.steps_json);

  if (!isPostgresEnabled()) {
    stepsMem.set(runId, steps);
    return;
  }

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM orchestration_steps WHERE run_id = $1`, [runId]);
    for (const s of steps) {
      await client.query(
        `INSERT INTO orchestration_steps (
          id, run_id, step_index, agent_id, status, input_json, output_json, run_id_per_step,
          started_at, finished_at, pending_invocation_id, error_message,
          output_schema, input_mapping, output_snapshot, lease_expires_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16)`,
        [
          s.id,
          s.run_id,
          s.step_index,
          s.agent_id,
          s.status,
          s.input_json,
          s.output_json,
          s.run_id_per_step,
          s.started_at,
          s.finished_at,
          s.pending_invocation_id,
          s.error_message,
          s.output_schema ? JSON.stringify(s.output_schema) : null,
          s.input_mapping ? JSON.stringify(s.input_mapping) : null,
          s.output_snapshot ? JSON.stringify(s.output_snapshot) : null,
          s.lease_expires_at,
        ],
      );
    }
  });
};

/** 领取到期的 B 类 Run（`scheduled` → `running`），用于租约式单实例抢占。 */
export const claimScheduledRunsDueAsync = async (limit = 5): Promise<OrchestrationRun[]> => {
  if (!isPostgresEnabled()) {
    const now = Date.now();
    const due: OrchestrationRun[] = [];
    for (const run of runsMem.values()) {
      if (
        run.status === "scheduled" &&
        run.schedule_cron &&
        run.next_run_at &&
        Date.parse(run.next_run_at) <= now
      ) {
        due.push(run);
      }
    }
    due.sort((a, b) => Date.parse(a.next_run_at!) - Date.parse(b.next_run_at!));
    const picked = due.slice(0, limit);
    const out: OrchestrationRun[] = [];
    for (const r of picked) {
      const ts = nowIso();
      runsMem.set(r.id, { ...r, status: "running", updated_at: ts, current_step: 0 });
      out.push({ ...r, status: "running", updated_at: ts, current_step: 0 });
    }
    return out;
  }

  const rows = await query<Record<string, unknown>>(
    `WITH cte AS (
       SELECT id FROM orchestration_runs
       WHERE status = 'scheduled'
         AND schedule_cron IS NOT NULL
         AND next_run_at IS NOT NULL
         AND next_run_at <= NOW()
       ORDER BY next_run_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     UPDATE orchestration_runs r
     SET status = 'running', updated_at = NOW(), current_step = 0
     FROM cte
     WHERE r.id = cte.id
     RETURNING r.id, r.conversation_id, r.user_id, r.topology_source, r.steps_json, r.current_step, r.status,
               r.user_message, r.idempotency_key, r.step_timeout_ms, r.cancel_requested, r.paused_reason,
               r.created_at::text, r.updated_at::text, r.finished_at::text, r.schedule_cron,
               r.next_run_at::text AS next_run_at`,
    [limit],
  );
  return rows.map(mapRunRow);
};
