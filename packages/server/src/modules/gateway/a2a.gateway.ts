import { buildUserFacingMessageFromReasonCodes, type UserFacingLocaleBundle } from "@gaialynk/shared";
import { getAgentListingStatusForGatewayAsync, type Agent } from "../directory/agent.store";
import { listHealthyEndpointUrlsForAgentAsync } from "../directory/agent-endpoint.store";
import {
  INVOCATION_CONTEXT_HEADER,
  type InvocationContextPayload,
} from "./invocation-context";
import { withPerAgentConcurrency } from "./invocation-capacity";
import { tryEndpointsWithFailover } from "./pool-router";

export { InvocationCapacityFastFailError, InvocationQueueTimeoutError } from "./invocation-capacity";

/** E-15: Agent is delisted — reject immediately (and queued work at slot acquisition). */
export class AgentDelistedGatewayError extends Error {
  readonly code = "agent_delisted" as const;
  readonly user_facing_message: UserFacingLocaleBundle;

  constructor() {
    super("agent_delisted");
    this.name = "AgentDelistedGatewayError";
    this.user_facing_message = buildUserFacingMessageFromReasonCodes(["agent_delisted"]);
  }
}

/** E-15: Agent in maintenance — reject new invocations; in-flight runs continue. */
export class AgentMaintenanceGatewayError extends Error {
  readonly code = "agent_maintenance" as const;
  readonly user_facing_message: UserFacingLocaleBundle;

  constructor() {
    super("agent_maintenance");
    this.name = "AgentMaintenanceGatewayError";
    this.user_facing_message = buildUserFacingMessageFromReasonCodes(["agent_maintenance"]);
  }
}

export interface RequestAgentInput {
  agent: Agent;
  userText: string;
  context: InvocationContextPayload;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface A2AResponse {
  text: string;
}

interface JsonRpcResponse {
  result?: {
    output_text?: string;
    text?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

const getTimeoutMs = (): number => {
  const raw = process.env.A2A_REQUEST_TIMEOUT_MS;
  const parsed = raw ? Number(raw) : 8000;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000;
};

const HEALTH_CHECK_TIMEOUT_MS = 5000;

/** T-5.4: Check Agent endpoint reachability (A2A capabilities.list or HTTP reach). */
export const checkAgentHealth = async (sourceUrl: string): Promise<{ ok: boolean; error?: string }> => {
  if (sourceUrl.startsWith("mock://")) {
    return { ok: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health-check",
        method: "capabilities.list",
        params: {},
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }

    const payload = (await response.json()) as JsonRpcResponse;
    if (payload.error && payload.error.code === -32601) {
      return { ok: true };
    }
    if (payload.error) {
      return { ok: false, error: `A2A error ${payload.error.code}: ${payload.error.message}` };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
};

const combineAbortSignals = (timeoutSignal: AbortSignal, userSignal?: AbortSignal): AbortSignal => {
  if (!userSignal) return timeoutSignal;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([timeoutSignal, userSignal]);
  }
  const merged = new AbortController();
  const forward = (): void => merged.abort();
  if (userSignal.aborted || timeoutSignal.aborted) {
    forward();
    return merged.signal;
  }
  userSignal.addEventListener("abort", forward, { once: true });
  timeoutSignal.addEventListener("abort", forward, { once: true });
  return merged.signal;
};

async function postTasksRun(
  sourceUrl: string,
  context: InvocationContextPayload,
  userText: string,
  fetchSignal: AbortSignal,
  agentDisplayName: string,
): Promise<A2AResponse> {
  if (sourceUrl.startsWith("mock://")) {
    return { text: `[${agentDisplayName}] ${userText}` };
  }

  const headerVal = JSON.stringify(context);
  const response = await fetch(sourceUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      [INVOCATION_CONTEXT_HEADER]: headerVal,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: context.run_id,
      method: "tasks.run",
      params: {
        user_content: [
          {
            type: "text",
            text: userText,
          },
        ],
        system_context: [
          {
            type: "text",
            text: `conversation_id:${context.conversation_id}`,
          },
        ],
      },
    }),
    signal: fetchSignal,
  });

  if (!response.ok) {
    throw new Error(`A2A endpoint returned HTTP ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse;
  if (payload.error) {
    throw new Error(`A2A error ${payload.error.code}: ${payload.error.message}`);
  }

  const outputText = payload.result?.output_text ?? payload.result?.text;
  if (!outputText) {
    throw new Error("A2A response missing output text");
  }

  return { text: outputText };
}

export const requestAgent = async (input: RequestAgentInput): Promise<A2AResponse> => {
  if (input.signal?.aborted) {
    throw new Error("orchestration_aborted");
  }

  const preListing = await getAgentListingStatusForGatewayAsync(input.agent.id);
  if (preListing == null) {
    throw new AgentDelistedGatewayError();
  }
  if (preListing === "delisted") {
    throw new AgentDelistedGatewayError();
  }
  if (preListing === "maintenance") {
    throw new AgentMaintenanceGatewayError();
  }

  const maxConcurrent = input.agent.max_concurrent ?? 1;
  const queueBehavior = input.agent.queue_behavior ?? "queue";
  const timeoutMs =
    input.timeoutMs != null && Number.isFinite(input.timeoutMs) && input.timeoutMs > 0
      ? input.timeoutMs
      : input.agent.timeout_ms != null &&
          Number.isFinite(input.agent.timeout_ms) &&
          input.agent.timeout_ms > 0
        ? input.agent.timeout_ms
        : getTimeoutMs();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const fetchSignal = combineAbortSignals(controller.signal, input.signal);

  try {
    return await withPerAgentConcurrency(
      input.agent.id,
      maxConcurrent,
      queueBehavior,
      fetchSignal,
      async () => {
        const gateListing = await getAgentListingStatusForGatewayAsync(input.agent.id);
        if (gateListing == null || gateListing === "delisted") {
          throw new AgentDelistedGatewayError();
        }
        if (gateListing === "maintenance") {
          throw new AgentMaintenanceGatewayError();
        }
        const urls = await listHealthyEndpointUrlsForAgentAsync(
          input.agent.id,
          input.agent.source_url,
        );
        return tryEndpointsWithFailover(input.agent.id, urls, (url) =>
          postTasksRun(url, input.context, input.userText, fetchSignal, input.agent.name),
        );
      },
    );
  } finally {
    clearTimeout(timeout);
  }
};
