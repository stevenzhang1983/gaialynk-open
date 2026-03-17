import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import {
  DEFAULT_ANONYMOUS_PUBLISHER_ID,
  getPublisherAsync,
  getTierSortWeight,
  type PublisherIdentityTier,
} from "./publisher.store";

export interface PublicAgentTemplate {
  id: string;
  name: string;
  category: string;
  major_version: number;
  minor_version: number;
  version: string;
  source_url: string;
  status: "draft" | "published" | "suspended";
  created_at: string;
  publisher_id?: string;
}

export interface PublicAgentTemplateListItem extends PublicAgentTemplate {
  publisher_identity_tier: PublisherIdentityTier;
  sort_weight: number;
}

export interface PreflightCheckInput {
  connectivity_ok: boolean;
  p95_latency_ms: number;
  error_rate: number;
  rate_limit_ok: boolean;
}

export interface QualitySample {
  success: boolean;
  timed_out: boolean;
  complaint: boolean;
  withdrawn: boolean;
}

interface QualityEvaluation {
  id: string;
  template_id: string;
  sample_count: number;
  success_count: number;
  timeout_count: number;
  complaint_count: number;
  withdrawal_count: number;
  created_at: string;
}

export interface ListingApplication {
  id: string;
  template_id: string;
  actor_id: string;
  status: "pending_review" | "approved" | "rejected";
  reviewer_id?: string;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateGovernanceDecision {
  action: "none" | "downgrade" | "suspend";
  reason_codes: string[];
}

const templates = new Map<string, PublicAgentTemplate>();
const qualityEvaluations: QualityEvaluation[] = [];
const listingApplications: ListingApplication[] = [];

const failureSemantics = {
  latency_high: {
    user_message: "该 Agent 当前响应较慢，建议稍后重试或更换替代 Agent。",
    action: "retry_or_switch",
  },
  error_rate_high: {
    user_message: "该 Agent 当前稳定性下降，建议使用替代 Agent。",
    action: "switch_agent",
  },
  rate_limit_unstable: {
    user_message: "该 Agent 限流行为异常，可能暂时不可用。",
    action: "degrade_or_retry",
  },
  upstream_unreachable: {
    user_message: "该 Agent 服务暂时不可达，请稍后再试。",
    action: "retry_later",
  },
} as const;

const nowIso = (): string => new Date().toISOString();

const round4 = (value: number): number => Math.round(value * 10000) / 10000;

const normalizeVersion = (majorVersion: number, minorVersion: number): string =>
  `${majorVersion}.${minorVersion}`;

export const createPublicAgentTemplateAsync = async (input: {
  name: string;
  category: string;
  majorVersion: number;
  minorVersion: number;
  sourceUrl: string;
  publisherId?: string;
}): Promise<PublicAgentTemplate> => {
  const publisherId = input.publisherId ?? DEFAULT_ANONYMOUS_PUBLISHER_ID;
  const template: PublicAgentTemplate = {
    id: randomUUID(),
    name: input.name,
    category: input.category,
    major_version: input.majorVersion,
    minor_version: input.minorVersion,
    version: normalizeVersion(input.majorVersion, input.minorVersion),
    source_url: input.sourceUrl,
    status: "draft",
    created_at: nowIso(),
    publisher_id: publisherId,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO public_agent_templates
       (id, name, category, major_version, minor_version, version, source_url, status, created_at, publisher_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        template.id,
        template.name,
        template.category,
        template.major_version,
        template.minor_version,
        template.version,
        template.source_url,
        template.status,
        template.created_at,
        publisherId,
      ],
    );
    return template;
  }
  templates.set(template.id, template);
  return template;
};

export const listPublicAgentTemplatesAsync = async (): Promise<PublicAgentTemplateListItem[]> => {
  if (isPostgresEnabled()) {
    const rows = await query<
      PublicAgentTemplate & { identity_tier: PublisherIdentityTier }
    >(
      `SELECT t.id, t.name, t.category, t.major_version, t.minor_version, t.version, t.source_url, t.status, t.created_at::text, t.publisher_id,
              COALESCE(p.identity_tier, 'anonymous') AS identity_tier
       FROM public_agent_templates t
       LEFT JOIN publishers p ON t.publisher_id = p.id
       ORDER BY (CASE COALESCE(p.identity_tier, 'anonymous') WHEN 'certified' THEN 3 WHEN 'verified' THEN 2 ELSE 1 END) DESC, t.created_at DESC`,
    );
    return rows.map((r) => {
      const { identity_tier, ...rest } = r;
      return {
        ...rest,
        publisher_identity_tier: identity_tier,
        sort_weight: getTierSortWeight(identity_tier),
      };
    });
  }
  const list: PublicAgentTemplateListItem[] = [];
  for (const t of templates.values()) {
    const pub = await getPublisherAsync(t.publisher_id ?? DEFAULT_ANONYMOUS_PUBLISHER_ID);
    const tier: PublisherIdentityTier = pub?.identity_tier ?? "anonymous";
    list.push({
      ...t,
      publisher_identity_tier: tier,
      sort_weight: getTierSortWeight(tier),
    });
  }
  return list.sort(
    (a, b) =>
      b.sort_weight - a.sort_weight || b.created_at.localeCompare(a.created_at),
  );
};

export const getPublicAgentTemplateByIdAsync = async (
  templateId: string,
): Promise<PublicAgentTemplate | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<PublicAgentTemplate>(
      `SELECT id, name, category, major_version, minor_version, version, source_url, status, created_at::text
       FROM public_agent_templates
       WHERE id = $1`,
      [templateId],
    );
    return rows[0] ?? null;
  }
  return templates.get(templateId) ?? null;
};

export const runPreflightChecks = (input: PreflightCheckInput): {
  gate_passed: boolean;
  checks: {
    connectivity: "pass" | "fail";
    latency: "pass" | "fail";
    error_rate: "pass" | "fail";
    rate_limit: "pass" | "fail";
  };
  thresholds: {
    p95_latency_ms_max: number;
    error_rate_max: number;
  };
} => {
  const checks = {
    connectivity: input.connectivity_ok ? "pass" : "fail",
    latency: input.p95_latency_ms <= 1200 ? "pass" : "fail",
    error_rate: input.error_rate <= 0.05 ? "pass" : "fail",
    rate_limit: input.rate_limit_ok ? "pass" : "fail",
  } as const;
  const gatePassed = Object.values(checks).every((value) => value === "pass");
  return {
    gate_passed: gatePassed,
    checks: {
      connectivity: checks.connectivity,
      latency: checks.latency,
      error_rate: checks.error_rate,
      rate_limit: checks.rate_limit,
    },
    thresholds: {
      p95_latency_ms_max: 1200,
      error_rate_max: 0.05,
    },
  };
};

export const addQualityEvaluationAsync = async (
  templateId: string,
  samples: QualitySample[],
): Promise<{
  id: string;
  template_id: string;
  sample_count: number;
  success_rate: number;
  timeout_rate: number;
  complaint_rate: number;
  withdrawal_rate: number;
  created_at: string;
}> => {
  const sampleCount = samples.length;
  const successCount = samples.filter((sample) => sample.success).length;
  const timeoutCount = samples.filter((sample) => sample.timed_out).length;
  const complaintCount = samples.filter((sample) => sample.complaint).length;
  const withdrawalCount = samples.filter((sample) => sample.withdrawn).length;
  const createdAt = nowIso();

  const evaluation: QualityEvaluation = {
    id: randomUUID(),
    template_id: templateId,
    sample_count: sampleCount,
    success_count: successCount,
    timeout_count: timeoutCount,
    complaint_count: complaintCount,
    withdrawal_count: withdrawalCount,
    created_at: createdAt,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO template_quality_evaluations
       (id, template_id, sample_count, success_count, timeout_count, complaint_count, withdrawal_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        evaluation.id,
        evaluation.template_id,
        evaluation.sample_count,
        evaluation.success_count,
        evaluation.timeout_count,
        evaluation.complaint_count,
        evaluation.withdrawal_count,
        evaluation.created_at,
      ],
    );
  } else {
    qualityEvaluations.push(evaluation);
  }

  return {
    id: evaluation.id,
    template_id: templateId,
    sample_count: sampleCount,
    success_rate: sampleCount === 0 ? 0 : round4(successCount / sampleCount),
    timeout_rate: sampleCount === 0 ? 0 : round4(timeoutCount / sampleCount),
    complaint_rate: sampleCount === 0 ? 0 : round4(complaintCount / sampleCount),
    withdrawal_rate: sampleCount === 0 ? 0 : round4(withdrawalCount / sampleCount),
    created_at: createdAt,
  };
};

export const getQualityWindowSummaryAsync = async (
  templateId: string,
  windowDays: number,
): Promise<{
  template_id: string;
  window_days: number;
  evaluation_count: number;
  sample_count: number;
  success_rate: number;
  timeout_rate: number;
  complaint_rate: number;
  withdrawal_rate: number;
}> => {
  let evaluationCount = 0;
  let sampleCount = 0;
  let successCount = 0;
  let timeoutCount = 0;
  let complaintCount = 0;
  let withdrawalCount = 0;
  if (isPostgresEnabled()) {
    const rows = await query<{
      evaluation_count: number;
      sample_count: number;
      success_count: number;
      timeout_count: number;
      complaint_count: number;
      withdrawal_count: number;
    }>(
      `SELECT
         COUNT(*)::int AS evaluation_count,
         COALESCE(SUM(sample_count), 0)::int AS sample_count,
         COALESCE(SUM(success_count), 0)::int AS success_count,
         COALESCE(SUM(timeout_count), 0)::int AS timeout_count,
         COALESCE(SUM(complaint_count), 0)::int AS complaint_count,
         COALESCE(SUM(withdrawal_count), 0)::int AS withdrawal_count
       FROM template_quality_evaluations
       WHERE template_id = $1
         AND created_at >= NOW() - ($2::text || ' days')::interval`,
      [templateId, windowDays],
    );
    const aggregate = rows[0];
    evaluationCount = aggregate?.evaluation_count ?? 0;
    sampleCount = aggregate?.sample_count ?? 0;
    successCount = aggregate?.success_count ?? 0;
    timeoutCount = aggregate?.timeout_count ?? 0;
    complaintCount = aggregate?.complaint_count ?? 0;
    withdrawalCount = aggregate?.withdrawal_count ?? 0;
  } else {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const matched = qualityEvaluations.filter(
      (evaluation) => evaluation.template_id === templateId && Date.parse(evaluation.created_at) >= cutoff,
    );
    evaluationCount = matched.length;
    sampleCount = matched.reduce((acc, row) => acc + row.sample_count, 0);
    successCount = matched.reduce((acc, row) => acc + row.success_count, 0);
    timeoutCount = matched.reduce((acc, row) => acc + row.timeout_count, 0);
    complaintCount = matched.reduce((acc, row) => acc + row.complaint_count, 0);
    withdrawalCount = matched.reduce((acc, row) => acc + row.withdrawal_count, 0);
  }
  return {
    template_id: templateId,
    window_days: windowDays,
    evaluation_count: evaluationCount,
    sample_count: sampleCount,
    success_rate: sampleCount === 0 ? 0 : round4(successCount / sampleCount),
    timeout_rate: sampleCount === 0 ? 0 : round4(timeoutCount / sampleCount),
    complaint_rate: sampleCount === 0 ? 0 : round4(complaintCount / sampleCount),
    withdrawal_rate: sampleCount === 0 ? 0 : round4(withdrawalCount / sampleCount),
  };
};

export const listFailureSemantics = (): typeof failureSemantics => failureSemantics;

const updateTemplateStatusAsync = async (
  templateId: string,
  status: PublicAgentTemplate["status"],
): Promise<void> => {
  if (isPostgresEnabled()) {
    await query(`UPDATE public_agent_templates SET status = $2 WHERE id = $1`, [templateId, status]);
    return;
  }
  const template = templates.get(templateId);
  if (!template) {
    return;
  }
  templates.set(templateId, { ...template, status });
};

export const evaluateTemplateGovernance = (summary: {
  success_rate: number;
  timeout_rate: number;
  complaint_rate: number;
}): TemplateGovernanceDecision => {
  const reasons: string[] = [];
  if (summary.success_rate < 0.5) {
    reasons.push("success_rate_critical");
  }
  if (summary.timeout_rate >= 0.4) {
    reasons.push("timeout_rate_critical");
  }
  if (summary.complaint_rate >= 0.3) {
    reasons.push("complaint_rate_critical");
  }
  if (reasons.length > 0) {
    return { action: "suspend", reason_codes: reasons };
  }

  if (summary.success_rate < 0.8) {
    reasons.push("success_rate_warning");
  }
  if (summary.timeout_rate >= 0.2) {
    reasons.push("timeout_rate_warning");
  }
  if (summary.complaint_rate >= 0.15) {
    reasons.push("complaint_rate_warning");
  }
  if (reasons.length > 0) {
    return { action: "downgrade", reason_codes: reasons };
  }
  return { action: "none", reason_codes: [] };
};

export const applyTemplateGovernanceDecisionAsync = async (input: {
  templateId: string;
  decision: TemplateGovernanceDecision;
}): Promise<void> => {
  if (input.decision.action === "none") {
    return;
  }
  const status: PublicAgentTemplate["status"] =
    input.decision.action === "suspend" ? "suspended" : "draft";
  await updateTemplateStatusAsync(input.templateId, status);
};

export const createListingApplicationAsync = async (input: {
  templateId: string;
  actorId: string;
}): Promise<ListingApplication> => {
  const now = nowIso();
  const application: ListingApplication = {
    id: randomUUID(),
    template_id: input.templateId,
    actor_id: input.actorId,
    status: "pending_review",
    created_at: now,
    updated_at: now,
  };
  await updateTemplateStatusAsync(input.templateId, "draft");
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO template_listing_applications
       (id, template_id, actor_id, status, reviewer_id, note, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        application.id,
        application.template_id,
        application.actor_id,
        application.status,
        null,
        null,
        application.created_at,
        application.updated_at,
      ],
    );
    return application;
  }
  listingApplications.push(application);
  return application;
};

export const getLatestListingApplicationByTemplateAsync = async (
  templateId: string,
): Promise<ListingApplication | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<ListingApplication>(
      `SELECT id, template_id, actor_id, status, reviewer_id, note, created_at::text, updated_at::text
       FROM template_listing_applications
       WHERE template_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [templateId],
    );
    return rows[0] ?? null;
  }
  return listingApplications
    .filter((item) => item.template_id === templateId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
};

export const listTemplateIdsByPublisherAsync = async (publisherId: string): Promise<string[]> => {
  if (isPostgresEnabled()) {
    const rows = await query<{ template_id: string }>(
      `SELECT DISTINCT template_id
       FROM template_listing_applications
       WHERE actor_id = $1`,
      [publisherId],
    );
    return rows.map((row) => row.template_id);
  }
  const ids = new Set(
    listingApplications
      .filter((item) => item.actor_id === publisherId)
      .map((item) => item.template_id),
  );
  return [...ids];
};

export const decideListingApplicationAsync = async (input: {
  templateId: string;
  reviewerId: string;
  decision: "approved" | "rejected";
  note?: string;
}): Promise<ListingApplication | null> => {
  const latest = await getLatestListingApplicationByTemplateAsync(input.templateId);
  if (!latest) {
    return null;
  }
  const updated: ListingApplication = {
    ...latest,
    status: input.decision,
    reviewer_id: input.reviewerId,
    note: input.note,
    updated_at: nowIso(),
  };
  await updateTemplateStatusAsync(input.templateId, input.decision === "approved" ? "published" : "suspended");
  if (isPostgresEnabled()) {
    const rows = await query<ListingApplication>(
      `UPDATE template_listing_applications
       SET status = $2, reviewer_id = $3, note = $4, updated_at = $5
       WHERE id = $1
       RETURNING id, template_id, actor_id, status, reviewer_id, note, created_at::text, updated_at::text`,
      [latest.id, updated.status, updated.reviewer_id ?? null, updated.note ?? null, updated.updated_at],
    );
    return rows[0] ?? null;
  }
  const index = listingApplications.findIndex((item) => item.id === latest.id);
  if (index >= 0) {
    listingApplications[index] = updated;
  }
  return updated;
};

export const resetPublicTemplateStore = (): void => {
  if (isPostgresEnabled()) {
    return;
  }
  templates.clear();
  qualityEvaluations.splice(0, qualityEvaluations.length);
  listingApplications.splice(0, listingApplications.length);
};
