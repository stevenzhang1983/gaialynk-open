/**
 * E-7: Platform-injected Invocation Context (CTO §5.1.9, header `X-GaiaLynk-Invocation-Context`).
 */
export type InvocationSource = "session" | "scheduled";

export interface InvocationContextPayload {
  gaia_user_id: string;
  conversation_id: string;
  run_id: string;
  invocation_source: InvocationSource;
  trace_id: string;
  subscription_id?: string;
}

export const INVOCATION_CONTEXT_HEADER = "X-GaiaLynk-Invocation-Context";

export function buildInvocationContextHeaderValue(ctx: InvocationContextPayload): string {
  return JSON.stringify(ctx);
}

/** Convenience for A 类会话调用（B 类定时可传 subscription_id + invocation_source scheduled 另行构造） */
export function sessionInvocationContext(input: {
  gaiaUserId: string;
  conversationId: string;
  runId: string;
  traceId: string;
  subscriptionId?: string;
}): InvocationContextPayload {
  return {
    gaia_user_id: input.gaiaUserId,
    conversation_id: input.conversationId,
    run_id: input.runId,
    invocation_source: "session",
    trace_id: input.traceId,
    ...(input.subscriptionId ? { subscription_id: input.subscriptionId } : {}),
  };
}

/** B 类定时编排：`subscription_id` 通常为 `orchestration_runs.id`。 */
export function scheduledInvocationContext(input: {
  gaiaUserId: string;
  conversationId: string;
  runId: string;
  traceId: string;
  subscriptionId: string;
}): InvocationContextPayload {
  return {
    gaia_user_id: input.gaiaUserId,
    conversation_id: input.conversationId,
    run_id: input.runId,
    invocation_source: "scheduled",
    trace_id: input.traceId,
    subscription_id: input.subscriptionId,
  };
}

export function parseInvocationContextHeaderValue(raw: string): InvocationContextPayload {
  const v = JSON.parse(raw) as InvocationContextPayload;
  if (
    typeof v.gaia_user_id !== "string" ||
    typeof v.conversation_id !== "string" ||
    typeof v.run_id !== "string" ||
    (v.invocation_source !== "session" && v.invocation_source !== "scheduled") ||
    typeof v.trace_id !== "string"
  ) {
    throw new Error("invalid_invocation_context_json");
  }
  if (v.subscription_id !== undefined && typeof v.subscription_id !== "string") {
    throw new Error("invalid_invocation_context_json");
  }
  return v;
}
