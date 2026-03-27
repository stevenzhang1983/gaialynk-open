import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type RetestQueueStatus = "pending" | "completed" | "cancelled";

export interface AgentRetestQueueRow {
  id: string;
  agent_id: string;
  reason_code: string;
  feedback_count: number;
  status: RetestQueueStatus;
  created_at: string;
}

const memoryQueue: AgentRetestQueueRow[] = [];

const nowIso = (): string => new Date().toISOString();

export const hasPendingRetestForAgentReasonAsync = async (
  agentId: string,
  reasonCode: string,
): Promise<boolean> => {
  if (!isPostgresEnabled()) {
    return memoryQueue.some(
      (r) => r.agent_id === agentId && r.reason_code === reasonCode && r.status === "pending",
    );
  }
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM agent_retest_queue
     WHERE agent_id = $1 AND reason_code = $2 AND status = 'pending'`,
    [agentId, reasonCode],
  );
  return Number(rows[0]?.n ?? "0") > 0;
};

export const enqueueAgentRetestAsync = async (input: {
  agent_id: string;
  reason_code: string;
  feedback_count: number;
}): Promise<AgentRetestQueueRow> => {
  const row: AgentRetestQueueRow = {
    id: randomUUID(),
    agent_id: input.agent_id,
    reason_code: input.reason_code,
    feedback_count: input.feedback_count,
    status: "pending",
    created_at: nowIso(),
  };
  if (!isPostgresEnabled()) {
    memoryQueue.push(row);
    return row;
  }
  await query(
    `INSERT INTO agent_retest_queue (id, agent_id, reason_code, feedback_count, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [row.id, row.agent_id, row.reason_code, row.feedback_count, row.status, row.created_at],
  );
  return row;
};

export const listAgentRetestQueueAsync = async (opts?: {
  status?: RetestQueueStatus;
  limit?: number;
}): Promise<AgentRetestQueueRow[]> => {
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 50));
  const status = opts?.status ?? "pending";
  if (!isPostgresEnabled()) {
    return memoryQueue
      .filter((r) => r.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  return query<AgentRetestQueueRow>(
    `SELECT id, agent_id, reason_code, feedback_count, status, created_at::text
     FROM agent_retest_queue
     WHERE status = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [status, limit],
  );
};

export const resetAgentRetestQueueStore = (): void => {
  if (!isPostgresEnabled()) memoryQueue.length = 0;
};
