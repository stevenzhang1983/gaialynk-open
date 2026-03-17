interface ConsumeQuotaInput {
  actorId: string;
  feature: string;
  units: number;
}

interface QuotaState {
  used: number;
}

export interface QuotaResult {
  feature: string;
  actor_id: string;
  used: number;
  limit: number;
  remaining: number;
  allowed: boolean;
  upgrade_hint?: string;
}

const quotaByActorFeature = new Map<string, QuotaState>();
const DEFAULT_FREE_LIMITS: Record<string, number> = {
  agent_deployments: 1,
  subscription_task_runs: 10,
};

const buildQuotaKey = (actorId: string, feature: string): string => `${actorId}::${feature}`;

export const getQuotaStatusAsync = async (actorId: string, feature: string): Promise<QuotaResult> => {
  const key = buildQuotaKey(actorId, feature);
  const state = quotaByActorFeature.get(key) ?? { used: 0 };
  const limit = DEFAULT_FREE_LIMITS[feature] ?? 0;
  const remaining = Math.max(0, limit - state.used);
  const allowed = remaining > 0;
  return {
    feature,
    actor_id: actorId,
    used: state.used,
    limit,
    remaining,
    allowed,
    upgrade_hint: allowed ? undefined : "Upgrade to Pro for higher deployment quota.",
  };
};

export const consumeQuotaAsync = async (input: ConsumeQuotaInput): Promise<QuotaResult> => {
  const status = await getQuotaStatusAsync(input.actorId, input.feature);
  if (input.units <= 0) {
    return status;
  }
  if (status.remaining < input.units) {
    return { ...status, allowed: false };
  }

  const key = buildQuotaKey(input.actorId, input.feature);
  quotaByActorFeature.set(key, { used: status.used + input.units });
  return getQuotaStatusAsync(input.actorId, input.feature);
};

export const resetQuotaStore = (): void => {
  quotaByActorFeature.clear();
};
