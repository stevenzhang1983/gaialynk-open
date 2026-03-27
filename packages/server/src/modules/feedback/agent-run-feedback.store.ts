import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { getAskRunByIdAsync } from "../ask/ask.store";

export type FeedbackUsefulness = "helpful" | "not_helpful" | "neutral";

export interface AgentRunFeedback {
  id: string;
  ask_run_id: string;
  agent_id: string;
  quality: number;
  speed: number;
  stability: number;
  meets_expectation: number;
  created_at: string;
  valid_run: boolean;
  usefulness?: FeedbackUsefulness | null;
  reason_code?: string | null;
}

const SCORE_MIN = 1;
const SCORE_MAX = 5;

const feedbackList: AgentRunFeedback[] = [];

const nowIso = (): string => new Date().toISOString();

export const submitAgentRunFeedbackAsync = async (input: {
  ask_run_id: string;
  agent_id: string;
  quality: number;
  speed: number;
  stability: number;
  meets_expectation: number;
  usefulness?: FeedbackUsefulness | null;
  reason_code?: string | null;
}): Promise<{ feedback: AgentRunFeedback; accepted: boolean }> => {
  const runRef = await getAskRunByIdAsync(input.ask_run_id);
  const validRun =
    !!runRef &&
    runRef.run.selected_agent_ids.includes(input.agent_id);
  const clamped = {
    quality: Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(input.quality))),
    speed: Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(input.speed))),
    stability: Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(input.stability))),
    meets_expectation: Math.max(
      SCORE_MIN,
      Math.min(SCORE_MAX, Math.round(input.meets_expectation)),
    ),
  };
  const usefulness = input.usefulness ?? null;
  const reasonCode = input.reason_code?.trim() ? input.reason_code.trim() : null;

  const feedback: AgentRunFeedback = {
    id: randomUUID(),
    ask_run_id: input.ask_run_id,
    agent_id: input.agent_id,
    quality: clamped.quality,
    speed: clamped.speed,
    stability: clamped.stability,
    meets_expectation: clamped.meets_expectation,
    created_at: nowIso(),
    valid_run: validRun,
    usefulness,
    reason_code: reasonCode,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO agent_run_feedback
       (id, ask_run_id, agent_id, quality, speed, stability, meets_expectation, created_at, valid_run, usefulness, reason_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        feedback.id,
        feedback.ask_run_id,
        feedback.agent_id,
        feedback.quality,
        feedback.speed,
        feedback.stability,
        feedback.meets_expectation,
        feedback.created_at,
        validRun,
        usefulness,
        reasonCode,
      ],
    );
  } else {
    feedbackList.push(feedback);
  }
  return { feedback, accepted: validRun };
};

export const getAgentFeedbackSummaryAsync = async (agentId: string): Promise<{
  valid_feedback_count: number;
  quality_avg: number;
  speed_avg: number;
  stability_avg: number;
  meets_expectation_avg: number;
  abuse_flagged_count: number;
}> => {
  if (isPostgresEnabled()) {
    const rows = await query<{
      valid_feedback_count: string;
      quality_avg: string;
      speed_avg: string;
      stability_avg: string;
      meets_expectation_avg: string;
      abuse_flagged_count: string;
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE valid_run)::text AS valid_feedback_count,
         COALESCE(AVG(quality) FILTER (WHERE valid_run), 0)::text AS quality_avg,
         COALESCE(AVG(speed) FILTER (WHERE valid_run), 0)::text AS speed_avg,
         COALESCE(AVG(stability) FILTER (WHERE valid_run), 0)::text AS stability_avg,
         COALESCE(AVG(meets_expectation) FILTER (WHERE valid_run), 0)::text AS meets_expectation_avg,
         COUNT(*) FILTER (WHERE NOT valid_run)::text AS abuse_flagged_count
       FROM agent_run_feedback
       WHERE agent_id = $1`,
      [agentId],
    );
    const r = rows[0];
    const validCount = Number(r?.valid_feedback_count ?? "0");
    return {
      valid_feedback_count: validCount,
      quality_avg: validCount > 0 ? Number(Number(r?.quality_avg ?? 0).toFixed(2)) : 0,
      speed_avg: validCount > 0 ? Number(Number(r?.speed_avg ?? 0).toFixed(2)) : 0,
      stability_avg: validCount > 0 ? Number(Number(r?.stability_avg ?? 0).toFixed(2)) : 0,
      meets_expectation_avg: validCount > 0 ? Number(Number(r?.meets_expectation_avg ?? 0).toFixed(2)) : 0,
      abuse_flagged_count: Number(r?.abuse_flagged_count ?? "0"),
    };
  }
  const forAgent = feedbackList.filter((f) => f.agent_id === agentId);
  const valid = forAgent.filter((f) => f.valid_run);
  const abuseCount = forAgent.filter((f) => !f.valid_run).length;
  const n = valid.length;
  return {
    valid_feedback_count: n,
    quality_avg: n > 0 ? Number((valid.reduce((a, f) => a + f.quality, 0) / n).toFixed(2)) : 0,
    speed_avg: n > 0 ? Number((valid.reduce((a, f) => a + f.speed, 0) / n).toFixed(2)) : 0,
    stability_avg: n > 0 ? Number((valid.reduce((a, f) => a + f.stability, 0) / n).toFixed(2)) : 0,
    meets_expectation_avg: n > 0 ? Number((valid.reduce((a, f) => a + f.meets_expectation, 0) / n).toFixed(2)) : 0,
    abuse_flagged_count: abuseCount,
  };
};

export const countRecentNotHelpfulWithReasonAsync = async (
  agentId: string,
  reasonCode: string,
  lookbackDays: number,
): Promise<number> => {
  const days = Math.min(365, Math.max(1, lookbackDays));
  if (!isPostgresEnabled()) {
    const cutoff = Date.now() - days * 86_400_000;
    return feedbackList.filter(
      (f) =>
        f.agent_id === agentId &&
        f.usefulness === "not_helpful" &&
        f.reason_code === reasonCode &&
        Date.parse(f.created_at) >= cutoff,
    ).length;
  }
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM agent_run_feedback
     WHERE agent_id = $1
       AND usefulness = 'not_helpful'
       AND reason_code = $2
       AND created_at >= NOW() - ($3 * INTERVAL '1 day')`,
    [agentId, reasonCode, days],
  );
  return Number(rows[0]?.n ?? "0");
};

export const resetAgentRunFeedbackStore = (): void => {
  if (isPostgresEnabled()) return;
  feedbackList.length = 0;
};
