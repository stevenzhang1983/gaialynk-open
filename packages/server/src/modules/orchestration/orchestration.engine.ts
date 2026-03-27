import { randomUUID } from "node:crypto";
import { checkRateLimit, getRateLimitInvocationPerHour } from "../../infra/rate-limiter";
import { emitAuditEventAsync } from "../audit/audit.store";
import { issueReceiptAsync } from "../audit/receipt.store";
import { appendMessageAsync } from "../conversation/conversation.store";
import { publishConversationRealtime } from "../conversation/conversation-realtime";
import type { Agent, AgentCapability } from "../directory/agent.store";
import { getAgentByIdAsync } from "../directory/agent.store";
import { createPendingInvocationAsync } from "../gateway/invocation.store";
import {
  AgentDelistedGatewayError,
  AgentMaintenanceGatewayError,
  requestAgent,
} from "../gateway/a2a.gateway";
import { scheduledInvocationContext, sessionInvocationContext } from "../gateway/invocation-context";
import { evaluateTrustDecision } from "../trust/trust.engine";
import { evaluateDataBoundaryPolicy } from "../trust/data-boundary.policy";
import { computeNextCronFireIso } from "./orchestration-cron";
import { validateJsonSchemaSubset } from "./orchestration-json-schema-lite";
import { buildStepUserText, mergeStepInputMapping } from "./orchestration-step-input";
import type { OrchestrationRun, OrchestrationStepRow, TopologyStepSpec } from "./orchestration.types";
import {
  getOrchestrationRunAsync,
  listOrchestrationStepsAsync,
  refreshStepRunIdPerStepAsync,
  updateOrchestrationRunAsync,
  updateOrchestrationStepAsync,
} from "./orchestration.store";
import {
  notifyOrchestrationStepOutcomeAsync,
  notifyReviewRequiredAsync,
} from "../notifications/notification-triggers";
import {
  emitOrchestrationCompletedProductAsync,
  emitOrchestrationFailedProductAsync,
  emitOrchestrationStepAgentInvokedProductAsync,
} from "../product-events/product-events.orchestration";

const runAbortControllers = new Map<string, AbortController>();

export const attachOrchestrationRunAbortController = (runId: string): AbortSignal => {
  const c = new AbortController();
  runAbortControllers.set(runId, c);
  return c.signal;
};

export const abortOrchestrationRun = (runId: string): void => {
  runAbortControllers.get(runId)?.abort();
};

export const detachOrchestrationRunAbortController = (runId: string): void => {
  runAbortControllers.delete(runId);
};

/** New controller for a resumed segment (retry / post–human-review) without aborting an in-flight request incorrectly. */
export const replaceOrchestrationRunAbortController = (runId: string): AbortSignal => {
  const c = new AbortController();
  runAbortControllers.set(runId, c);
  return c.signal;
};

export const validateStepOutputText = (text: string, requiredFields: string[]): boolean => {
  const structured: Record<string, string> = { text };
  return requiredFields.every((field) => {
    const v = structured[field];
    return typeof v === "string" && v.trim().length > 0;
  });
};

const pickCapability = (agent: Agent, spec: TopologyStepSpec): AgentCapability | undefined => {
  if (spec.capability_name) {
    return agent.capabilities.find((c) => c.name === spec.capability_name);
  }
  return agent.capabilities[0];
};

const finishRun = async (runId: string, status: OrchestrationRun["status"], finishedAt: string): Promise<void> => {
  const run = await getOrchestrationRunAsync(runId);
  const reschedule =
    run &&
    run.schedule_cron &&
    run.schedule_cron.trim().length > 0 &&
    !run.cancel_requested &&
    (status === "completed" || status === "failed" || status === "partial_completed");

  if (reschedule && run.schedule_cron) {
    const nextIso = computeNextCronFireIso(run.schedule_cron, new Date(finishedAt));
    await updateOrchestrationRunAsync(runId, {
      status: "scheduled",
      finished_at: finishedAt,
      updated_at: finishedAt,
      next_run_at: nextIso,
      paused_reason: null,
      current_step: 0,
    });
    detachOrchestrationRunAbortController(runId);
    return;
  }

  await updateOrchestrationRunAsync(runId, {
    status,
    finished_at: finishedAt,
    updated_at: finishedAt,
  });
};

const terminalOrchestrationStatuses: OrchestrationRun["status"][] = [
  "completed",
  "failed",
  "partial_completed",
  "canceled",
];

export const maybeDetachOrchestrationAbortOnTerminalAsync = async (runId: string): Promise<void> => {
  const r = await getOrchestrationRunAsync(runId);
  if (r && terminalOrchestrationStatuses.includes(r.status)) {
    detachOrchestrationRunAbortController(runId);
  }
};

export const executeOrchestrationRunAsync = async (params: {
  runId: string;
  startFromStep: number;
  actorId: string;
  abortSignal: AbortSignal;
  invocationSource?: "session" | "scheduled";
}): Promise<void> => {
  const { runId, startFromStep, actorId, abortSignal, invocationSource = "session" } = params;
  let run = await getOrchestrationRunAsync(runId);
  if (!run) return;

  let prevOutput: Record<string, unknown> | null = null;
  if (startFromStep > 0) {
    const prior = await listOrchestrationStepsAsync(runId);
    const lastOk = prior
      .filter((s) => s.step_index < startFromStep && (s.status === "completed" || s.status === "completed_with_warnings"))
      .pop();
    prevOutput = lastOk?.output_json ?? null;
  }

  if (startFromStep >= run.steps_json.length) {
    const endAt = new Date().toISOString();
    await finishRun(runId, "completed", endAt);
    void emitOrchestrationCompletedProductAsync({
      userId: run.user_id,
      conversationId: run.conversation_id,
      runId,
    });
    await emitAuditEventAsync({
      eventType: "orchestration.run.completed",
      conversationId: run.conversation_id,
      actorType: "system",
      actorId: "system",
      payload: { run_id: runId, tail: true },
      correlationId: randomUUID(),
    });
    await appendMessageAsync({
      conversationId: run.conversation_id,
      senderType: "system",
      senderId: "system",
      text: "多 Agent 编排已全部完成。",
    });
    return;
  }

  for (let i = startFromStep; i < run.steps_json.length; i++) {
    const fresh = await getOrchestrationRunAsync(runId);
    if (!fresh) return;
    if (fresh.cancel_requested || abortSignal.aborted) {
      await finishRun(runId, "canceled", new Date().toISOString());
      void emitOrchestrationFailedProductAsync({
        userId: fresh.user_id,
        conversationId: fresh.conversation_id,
        runId,
        reason: "canceled",
      });
      await appendMessageAsync({
        conversationId: fresh.conversation_id,
        senderType: "system",
        senderId: "system",
        text: "编排已取消；排队步骤未执行。",
      });
      return;
    }

    run = fresh;
    const spec = run.steps_json[i] as TopologyStepSpec;
    const stepsNow = await listOrchestrationStepsAsync(runId);
    const stepRow = stepsNow.find((s) => s.step_index === i);
    if (!stepRow) return;

    const correlationId = randomUUID();
    const agent = await getAgentByIdAsync(spec.agent_id);
    if (!agent) {
      await updateOrchestrationStepAsync(stepRow.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: "agent_not_found",
      });
      await emitAuditEventAsync({
        eventType: "orchestration.step.failed",
        conversationId: run.conversation_id,
        agentId: spec.agent_id,
        actorType: "system",
        actorId: "system",
        payload: { run_id: runId, step_index: i, run_id_per_step: stepRow.run_id_per_step, reason: "agent_not_found" },
        correlationId,
      });
      await finishRun(runId, i === 0 ? "failed" : "partial_completed", new Date().toISOString());
      void emitOrchestrationFailedProductAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        reason: "agent_not_found",
      });
      await appendMessageAsync({
        conversationId: run.conversation_id,
        senderType: "system",
        senderId: "system",
        text: `编排步骤 ${i + 1} 失败：Agent 不存在。`,
      });
      await notifyOrchestrationStepOutcomeAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        stepIndex: i,
        outcome: "failed",
        errorMessage: "agent_not_found",
      });
      return;
    }

    const capability = pickCapability(agent, spec);
    const trust = evaluateTrustDecision({
      agent,
      capability,
      context: { conversationId: run.conversation_id, actorId },
    });

    await emitAuditEventAsync({
      eventType: "orchestration.trust.evaluated",
      conversationId: run.conversation_id,
      agentId: agent.id,
      actorType: "user",
      actorId,
      payload: {
        run_id: runId,
        step_index: i,
        run_id_per_step: stepRow.run_id_per_step,
        trust_decision: trust.decision,
      },
      trustDecision: trust,
      correlationId,
    });

    if (trust.decision === "deny") {
      await updateOrchestrationStepAsync(stepRow.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: trust.reason_codes.join(","),
      });
      await finishRun(runId, i === 0 ? "failed" : "partial_completed", new Date().toISOString());
      void emitOrchestrationFailedProductAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        reason: "trust_deny",
      });
      await appendMessageAsync({
        conversationId: run.conversation_id,
        senderType: "system",
        senderId: "system",
        text: `编排步骤 ${i + 1} 被信任策略拒绝：${trust.explain_text}`,
      });
      await notifyOrchestrationStepOutcomeAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        stepIndex: i,
        outcome: "failed",
        errorMessage: trust.reason_codes.join(","),
      });
      return;
    }

    const invRl = await checkRateLimit(`inv:user:hourly:${run.user_id}`, getRateLimitInvocationPerHour(), 3600);
    if (!invRl.allowed) {
      await updateOrchestrationStepAsync(stepRow.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: "rate_limit_exceeded",
      });
      await finishRun(runId, i === 0 ? "failed" : "partial_completed", new Date().toISOString());
      void emitOrchestrationFailedProductAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        reason: "rate_limit_exceeded",
      });
      await appendMessageAsync({
        conversationId: run.conversation_id,
        senderType: "system",
        senderId: "system",
        text: `编排步骤 ${i + 1} 因调用频率限制已中止：请稍后再试。`,
      });
      await notifyOrchestrationStepOutcomeAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        stepIndex: i,
        outcome: "failed",
        errorMessage: "rate_limit_exceeded",
      });
      return;
    }

    const pathMapping = mergeStepInputMapping(spec, stepRow.input_mapping);
    const userText = buildStepUserText(spec, run.user_message, prevOutput, pathMapping);
    const leaseUntil = new Date(Date.now() + run.step_timeout_ms).toISOString();
    await updateOrchestrationStepAsync(stepRow.id, {
      status: trust.decision === "need_confirmation" ? "awaiting_human_review" : "running",
      input_json: { user_text: userText, template: spec.expected_input.template },
      started_at: stepRow.started_at ?? new Date().toISOString(),
      lease_expires_at: trust.decision === "need_confirmation" ? null : leaseUntil,
    });
    await updateOrchestrationRunAsync(runId, { current_step: i, updated_at: new Date().toISOString() });

    if (trust.decision === "need_confirmation") {
      const inv = await createPendingInvocationAsync({
        conversationId: run.conversation_id,
        agentId: agent.id,
        requesterId: actorId,
        userText,
        orchestrationRunId: runId,
        orchestrationStepIndex: i,
      });
      await updateOrchestrationStepAsync(stepRow.id, { pending_invocation_id: inv.id });
      await updateOrchestrationRunAsync(runId, {
        status: "awaiting_human_review",
        paused_reason: "trust_need_confirmation",
        updated_at: new Date().toISOString(),
      });
      await emitAuditEventAsync({
        eventType: "orchestration.run.awaiting_human_review",
        conversationId: run.conversation_id,
        agentId: agent.id,
        actorType: "system",
        actorId: "system",
        payload: {
          run_id: runId,
          step_index: i,
          run_id_per_step: stepRow.run_id_per_step,
          invocation_id: inv.id,
        },
        correlationId,
      });
      await appendMessageAsync({
        conversationId: run.conversation_id,
        senderType: "system",
        senderId: "system",
        text: `编排步骤 ${i + 1} 等待人工确认（Trust）。请在审核队列中批准后自动继续。`,
      });
      await notifyReviewRequiredAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        invocationId: inv.id,
      });
      return;
    }

    const boundary = evaluateDataBoundaryPolicy({ text: userText });
    if (boundary.decision === "deny") {
      await updateOrchestrationStepAsync(stepRow.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: "data_boundary_denied",
      });
      await finishRun(runId, i === 0 ? "failed" : "partial_completed", new Date().toISOString());
      void emitOrchestrationFailedProductAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        reason: "data_boundary_denied",
      });
      await notifyOrchestrationStepOutcomeAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        stepIndex: i,
        outcome: "failed",
        errorMessage: "data_boundary_denied",
      });
      return;
    }

    let outputText: string;
    try {
      const invCtx =
        invocationSource === "scheduled"
          ? scheduledInvocationContext({
              gaiaUserId: run.user_id,
              conversationId: run.conversation_id,
              runId: stepRow.run_id_per_step,
              traceId: correlationId,
              subscriptionId: run.id,
            })
          : sessionInvocationContext({
              gaiaUserId: run.user_id,
              conversationId: run.conversation_id,
              runId: stepRow.run_id_per_step,
              traceId: correlationId,
            });
      const res = await requestAgent({
        agent,
        userText,
        signal: abortSignal,
        timeoutMs: run.step_timeout_ms,
        context: invCtx,
      });
      outputText = res.text;
      void emitOrchestrationStepAgentInvokedProductAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        agentId: agent.id,
        runId,
        stepIndex: i,
        correlationId,
      });
    } catch (e) {
      let msg = e instanceof Error ? e.message : "unknown_error";
      if (e instanceof AgentDelistedGatewayError) {
        msg = "agent_delisted";
      } else if (e instanceof AgentMaintenanceGatewayError) {
        msg = "agent_maintenance";
      }
      const isTimeout = msg.toLowerCase().includes("abort") || msg === "orchestration_aborted";
      const stepStatus = isTimeout ? ("lease_expired" as const) : ("awaiting_user" as const);
      const runStatus = isTimeout ? ("lease_expired" as const) : ("awaiting_user" as const);
      const pausedReason = isTimeout ? "lease_expired" : "a2a_error";
      await updateOrchestrationStepAsync(stepRow.id, {
        status: stepStatus,
        finished_at: new Date().toISOString(),
        error_message: msg,
        lease_expires_at: null,
      });
      await updateOrchestrationRunAsync(runId, {
        status: runStatus,
        paused_reason: pausedReason,
        updated_at: new Date().toISOString(),
      });
      await emitAuditEventAsync({
        eventType: "orchestration.step.failed",
        conversationId: run.conversation_id,
        agentId: agent.id,
        actorType: "system",
        actorId: "system",
        payload: {
          run_id: runId,
          step_index: i,
          run_id_per_step: stepRow.run_id_per_step,
          reason: msg,
          lease_expired: isTimeout,
        },
        correlationId,
      });
      await appendMessageAsync({
        conversationId: run.conversation_id,
        senderType: "system",
        senderId: "system",
        text: `编排步骤 ${i + 1} ${
          isTimeout ? "租约已到期（超时）" : "执行失败"
        }：${msg}。你可重试本步、放弃整链，或（非超时错误时）稍后重试。`,
      });
      await notifyOrchestrationStepOutcomeAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        stepIndex: i,
        outcome: "failed",
        errorMessage: msg,
      });
      return;
    }

    if (!validateStepOutputText(outputText, spec.expected_output.required_fields)) {
      await updateOrchestrationStepAsync(stepRow.id, {
        status: "failed",
        finished_at: new Date().toISOString(),
        error_message: "output_contract_violation",
      });
      await finishRun(runId, i === 0 ? "failed" : "partial_completed", new Date().toISOString());
      void emitOrchestrationFailedProductAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        reason: "output_contract_violation",
      });
      await notifyOrchestrationStepOutcomeAsync({
        userId: run.user_id,
        conversationId: run.conversation_id,
        runId,
        stepIndex: i,
        outcome: "failed",
        errorMessage: "output_contract_violation",
      });
      return;
    }

    const outputJson: Record<string, unknown> = { text: outputText };
    prevOutput = outputJson;

    const schema = stepRow.output_schema ?? spec.output_schema;
    let stepStatus: "completed" | "completed_with_warnings" = "completed";
    let schemaWarnDetail = "";
    if (schema) {
      const v = validateJsonSchemaSubset(outputJson, schema);
      if (!v.ok) {
        stepStatus = "completed_with_warnings";
        schemaWarnDetail = v.errors.join("; ");
      }
    }

    const agentMessage = await appendMessageAsync({
      conversationId: run.conversation_id,
      senderType: "agent",
      senderId: agent.id,
      text: outputText,
    });
    if (agentMessage) publishConversationRealtime(run.conversation_id, agentMessage);

    await updateOrchestrationStepAsync(stepRow.id, {
      status: stepStatus,
      output_json: outputJson,
      output_snapshot: outputJson,
      finished_at: new Date().toISOString(),
      lease_expires_at: null,
    });

    if (stepStatus === "completed_with_warnings") {
      await appendMessageAsync({
        conversationId: run.conversation_id,
        senderType: "system",
        senderId: "system",
        text: `编排步骤 ${i + 1} 已完成，但输出与可选契约不完全一致（${schemaWarnDetail}）。后续步骤将继续执行；请留意结果质量。`,
      });
    }

    const doneEvent = await emitAuditEventAsync({
      eventType: "orchestration.step.completed",
      conversationId: run.conversation_id,
      agentId: agent.id,
      actorType: "agent",
      actorId: agent.id,
      payload: {
        run_id: runId,
        step_index: i,
        run_id_per_step: stepRow.run_id_per_step,
        message_id: agentMessage?.id,
        completed_with_warnings: stepStatus === "completed_with_warnings",
        schema_warnings: stepStatus === "completed_with_warnings" ? schemaWarnDetail : undefined,
      },
      trustDecision: trust,
      correlationId,
    });

    await issueReceiptAsync({
      auditEventId: doneEvent.id,
      conversationId: run.conversation_id,
      receiptType: "orchestration_step_completed",
      payload: {
        run_id: runId,
        step_index: i,
        run_id_per_step: stepRow.run_id_per_step,
        completed_with_warnings: stepStatus === "completed_with_warnings",
      },
    });

    await notifyOrchestrationStepOutcomeAsync({
      userId: run.user_id,
      conversationId: run.conversation_id,
      runId,
      stepIndex: i,
      outcome: "completed",
    });
  }

  const endAt = new Date().toISOString();
  await finishRun(runId, "completed", endAt);
  void emitOrchestrationCompletedProductAsync({
    userId: run.user_id,
    conversationId: run.conversation_id,
    runId,
  });
  await emitAuditEventAsync({
    eventType: "orchestration.run.completed",
    conversationId: run.conversation_id,
    actorType: "system",
    actorId: "system",
    payload: { run_id: runId },
    correlationId: randomUUID(),
  });
  await appendMessageAsync({
    conversationId: run.conversation_id,
    senderType: "system",
    senderId: "system",
    text: "多 Agent 编排已全部完成。",
  });
};

export const continueOrchestrationAfterInvocationConfirmAsync = async (params: {
  runId: string;
  stepIndex: number;
  outputText: string;
  agentId: string;
  actorId: string;
  agentMessageId: string;
}): Promise<void> => {
  const run = await getOrchestrationRunAsync(params.runId);
  if (!run) return;
  const steps = await listOrchestrationStepsAsync(params.runId);
  const stepRow = steps.find((s) => s.step_index === params.stepIndex);
  if (!stepRow) return;

  const spec = run.steps_json[params.stepIndex] as TopologyStepSpec;
  if (!validateStepOutputText(params.outputText, spec.expected_output.required_fields)) {
    await updateOrchestrationStepAsync(stepRow.id, {
      status: "failed",
      error_message: "output_contract_violation_after_confirm",
      finished_at: new Date().toISOString(),
      pending_invocation_id: null,
    });
    await finishRun(params.runId, params.stepIndex === 0 ? "failed" : "partial_completed", new Date().toISOString());
    void emitOrchestrationFailedProductAsync({
      userId: run.user_id,
      conversationId: run.conversation_id,
      runId: params.runId,
      reason: "output_contract_violation_after_confirm",
    });
    await notifyOrchestrationStepOutcomeAsync({
      userId: run.user_id,
      conversationId: run.conversation_id,
      runId: params.runId,
      stepIndex: params.stepIndex,
      outcome: "failed",
      errorMessage: "output_contract_violation_after_confirm",
    });
    return;
  }

  const outputJson: Record<string, unknown> = { text: params.outputText };
  const schema = stepRow.output_schema ?? spec.output_schema;
  let stepStatus: "completed" | "completed_with_warnings" = "completed";
  let schemaWarnDetail = "";
  if (schema) {
    const v = validateJsonSchemaSubset(outputJson, schema);
    if (!v.ok) {
      stepStatus = "completed_with_warnings";
      schemaWarnDetail = v.errors.join("; ");
    }
  }

  await updateOrchestrationStepAsync(stepRow.id, {
    status: stepStatus,
    output_json: outputJson,
    output_snapshot: outputJson,
    finished_at: new Date().toISOString(),
    pending_invocation_id: null,
    lease_expires_at: null,
  });

  if (stepStatus === "completed_with_warnings") {
    await appendMessageAsync({
      conversationId: run.conversation_id,
      senderType: "system",
      senderId: "system",
      text: `编排步骤 ${params.stepIndex + 1} 已完成，但输出与可选契约不完全一致（${schemaWarnDetail}）。后续步骤将继续执行；请留意结果质量。`,
    });
  }

  await updateOrchestrationRunAsync(params.runId, {
    status: "running",
    paused_reason: null,
    current_step: params.stepIndex + 1,
    updated_at: new Date().toISOString(),
  });

  await emitAuditEventAsync({
    eventType: "orchestration.step.completed",
    conversationId: run.conversation_id,
    agentId: params.agentId,
    actorType: "user",
    actorId: params.actorId,
    payload: {
      run_id: params.runId,
      step_index: params.stepIndex,
      run_id_per_step: stepRow.run_id_per_step,
      message_id: params.agentMessageId,
      resumed_after: "human_review",
      completed_with_warnings: stepStatus === "completed_with_warnings",
    },
    correlationId: randomUUID(),
  });

  await notifyOrchestrationStepOutcomeAsync({
    userId: run.user_id,
    conversationId: run.conversation_id,
    runId: params.runId,
    stepIndex: params.stepIndex,
    outcome: "completed",
  });

  const abortSignal = replaceOrchestrationRunAbortController(params.runId);
  await executeOrchestrationRunAsync({
    runId: params.runId,
    startFromStep: params.stepIndex + 1,
    actorId: params.actorId,
    abortSignal,
  });
};

export const retryOrchestrationStepAsync = async (params: {
  runId: string;
  stepIndex: number;
  actorId: string;
}): Promise<void> => {
  const run = await getOrchestrationRunAsync(params.runId);
  if (!run) return;
  const steps = await listOrchestrationStepsAsync(params.runId);
  const stepRow = steps.find((s) => s.step_index === params.stepIndex);
  if (!stepRow) return;
  if (stepRow.status !== "failed" && stepRow.status !== "awaiting_user" && stepRow.status !== "lease_expired") {
    throw new Error("step_not_retryable");
  }

  await refreshStepRunIdPerStepAsync(stepRow.id);
  const refreshed = (await listOrchestrationStepsAsync(params.runId)).find((s) => s.step_index === params.stepIndex);
  if (!refreshed) return;

  await updateOrchestrationStepAsync(refreshed.id, {
    status: "pending",
    input_json: null,
    output_json: null,
    output_snapshot: null,
    started_at: null,
    finished_at: null,
    error_message: null,
    pending_invocation_id: null,
    lease_expires_at: null,
  });

  await updateOrchestrationRunAsync(params.runId, {
    status: "running",
    paused_reason: null,
    finished_at: null,
    updated_at: new Date().toISOString(),
  });

  await emitAuditEventAsync({
    eventType: "orchestration.step.retry",
    conversationId: run.conversation_id,
    actorType: "user",
    actorId: params.actorId,
    payload: {
      run_id: params.runId,
      step_index: params.stepIndex,
      run_id_per_step: refreshed.run_id_per_step,
    },
    correlationId: randomUUID(),
  });

  const abortSignal = replaceOrchestrationRunAbortController(params.runId);
  await executeOrchestrationRunAsync({
    runId: params.runId,
    startFromStep: params.stepIndex,
    actorId: params.actorId,
    abortSignal,
  });
};
