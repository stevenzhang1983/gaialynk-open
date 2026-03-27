import type { Hono } from "hono";
import { randomUUID } from "node:crypto";
import { createAuthMeMiddleware, requireAuth } from "../auth/auth.routes";
import { emitAuditEventAsync } from "../audit/audit.store";
import {
  conversationHasUserParticipantAsync,
  getConversationDetailAsync,
  getConversationSummaryAsync,
} from "../conversation/conversation.store";
import { getAgentByIdAsync, type Agent } from "../directory/agent.store";
import { userIsMemberOfSpaceAsync } from "../spaces/space.store";
import {
  abortOrchestrationRun,
  attachOrchestrationRunAbortController,
  detachOrchestrationRunAbortController,
  executeOrchestrationRunAsync,
  maybeDetachOrchestrationAbortOnTerminalAsync,
  retryOrchestrationStepAsync,
} from "./orchestration.engine";
import { assertValidCronExpression, computeNextCronFireIso } from "./orchestration-cron";
import { recommendTopology } from "./intent-router";
import {
  orchestrationCancelBodySchema,
  orchestrationExecuteBodySchema,
  orchestrationRecommendBodySchema,
  orchestrationResumeBodySchema,
  orchestrationRetryBodySchema,
  orchestrationScheduledPatchBodySchema,
} from "./orchestration.schema";
import { emitOrchestrationStartedProductAsync } from "../product-events/product-events.orchestration";
import {
  createOrchestrationRunWithStepsAsync,
  findRunByUserIdempotencyKeyAsync,
  getOrchestrationRunAsync,
  listOrchestrationStepsAsync,
  listUserScheduledOrchestrationRunsAsync,
  updateOrchestrationRunAsync,
} from "./orchestration.store";

async function enforceSpaceAndParticipant(
  c: { req: { header: (n: string) => string | undefined }; json: (b: unknown, s: number) => Response },
  conversationId: string,
  userId: string,
): Promise<Response | null> {
  const summary = await getConversationSummaryAsync(conversationId);
  if (!summary) {
    return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
  }
  if (summary.space_id) {
    const auth = c.req.header("Authorization")?.trim();
    if (!auth?.startsWith("Bearer ")) {
      return c.json({ error: { code: "unauthorized", message: "需要 Bearer 登录。" } }, 401);
    }
    const ok = await userIsMemberOfSpaceAsync(summary.space_id, userId);
    if (!ok) {
      return c.json({ error: { code: "forbidden", message: "你不是该 Space 成员。" } }, 403);
    }
  }
  const isParticipant = await conversationHasUserParticipantAsync(conversationId, userId);
  if (!isParticipant) {
    return c.json({ error: { code: "forbidden", message: "你不是该会话参与者。" } }, 403);
  }
  return null;
}

async function agentsInConversation(conversationId: string): Promise<Agent[]> {
  const detail = await getConversationDetailAsync(conversationId);
  if (!detail) return [];
  const agentIds = detail.participants
    .filter((p) => p.participant_type === "agent")
    .map((p) => p.participant_id);
  const agents: Agent[] = [];
  for (const id of agentIds) {
    const a = await getAgentByIdAsync(id);
    if (a) agents.push(a);
  }
  return agents;
}

const authMw = createAuthMeMiddleware();

const requireOrchestrationRunId = (c: { req: { param: (k: string) => string | undefined }; json: (b: unknown, s: number) => Response }): string | Response => {
  const runId = c.req.param("id")?.trim() ?? "";
  if (!runId) {
    return c.json({ error: { code: "invalid_run_id", message: "Missing orchestration run id" } }, 400);
  }
  return runId;
};

export function registerOrchestrationRoutes(app: Hono): void {
  app.post("/api/v1/orchestrations/recommend", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const parsed = orchestrationRecommendBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } }, 400);
    }
    const { conversation_id, user_message } = parsed.data;

    const denied = await enforceSpaceAndParticipant(c, conversation_id, auth.userId);
    if (denied) return denied;

    const agents = await agentsInConversation(conversation_id);
    const { steps, route_reason_codes } = await recommendTopology({ userMessage: user_message, agents });

    const cid = c.req.header("X-Correlation-Id")?.trim() || randomUUID();
    await emitAuditEventAsync({
      eventType: "orchestration.topology.recommended",
      conversationId: conversation_id,
      actorType: "user",
      actorId: auth.userId,
      payload: { step_count: steps.length, route_reason_codes },
      correlationId: cid,
    });

    return c.json({ data: { steps, route_reason_codes, conversation_id, user_message } }, 200);
  });

  app.post("/api/v1/orchestrations/execute", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const parsed = orchestrationExecuteBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } }, 400);
    }
    const body = parsed.data;

    const denied = await enforceSpaceAndParticipant(c, body.conversation_id, auth.userId);
    if (denied) return denied;

    const joined = await agentsInConversation(body.conversation_id);
    const joinedIds = new Set(joined.map((a) => a.id));
    const invalid = body.steps.find((s) => !joinedIds.has(s.agent_id));
    if (invalid) {
      return c.json(
        { error: { code: "agent_not_in_conversation", message: "Every step agent must be a conversation participant", details: { agent_id: invalid.agent_id } } },
        400,
      );
    }

    if (body.idempotency_key) {
      const existing = await findRunByUserIdempotencyKeyAsync(auth.userId, body.idempotency_key);
      if (existing) {
        const steps = await listOrchestrationStepsAsync(existing.id);
        return c.json({ data: { run: existing, steps, idempotent_replay: true } }, 200);
      }
    }

    const timeoutMs = body.step_timeout_ms ?? 120_000;
    if (body.schedule_cron) {
      try {
        assertValidCronExpression(body.schedule_cron);
      } catch {
        return c.json({ error: { code: "invalid_cron", message: "Invalid schedule_cron expression" } }, 400);
      }
    }

    const { run } = await createOrchestrationRunWithStepsAsync({
      conversationId: body.conversation_id,
      userId: auth.userId,
      topologySource: body.topology_source,
      steps: body.steps,
      userMessage: body.user_message,
      idempotencyKey: body.idempotency_key,
      stepTimeoutMs: timeoutMs,
      scheduleCron: body.schedule_cron,
    });

    void emitOrchestrationStartedProductAsync({
      userId: auth.userId,
      conversationId: body.conversation_id,
      runId: run.id,
      stepCount: body.steps.length,
    });

    if (!body.schedule_cron) {
      const signal = attachOrchestrationRunAbortController(run.id);
      void executeOrchestrationRunAsync({
        runId: run.id,
        startFromStep: 0,
        actorId: auth.userId,
        abortSignal: signal,
      })
        .catch(() => {})
        .finally(() => {
          void maybeDetachOrchestrationAbortOnTerminalAsync(run.id);
        });
    }

    const steps = await listOrchestrationStepsAsync(run.id);
    return c.json({ data: { run, steps } }, 202);
  });

  app.get("/api/v1/orchestrations/scheduled", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const runs = await listUserScheduledOrchestrationRunsAsync(auth.userId);
    return c.json({ data: { runs } }, 200);
  });

  app.patch("/api/v1/orchestrations/scheduled/:id", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const runId = c.req.param("id")?.trim() ?? "";
    if (!runId) {
      return c.json({ error: { code: "invalid_run_id", message: "Missing orchestration run id" } }, 400);
    }

    const parsed = orchestrationScheduledPatchBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } }, 400);
    }

    const run = await getOrchestrationRunAsync(runId);
    if (!run || run.user_id !== auth.userId) {
      return c.json({ error: { code: "orchestration_not_found", message: "Orchestration run not found" } }, 404);
    }
    if (!run.schedule_cron?.trim()) {
      return c.json({ error: { code: "not_scheduled", message: "Run is not a scheduled orchestration" } }, 400);
    }

    const denied = await enforceSpaceAndParticipant(c, run.conversation_id, auth.userId);
    if (denied) return denied;

    const now = new Date().toISOString();
    const { action } = parsed.data;

    if (action === "pause") {
      if (run.status !== "scheduled") {
        return c.json({ error: { code: "not_pausable", message: "Only waiting scheduled runs can be paused" } }, 409);
      }
      await updateOrchestrationRunAsync(runId, {
        status: "schedule_paused",
        next_run_at: null,
        paused_reason: "user_paused_schedule",
        updated_at: now,
      });
    } else {
      if (run.status !== "schedule_paused") {
        return c.json({ error: { code: "not_resumable", message: "Run is not paused" } }, 409);
      }
      let nextIso: string;
      try {
        nextIso = computeNextCronFireIso(run.schedule_cron, new Date());
      } catch {
        return c.json({ error: { code: "invalid_cron", message: "Invalid schedule_cron on run" } }, 400);
      }
      await updateOrchestrationRunAsync(runId, {
        status: "scheduled",
        next_run_at: nextIso,
        paused_reason: null,
        updated_at: now,
      });
    }

    const latest = await getOrchestrationRunAsync(runId);
    return c.json({ data: { run: latest } }, 200);
  });

  app.get("/api/v1/orchestrations/:id", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const runIdOrErr = requireOrchestrationRunId(c);
    if (runIdOrErr instanceof Response) return runIdOrErr;
    const runId = runIdOrErr;
    const run = await getOrchestrationRunAsync(runId);
    if (!run || run.user_id !== auth.userId) {
      return c.json({ error: { code: "orchestration_not_found", message: "Orchestration run not found" } }, 404);
    }

    const denied = await enforceSpaceAndParticipant(c, run.conversation_id, auth.userId);
    if (denied) return denied;

    const steps = await listOrchestrationStepsAsync(runId);
    return c.json({ data: { run, steps } }, 200);
  });

  app.post("/api/v1/orchestrations/:id/cancel", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const parsed = orchestrationCancelBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } }, 400);
    }
    if (parsed.data.actor_id !== auth.userId) {
      return c.json({ error: { code: "forbidden", message: "actor_id must match authenticated user" } }, 403);
    }

    const runIdOrErr = requireOrchestrationRunId(c);
    if (runIdOrErr instanceof Response) return runIdOrErr;
    const runId = runIdOrErr;
    const run = await getOrchestrationRunAsync(runId);
    if (!run || run.user_id !== auth.userId) {
      return c.json({ error: { code: "orchestration_not_found", message: "Orchestration run not found" } }, 404);
    }

    const denied = await enforceSpaceAndParticipant(c, run.conversation_id, auth.userId);
    if (denied) return denied;

    const now = new Date().toISOString();
    await updateOrchestrationRunAsync(runId, {
      cancel_requested: true,
      updated_at: now,
      schedule_cron: null,
      next_run_at: null,
    });
    abortOrchestrationRun(runId);

    const latest = await getOrchestrationRunAsync(runId);
    if (
      latest &&
      !["completed", "failed", "partial_completed", "canceled"].includes(latest.status)
    ) {
      await updateOrchestrationRunAsync(runId, {
        status: "canceled",
        finished_at: now,
        updated_at: now,
        schedule_cron: null,
        next_run_at: null,
      });
    }
    detachOrchestrationRunAbortController(runId);

    const cid = c.req.header("X-Correlation-Id")?.trim() || randomUUID();
    await emitAuditEventAsync({
      eventType: "orchestration.run.canceled",
      conversationId: run.conversation_id,
      actorType: "user",
      actorId: auth.userId,
      payload: { run_id: runId },
      correlationId: cid,
    });

    return c.json({ data: { run_id: runId, status: "canceled" } }, 200);
  });

  app.post("/api/v1/orchestrations/:id/steps/:stepIndex/retry", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const parsed = orchestrationRetryBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } }, 400);
    }
    if (parsed.data.actor_id !== auth.userId) {
      return c.json({ error: { code: "forbidden", message: "actor_id must match authenticated user" } }, 403);
    }

    const runIdOrErr = requireOrchestrationRunId(c);
    if (runIdOrErr instanceof Response) return runIdOrErr;
    const runId = runIdOrErr;
    const stepIndex = Number(c.req.param("stepIndex"));
    if (!Number.isInteger(stepIndex) || stepIndex < 0) {
      return c.json({ error: { code: "invalid_step_index", message: "Invalid step index" } }, 400);
    }

    const run = await getOrchestrationRunAsync(runId);
    if (!run || run.user_id !== auth.userId) {
      return c.json({ error: { code: "orchestration_not_found", message: "Orchestration run not found" } }, 404);
    }

    const denied = await enforceSpaceAndParticipant(c, run.conversation_id, auth.userId);
    if (denied) return denied;

    const stepRows = await listOrchestrationStepsAsync(runId);
    const target = stepRows.find((s) => s.step_index === stepIndex);
    if (
      !target ||
      (target.status !== "failed" && target.status !== "awaiting_user" && target.status !== "lease_expired")
    ) {
      return c.json(
        { error: { code: "step_not_retryable", message: "Step cannot be retried in current status" } },
        409,
      );
    }

    void retryOrchestrationStepAsync({
      runId,
      stepIndex,
      actorId: auth.userId,
    })
      .catch(() => {})
      .finally(() => {
        void maybeDetachOrchestrationAbortOnTerminalAsync(runId);
      });

    return c.json({ data: { run_id: runId, step_index: stepIndex, status: "retry_queued" } }, 202);
  });

  app.post("/api/v1/orchestrations/:id/resume", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);

    const parsed = orchestrationResumeBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json({ error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } }, 400);
    }
    if (parsed.data.actor_id !== auth.userId) {
      return c.json({ error: { code: "forbidden", message: "actor_id must match authenticated user" } }, 403);
    }

    const runIdOrErr = requireOrchestrationRunId(c);
    if (runIdOrErr instanceof Response) return runIdOrErr;
    const runId = runIdOrErr;
    const run = await getOrchestrationRunAsync(runId);
    if (!run || run.user_id !== auth.userId) {
      return c.json({ error: { code: "orchestration_not_found", message: "Orchestration run not found" } }, 404);
    }

    const denied = await enforceSpaceAndParticipant(c, run.conversation_id, auth.userId);
    if (denied) return denied;

    if (parsed.data.action === "abandon_run") {
      const now = new Date().toISOString();
      await updateOrchestrationRunAsync(runId, {
        cancel_requested: true,
        status: "canceled",
        finished_at: now,
        updated_at: now,
        schedule_cron: null,
        next_run_at: null,
      });
      detachOrchestrationRunAbortController(runId);
      return c.json({ data: { run_id: runId, status: "canceled" } }, 200);
    }

    if (run.status !== "paused_timeout" && run.status !== "awaiting_user" && run.status !== "lease_expired") {
      return c.json({ error: { code: "run_not_pausable", message: "Run is not paused for timeout recovery" } }, 409);
    }

    void retryOrchestrationStepAsync({
      runId,
      stepIndex: run.current_step,
      actorId: auth.userId,
    })
      .catch(() => {})
      .finally(() => {
        void maybeDetachOrchestrationAbortOnTerminalAsync(runId);
      });

    return c.json({ data: { run_id: runId, step_index: run.current_step, status: "resume_queued" } }, 202);
  });
}
