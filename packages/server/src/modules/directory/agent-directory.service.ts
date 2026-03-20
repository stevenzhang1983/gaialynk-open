import type { Agent, AgentCapability } from "./agent.store";
import { getAgentByIdAsync } from "./agent.store";
import { listAuditEventsAsync } from "../audit/audit.store";
import { getAgentFeedbackSummaryAsync } from "../feedback/agent-run-feedback.store";

export type RiskLevel = "low" | "medium" | "high" | "critical";

const riskRank = (r: RiskLevel): number =>
  r === "critical" ? 4 : r === "high" ? 3 : r === "medium" ? 2 : 1;

/** Max risk level from capabilities */
export function agentMaxRiskLevel(agent: Agent): RiskLevel {
  if (!agent.capabilities?.length) return "low";
  let max = 0;
  let level: RiskLevel = "low";
  for (const cap of agent.capabilities as AgentCapability[]) {
    const r = riskRank(cap.risk_level as RiskLevel);
    if (r > max) {
      max = r;
      level = cap.risk_level as RiskLevel;
    }
  }
  return level;
}

/** Identity considered verified when official or connected_node with node_id */
export function agentIdentityVerified(agent: Agent): boolean {
  if (agent.source_origin === "official") return true;
  if (agent.source_origin === "connected_node" && agent.node_id) return true;
  return false;
}

export interface AgentStats {
  event_counts: { completed: number; failed: number; denied: number; need_confirmation: number };
  success_rate: number;
  reputation_score: number;
  reputation_grade: "A" | "B" | "C" | "D";
  feedback_summary: {
    valid_feedback_count: number;
    quality_avg: number;
    speed_avg: number;
    stability_avg: number;
    meets_expectation_avg: number;
    abuse_flagged_count: number;
  };
}

export interface AgentDetailEnriched {
  agent: Agent;
  identity_verified: boolean;
  reputation_score: number;
  reputation_grade: "A" | "B" | "C" | "D";
  success_rate: number;
  risk_level: RiskLevel;
  feedback_summary: AgentStats["feedback_summary"];
}

export async function getAgentStatsAsync(agentId: string): Promise<AgentStats | null> {
  const agent = await getAgentByIdAsync(agentId);
  if (!agent) return null;

  const events = (await listAuditEventsAsync({ agentId, limit: 5000 })).data;
  const eventCounts = {
    completed: events.filter((e) => e.event_type === "invocation.completed").length,
    failed: events.filter((e) => e.event_type === "invocation.failed").length,
    denied: events.filter((e) => e.event_type === "invocation.denied").length,
    need_confirmation: events.filter((e) => e.event_type === "invocation.need_confirmation").length,
  };
  const total =
    eventCounts.completed + eventCounts.failed + eventCounts.denied + eventCounts.need_confirmation;
  const success_rate = total > 0 ? eventCounts.completed / total : 0;

  const rawScore =
    60 +
    eventCounts.completed * 8 -
    eventCounts.failed * 12 -
    eventCounts.denied * 10 -
    eventCounts.need_confirmation * 2;
  const reputation_score = Math.max(0, Math.min(100, rawScore));
  const reputation_grade =
    reputation_score >= 85 ? "A" : reputation_score >= 70 ? "B" : reputation_score >= 55 ? "C" : "D";

  const feedbackSummary = await getAgentFeedbackSummaryAsync(agentId);

  return {
    event_counts: eventCounts,
    success_rate: Number(success_rate.toFixed(4)),
    reputation_score,
    reputation_grade,
    feedback_summary: {
      valid_feedback_count: feedbackSummary.valid_feedback_count,
      quality_avg: feedbackSummary.quality_avg,
      speed_avg: feedbackSummary.speed_avg,
      stability_avg: feedbackSummary.stability_avg,
      meets_expectation_avg: feedbackSummary.meets_expectation_avg,
      abuse_flagged_count: feedbackSummary.abuse_flagged_count,
    },
  };
}

export async function getAgentDetailEnrichedAsync(
  agentId: string,
): Promise<AgentDetailEnriched | null> {
  const agent = await getAgentByIdAsync(agentId);
  if (!agent) return null;

  const stats = await getAgentStatsAsync(agentId);
  if (!stats) return null;

  return {
    agent,
    identity_verified: agentIdentityVerified(agent),
    reputation_score: stats.reputation_score,
    reputation_grade: stats.reputation_grade,
    success_rate: stats.success_rate,
    risk_level: agentMaxRiskLevel(agent),
    feedback_summary: stats.feedback_summary,
  };
}
