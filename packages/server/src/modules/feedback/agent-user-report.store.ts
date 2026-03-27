import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type AgentUserReportStatus = "pending" | "upheld" | "dismissed";

export interface AgentUserReport {
  id: string;
  agent_id: string;
  reporter_id: string;
  reason_code: string;
  detail: string | null;
  status: AgentUserReportStatus;
  created_at: string;
  resolved_at: string | null;
}

const memoryReports: AgentUserReport[] = [];

const nowIso = (): string => new Date().toISOString();

export const createAgentUserReportAsync = async (input: {
  agent_id: string;
  reporter_id: string;
  reason_code: string;
  detail?: string;
}): Promise<AgentUserReport> => {
  const row: AgentUserReport = {
    id: randomUUID(),
    agent_id: input.agent_id,
    reporter_id: input.reporter_id,
    reason_code: input.reason_code,
    detail: input.detail?.trim() ? input.detail.trim() : null,
    status: "pending",
    created_at: nowIso(),
    resolved_at: null,
  };
  if (!isPostgresEnabled()) {
    memoryReports.push(row);
    return row;
  }
  await query(
    `INSERT INTO agent_user_reports (id, agent_id, reporter_id, reason_code, detail, status, created_at, resolved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)`,
    [
      row.id,
      row.agent_id,
      row.reporter_id,
      row.reason_code,
      row.detail,
      row.status,
      row.created_at,
    ],
  );
  return row;
};

export const getAgentUserReportByIdAsync = async (id: string): Promise<AgentUserReport | null> => {
  if (!isPostgresEnabled()) {
    return memoryReports.find((r) => r.id === id) ?? null;
  }
  const rows = await query<AgentUserReport & { resolved_at: string | null }>(
    `SELECT id, agent_id, reporter_id, reason_code, detail, status, created_at::text, resolved_at::text
     FROM agent_user_reports WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

export const upholdAgentUserReportAsync = async (reportId: string): Promise<AgentUserReport | null> => {
  const resolvedAt = nowIso();
  if (!isPostgresEnabled()) {
    const r = memoryReports.find((x) => x.id === reportId);
    if (!r || r.status !== "pending") return null;
    r.status = "upheld";
    r.resolved_at = resolvedAt;
    return r;
  }
  const rows = await query<AgentUserReport>(
    `UPDATE agent_user_reports
     SET status = 'upheld', resolved_at = $2
     WHERE id = $1 AND status = 'pending'
     RETURNING id, agent_id, reporter_id, reason_code, detail, status, created_at::text, resolved_at::text`,
    [reportId, resolvedAt],
  );
  return rows[0] ?? null;
};

export const resetAgentUserReportStore = (): void => {
  if (!isPostgresEnabled()) memoryReports.length = 0;
};
