import type { Agent } from "./agent.store";
import {
  agentIdentityVerified,
  agentMaxRiskLevel,
  computeTrustBadge,
  type TrustBadge,
} from "./agent-directory.service";
import type { DirectoryRankingConfig } from "./directory-ranking-config.store";
import type { AgentRankingMetrics, ReputationGrade } from "./ranking-metrics.store";

export function keywordRelevanceScore(agent: Agent, q: string): number {
  const intentLower = q.trim().toLowerCase();
  if (!intentLower) return 0;
  let score = 0;
  for (const capability of agent.capabilities) {
    if (capability.name.toLowerCase().includes(intentLower)) {
      score += 3;
    }
  }
  if (agent.name.toLowerCase().includes(intentLower)) {
    score += 2;
  }
  if (agent.description.toLowerCase().includes(intentLower)) {
    score += 1;
  }
  return score;
}

/** Lower sorts earlier (more visible). */
export function trustTieOrder(badge: TrustBadge): number {
  if (badge === "consumer_ready") return 0;
  if (badge === "high_sensitivity_enhanced") return 1;
  return 2;
}

export function trustBadgeForRanking(agent: Agent, metrics?: AgentRankingMetrics): TrustBadge {
  const grade: ReputationGrade = metrics?.reputation_grade ?? "C";
  return computeTrustBadge({
    agent,
    identity_verified: agentIdentityVerified(agent),
    reputation_grade: grade,
    max_risk: agentMaxRiskLevel(agent),
  });
}

const gradeRank = (g: ReputationGrade): number =>
  g === "A" ? 4 : g === "B" ? 3 : g === "C" ? 2 : 1;

export function meetsMinGrade(agentGrade: ReputationGrade, min: ReputationGrade): boolean {
  return gradeRank(agentGrade) >= gradeRank(min);
}

export function listingAgeDays(agent: Agent, now = Date.now()): number {
  const t = Date.parse(agent.created_at);
  if (!Number.isFinite(t)) return 0;
  return Math.floor((now - t) / (24 * 60 * 60 * 1000));
}

export function rankAgentsForDirectorySearch(
  agents: Agent[],
  searchQuery: string,
  metricsById: Record<string, AgentRankingMetrics>,
): Agent[] {
  const q = searchQuery.trim();
  const copy = [...agents];
  copy.sort((a, b) => {
    const ra = keywordRelevanceScore(a, q);
    const rb = keywordRelevanceScore(b, q);
    if (rb !== ra) return rb - ra;
    const ba = trustTieOrder(trustBadgeForRanking(a, metricsById[a.id]));
    const bb = trustTieOrder(trustBadgeForRanking(b, metricsById[b.id]));
    if (ba !== bb) return ba - bb;
    return a.name.localeCompare(b.name);
  });
  return copy;
}

/** Alphabetical name + stable id; deprecated last. */
export function safeFallbackSortAgents(agents: Agent[]): Agent[] {
  return [...agents].sort((a, b) => {
    const da = a.status === "deprecated" ? 1 : 0;
    const db = b.status === "deprecated" ? 1 : 0;
    if (da !== db) return da - db;
    const c = a.name.localeCompare(b.name);
    if (c !== 0) return c;
    return a.id.localeCompare(b.id);
  });
}

function isListableAgent(agent: Agent): boolean {
  return agent.status !== "deprecated" && agent.status !== "pending_review";
}

export interface DiscoverySlots {
  hot: Agent[];
  beginner_friendly: Agent[];
  low_latency: Agent[];
  new_listings: Agent[];
}

export function buildDiscoverySlots(
  agents: Agent[],
  metricsById: Record<string, AgentRankingMetrics>,
  impressions: Record<string, number>,
  config: DirectoryRankingConfig,
): DiscoverySlots {
  const pool = agents.filter(isListableAgent);
  const hot: Agent[] = [];
  const beginner_friendly: Agent[] = [];
  const low_latency: Agent[] = [];
  const new_listings: Agent[] = [];

  const hotCandidates = pool.filter((a) => {
    const m = metricsById[a.id];
    if (!m) return false;
    if (!meetsMinGrade(m.reputation_grade, config.hot.min_reputation_grade)) return false;
    if (m.recent_error_rate > config.hot.max_recent_error_rate) return false;
    if (listingAgeDays(a) < config.hot.min_listing_age_days) return false;
    return true;
  });
  hotCandidates.sort((a, b) => {
    const ma = metricsById[a.id]!;
    const mb = metricsById[b.id]!;
    const pa = ma.completed + ma.recent_completed;
    const pb = mb.completed + mb.recent_completed;
    if (pb !== pa) return pb - pa;
    return a.name.localeCompare(b.name);
  });
  hot.push(...hotCandidates.slice(0, config.hot.max_slots));

  const bfCandidates = pool.filter((a) => {
    const m = metricsById[a.id];
    if (!m) return false;
    const badge = trustBadgeForRanking(a, m);
    if (!config.beginner_friendly.allowed_trust_badges.some((b) => b === badge)) return false;
    if (!meetsMinGrade(m.reputation_grade, config.beginner_friendly.min_reputation_grade)) return false;
    if (m.recent_error_rate > config.beginner_friendly.max_recent_error_rate) return false;
    if (listingAgeDays(a) < config.beginner_friendly.min_listing_age_days) return false;
    return true;
  });
  bfCandidates.sort((a, b) => {
    const ma = metricsById[a.id]!.reputation_score;
    const mb = metricsById[b.id]!.reputation_score;
    if (mb !== ma) return mb - ma;
    return a.name.localeCompare(b.name);
  });
  beginner_friendly.push(...bfCandidates.slice(0, config.beginner_friendly.max_slots));

  const llCandidates = pool.filter((a) => {
    const m = metricsById[a.id];
    if (!m) return false;
    if (config.low_latency.require_health_check_ok && a.health_check_status !== "ok") return false;
    if (!meetsMinGrade(m.reputation_grade, config.low_latency.min_reputation_grade)) return false;
    if (m.recent_error_rate > config.low_latency.max_recent_error_rate) return false;
    if (listingAgeDays(a) < config.low_latency.min_listing_age_days) return false;
    return true;
  });
  llCandidates.sort((a, b) => {
    const ta = a.timeout_ms != null && Number.isFinite(a.timeout_ms) ? Number(a.timeout_ms) : 120_000;
    const tb = b.timeout_ms != null && Number.isFinite(b.timeout_ms) ? Number(b.timeout_ms) : 120_000;
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name);
  });
  low_latency.push(...llCandidates.slice(0, config.low_latency.max_slots));

  const nl = config.new_listings;
  const nlCandidates = pool.filter((a) => {
    const age = listingAgeDays(a);
    if (age > nl.max_listing_age_days) return false;
    if (age < nl.min_listing_age_days) return false;
    const m = metricsById[a.id];
    if (!m) return false;
    const badge = trustBadgeForRanking(a, m);
    if (nl.min_trust_badge === "consumer_ready" && badge !== "consumer_ready") return false;
    if (!meetsMinGrade(m.reputation_grade, nl.min_reputation_grade)) return false;
    if (m.recent_error_rate > nl.max_recent_error_rate) return false;
    const imp = impressions[a.id] ?? 0;
    if (imp >= nl.impression_cap_per_agent) return false;
    return true;
  });
  nlCandidates.sort((a, b) => b.created_at.localeCompare(a.created_at));
  new_listings.push(...nlCandidates.slice(0, nl.max_slots));

  return { hot, beginner_friendly, low_latency, new_listings };
}

export function paginateAgentsByCursor(
  agents: Agent[],
  limit: number,
  cursor?: string,
): { data: Agent[]; next_cursor?: string } {
  const lim = Math.min(Math.max(limit, 1), 100);
  let start = 0;
  if (cursor) {
    const idx = agents.findIndex((a) => a.id === cursor);
    if (idx >= 0) start = idx + 1;
  }
  const slice = agents.slice(start, start + lim);
  const hasMore = agents.length > start + lim;
  return {
    data: slice,
    next_cursor: hasMore && slice.length > 0 ? slice[slice.length - 1]!.id : undefined,
  };
}
