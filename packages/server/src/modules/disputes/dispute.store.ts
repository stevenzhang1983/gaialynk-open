import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface Dispute {
  id: string;
  task_instance_id: string;
  reporter_id: string;
  reason: string;
  evidence_refs: string[];
  status: "open" | "resolved";
  decision?: "accepted" | "rejected";
  arbitration_note?: string;
  created_at: string;
  updated_at: string;
}

const disputes = new Map<string, Dispute>();

const nowIso = (): string => new Date().toISOString();

type DisputeRow = {
  id: string;
  task_instance_id: string;
  reporter_id: string;
  reason: string;
  evidence_refs: string[] | string;
  status: "open" | "resolved";
  decision?: "accepted" | "rejected";
  arbitration_note?: string;
  created_at: string;
  updated_at: string;
};

const toDispute = (row: DisputeRow): Dispute => ({
  ...row,
  evidence_refs:
    typeof row.evidence_refs === "string"
      ? (JSON.parse(row.evidence_refs) as string[])
      : row.evidence_refs,
});

export const createDisputeAsync = async (input: {
  taskInstanceId: string;
  reporterId: string;
  reason: string;
  evidenceRefs: string[];
}): Promise<Dispute> => {
  const now = nowIso();
  const dispute: Dispute = {
    id: randomUUID(),
    task_instance_id: input.taskInstanceId,
    reporter_id: input.reporterId,
    reason: input.reason,
    evidence_refs: input.evidenceRefs,
    status: "open",
    created_at: now,
    updated_at: now,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO disputes
       (id, task_instance_id, reporter_id, reason, evidence_refs, status, decision, arbitration_note, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)`,
      [
        dispute.id,
        dispute.task_instance_id,
        dispute.reporter_id,
        dispute.reason,
        JSON.stringify(dispute.evidence_refs),
        dispute.status,
        null,
        null,
        dispute.created_at,
        dispute.updated_at,
      ],
    );
  } else {
    disputes.set(dispute.id, dispute);
  }
  return dispute;
};

export const getDisputeByIdAsync = async (disputeId: string): Promise<Dispute | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<DisputeRow>(
      `SELECT id, task_instance_id, reporter_id, reason, evidence_refs, status, decision, arbitration_note, created_at::text, updated_at::text
       FROM disputes
       WHERE id = $1`,
      [disputeId],
    );
    return rows[0] ? toDispute(rows[0]) : null;
  }
  return disputes.get(disputeId) ?? null;
};

export const arbitrateDisputeAsync = async (input: {
  disputeId: string;
  decision: "accepted" | "rejected";
  note: string;
}): Promise<Dispute | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<DisputeRow>(
      `UPDATE disputes
       SET status = 'resolved', decision = $2, arbitration_note = $3, updated_at = $4
       WHERE id = $1
       RETURNING id, task_instance_id, reporter_id, reason, evidence_refs, status, decision, arbitration_note, created_at::text, updated_at::text`,
      [input.disputeId, input.decision, input.note, nowIso()],
    );
    return rows[0] ? toDispute(rows[0]) : null;
  }
  const dispute = disputes.get(input.disputeId);
  if (!dispute) return null;
  const updated: Dispute = {
    ...dispute,
    status: "resolved",
    decision: input.decision,
    arbitration_note: input.note,
    updated_at: nowIso(),
  };
  disputes.set(dispute.id, updated);
  return updated;
};

export const resetDisputeStore = (): void => {
  if (isPostgresEnabled()) {
    return;
  }
  disputes.clear();
};
