import {
  emitProductEventAsync,
  emitProductEventOncePerUserAsync,
} from "./product-events.emit";

export async function emitOrchestrationStartedProductAsync(params: {
  userId: string;
  conversationId: string;
  runId: string;
  stepCount: number;
}): Promise<void> {
  await emitProductEventAsync({
    name: "orchestration.started",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: { run_id: params.runId, step_count: params.stepCount },
  });
  if (params.stepCount > 1) {
    await emitProductEventAsync({
      name: "agent.invoked_multi_step",
      userId: params.userId,
      conversationId: params.conversationId,
      payload: { run_id: params.runId, step_count: params.stepCount, source: "orchestration" },
    });
  }
}

export async function emitOrchestrationCompletedProductAsync(params: {
  userId: string;
  conversationId: string;
  runId: string;
}): Promise<void> {
  await emitProductEventAsync({
    name: "orchestration.completed",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: { run_id: params.runId },
  });
}

export async function emitOrchestrationFailedProductAsync(params: {
  userId: string;
  conversationId: string;
  runId: string;
  reason: string;
}): Promise<void> {
  await emitProductEventAsync({
    name: "orchestration.failed",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: { run_id: params.runId, reason: params.reason },
  });
}

export async function emitOrchestrationStepAgentInvokedProductAsync(params: {
  userId: string;
  conversationId: string;
  agentId: string;
  runId: string;
  stepIndex: number;
  correlationId?: string | null;
}): Promise<void> {
  await emitProductEventAsync({
    name: "agent.invoked",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: {
      agent_id: params.agentId,
      source: "orchestration",
      run_id: params.runId,
      step_index: params.stepIndex,
    },
    correlationId: params.correlationId ?? null,
  });
  await emitProductEventOncePerUserAsync({
    name: "user.first_valuable_reply",
    userId: params.userId,
    conversationId: params.conversationId,
    payload: { agent_id: params.agentId, source: "orchestration" },
    correlationId: params.correlationId ?? null,
  });
}
