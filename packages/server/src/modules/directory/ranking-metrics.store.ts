import { isPostgresEnabled, query } from "../../infra/db/client";

export type ReputationGrade = "A" | "B" | "C" | "D";

export interface AgentRankingMetrics {
  completed: number;
  failed: number;
  denied: number;
  need_confirmation: number;
  recent_completed: number;
  recent_failed: number;
  reputation_score: number;
  reputation_grade: ReputationGrade;
  recent_error_rate: number;
}

function gradeFromScore(score: number): ReputationGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function computeReputation(completed: number, failed: number, denied: number, need_confirmation: number): {
  score: number;
  grade: ReputationGrade;
} {
  const rawScore =
    60 +
    completed * 8 -
    failed * 12 -
    denied * 10 -
    need_confirmation * 2;
  const reputation_score = Math.max(0, Math.min(100, rawScore));
  return { score: reputation_score, grade: gradeFromScore(reputation_score) };
}

/** Batch-load invocation stats for directory ranking (E-9). */
export async function getBatchAgentRankingMetricsAsync(
  agentIds: string[],
  recentWindowDays = 30,
): Promise<Record<string, AgentRankingMetrics>> {
  const out: Record<string, AgentRankingMetrics> = {};
  if (agentIds.length === 0) return out;
  if (!isPostgresEnabled()) {
    for (const id of agentIds) {
      const { score, grade } = computeReputation(0, 0, 0, 0);
      out[id] = {
        completed: 0,
        failed: 0,
        denied: 0,
        need_confirmation: 0,
        recent_completed: 0,
        recent_failed: 0,
        reputation_score: score,
        reputation_grade: grade,
        recent_error_rate: 0,
      };
    }
    return out;
  }

  const allTimeRows = await query<{
    agent_id: string;
    completed: string;
    failed: string;
    denied: string;
    need_confirmation: string;
  }>(
    `SELECT agent_id::text AS agent_id,
            COUNT(*) FILTER (WHERE event_type = 'invocation.completed')::text AS completed,
            COUNT(*) FILTER (WHERE event_type = 'invocation.failed')::text AS failed,
            COUNT(*) FILTER (WHERE event_type = 'invocation.denied')::text AS denied,
            COUNT(*) FILTER (WHERE event_type = 'invocation.need_confirmation')::text AS need_confirmation
     FROM audit_events
     WHERE agent_id = ANY($1::uuid[])
     GROUP BY agent_id`,
    [agentIds],
  );

  const recentRows = await query<{ agent_id: string; rc: string; rf: string }>(
    `SELECT agent_id::text AS agent_id,
            COUNT(*) FILTER (WHERE event_type = 'invocation.completed')::text AS rc,
            COUNT(*) FILTER (WHERE event_type = 'invocation.failed')::text AS rf
     FROM audit_events
     WHERE agent_id = ANY($1::uuid[])
       AND created_at >= now() - ($2::integer * interval '1 day')
     GROUP BY agent_id`,
    [agentIds, recentWindowDays],
  );
  const recentMap = new Map(recentRows.map((r) => [r.agent_id, r]));

  const byId = new Map(allTimeRows.map((r) => [r.agent_id, r]));
  for (const id of agentIds) {
    const row = byId.get(id);
    const completed = Number(row?.completed ?? "0");
    const failed = Number(row?.failed ?? "0");
    const denied = Number(row?.denied ?? "0");
    const need_confirmation = Number(row?.need_confirmation ?? "0");
    const rec = recentMap.get(id);
    const recent_completed = Number(rec?.rc ?? "0");
    const recent_failed = Number(rec?.rf ?? "0");
    const denom = recent_completed + recent_failed;
    const recent_error_rate = denom > 0 ? recent_failed / denom : 0;
    const { score, grade } = computeReputation(completed, failed, denied, need_confirmation);
    out[id] = {
      completed,
      failed,
      denied,
      need_confirmation,
      recent_completed,
      recent_failed,
      reputation_score: score,
      reputation_grade: grade,
      recent_error_rate,
    };
  }
  return out;
}

export async function listNewListingImpressionCountsAsync(
  agentIds: string[],
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (agentIds.length === 0) return out;
  if (!isPostgresEnabled()) {
    for (const id of agentIds) out[id] = 0;
    return out;
  }
  const rows = await query<{ agent_id: string; impression_count: string }>(
    `SELECT agent_id::text AS agent_id, impression_count::text AS impression_count
     FROM directory_new_listing_impressions
     WHERE agent_id = ANY($1::uuid[])`,
    [agentIds],
  );
  for (const id of agentIds) out[id] = 0;
  for (const r of rows) out[r.agent_id] = Number(r.impression_count ?? "0");
  return out;
}

export async function incrementNewListingImpressionsAsync(agentIds: string[]): Promise<void> {
  if (agentIds.length === 0 || !isPostgresEnabled()) return;
  await query(
    `INSERT INTO directory_new_listing_impressions (agent_id, impression_count, updated_at)
     SELECT x::uuid, 1, now()
     FROM unnest($1::text[]) AS t(x)
     ON CONFLICT (agent_id) DO UPDATE SET
       impression_count = directory_new_listing_impressions.impression_count + 1,
       updated_at = now()`,
    [agentIds],
  );
}
