interface DeniedDecision {
  invocation_id: string;
  status: "denied";
  approver_id: string;
  reason?: string;
  denied_at: string;
}

const deniedDecisions = new Map<string, DeniedDecision>();

export const getDeniedDecisionAsync = async (invocationId: string): Promise<DeniedDecision | null> =>
  deniedDecisions.get(invocationId) ?? null;

export const denyInvocationAsync = async (params: {
  invocationId: string;
  approverId: string;
  reason?: string;
}): Promise<DeniedDecision> => {
  const existing = deniedDecisions.get(params.invocationId);
  if (existing) {
    return existing;
  }
  const denied: DeniedDecision = {
    invocation_id: params.invocationId,
    status: "denied",
    approver_id: params.approverId,
    reason: params.reason,
    denied_at: new Date().toISOString(),
  };
  deniedDecisions.set(params.invocationId, denied);
  return denied;
};

export const resetReviewDecisionStore = (): void => {
  deniedDecisions.clear();
};
