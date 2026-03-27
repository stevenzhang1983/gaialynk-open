import { getRecommendedAgentsForOnboarding } from "@/lib/product/consumer-onboarding-mock";
import type { Agent, AgentCategory, TrustBadge } from "@/lib/product/agent-types";

type ApiAgent = {
  id: string;
  name: string;
  description: string;
  capabilities: { name: string; risk_level: string }[];
  status?: string;
  source_origin?: string;
  trust_badge?: string;
  max_concurrent?: number;
  queue_behavior?: string;
};

type DiscoverySlots = {
  hot: ApiAgent[];
  beginner_friendly: ApiAgent[];
  low_latency: ApiAgent[];
};

function parseTrustBadge(raw: string | undefined): TrustBadge | undefined {
  if (raw === "unverified" || raw === "consumer_ready" || raw === "high_sensitivity_enhanced") {
    return raw;
  }
  return undefined;
}

function inferCategory(a: ApiAgent): AgentCategory {
  const blob = `${a.name} ${a.description} ${(a.capabilities ?? []).map((c) => c.name).join(" ")}`.toLowerCase();
  if (blob.includes("govern") || blob.includes("policy") || blob.includes("compliance")) return "governance";
  if (blob.includes("code") || blob.includes("review") || blob.includes("repo")) return "code";
  if (blob.includes("research") || blob.includes("search") || blob.includes("citation")) return "research";
  if (blob.includes("summar") || blob.includes("task") || blob.includes("workflow")) return "productivity";
  return "other";
}

function mapApiAgent(a: ApiAgent): Agent {
  const maxRisk =
    a.capabilities?.reduce(
      (max, c) => {
        const order = { critical: 3, high: 2, medium: 1, low: 0 } as Record<string, number>;
        return (order[c.risk_level] ?? 0) > (order[max] ?? 0) ? c.risk_level : max;
      },
      "low",
    ) ?? "low";
  const mc =
    typeof a.max_concurrent === "number" && Number.isFinite(a.max_concurrent) && a.max_concurrent >= 1
      ? a.max_concurrent
      : 1;
  const qb = a.queue_behavior === "fast_fail" ? "fast_fail" : "queue";
  return {
    id: a.id,
    name: a.name,
    capabilitySummary: a.description || a.capabilities?.map((c) => c.name).join(", ") || "",
    reputationScore: 80,
    verificationStatus: a.status === "active" ? "verified" : a.status === "pending_review" ? "pending" : "unverified",
    trustBadge: parseTrustBadge(a.trust_badge),
    maxConcurrent: mc,
    queueBehavior: qb,
    category: inferCategory(a),
    identityVerificationStatus: a.status === "active" ? "Verified" : "Pending review",
    capabilityStatement: a.capabilities?.map((c) => `${c.name} (${c.risk_level})`).join("; ") || "",
    historySuccessRate: 85,
    riskLevel: (maxRisk === "critical" ? "high" : maxRisk) as Agent["riskLevel"],
    sourceOrigin: a.source_origin,
  };
}

/**
 * W-9 / W-4：优先 discovery 运营位去重合并，不足时回退 Mock 推荐列表。
 */
export async function fetchFirstRunAgentPicks(max = 5): Promise<Agent[]> {
  try {
    const res = await fetch("/api/mainline/agents/discovery", { cache: "no-store" });
    if (!res.ok) throw new Error("discovery_not_ok");
    const json = (await res.json()) as { data?: { slots?: DiscoverySlots } };
    const slots = json.data?.slots;
    if (!slots) throw new Error("no_slots");
    const order = [...slots.hot, ...slots.beginner_friendly, ...slots.low_latency];
    const seen = new Set<string>();
    const out: Agent[] = [];
    for (const raw of order) {
      const a = mapApiAgent(raw);
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      out.push(a);
      if (out.length >= max) break;
    }
    if (out.length > 0) return out;
  } catch {
    /* use fallback */
  }
  return getRecommendedAgentsForOnboarding().slice(0, max);
}
