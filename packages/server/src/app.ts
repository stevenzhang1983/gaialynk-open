import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import {
  addParticipantAsync,
  appendMessageAsync,
  createConversationAsync,
  getConversationDetailAsync,
  listConversations,
  type Message,
  resetConversationStore,
} from "./modules/conversation/conversation.store";
import type { Agent } from "./modules/directory/agent.store";
import {
  getAgentByIdAsync,
  listAgentsAsync,
  registerAgentAsync,
  resetAgentStore,
  upsertAgentFromNodeAsync,
} from "./modules/directory/agent.store";
import { requestAgent } from "./modules/gateway/a2a.gateway";
import {
  claimInvocationForProcessingAsync,
  createPendingInvocationAsync,
  getInvocationByIdAsync,
  listInvocationsAsync,
  markInvocationCompletedAsync,
  rollbackInvocationProcessingAsync,
  resetInvocationStore,
} from "./modules/gateway/invocation.store";
import {
  emitAuditEventAsync,
  listAuditEventsAsync,
  resetAuditStore,
} from "./modules/audit/audit.store";
import {
  getReceiptByIdAsync,
  issueReceiptAsync,
  resetReceiptStore,
  verifyReceiptAsync,
} from "./modules/audit/receipt.store";
import { getPhase0Metrics } from "./modules/metrics/metrics.service";
import {
  heartbeatNodeAsync,
  getNodeByNodeIdAsync,
  listNodesAsync,
  registerNodeAsync,
  resetNodeStore,
} from "./modules/node-hub/node.store";
import { evaluateTrustDecision } from "./modules/trust/trust.engine";

const createConversationSchema = z.object({
  title: z.string().min(1).max(255),
});

const registerAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  agent_type: z.enum(["logical", "execution"]),
  source_url: z.url(),
  capabilities: z.array(
    z.object({
      name: z.string().min(1),
      risk_level: z.enum(["low", "medium", "high", "critical"]),
    }),
  ),
  source_origin: z.enum(["official", "self_hosted", "connected_node", "vendor"]).optional(),
  node_id: z.string().uuid().optional(),
  status: z.enum(["active", "deprecated", "pending_review"]).optional(),
});

const joinAgentSchema = z.object({
  agent_id: z.string().min(1),
});

const sendMessageSchema = z.object({
  sender_id: z.string().min(1),
  text: z.string().min(1),
  thread_id: z.string().min(1).max(128).optional(),
  mentions: z.array(z.string().min(1)).max(20).optional(),
  target_agent_ids: z.array(z.string().min(1)).optional(),
});

const confirmInvocationSchema = z.object({
  approver_id: z.string().min(1),
});

const registerNodeSchema = z.object({
  name: z.string().min(1).max(255),
  endpoint: z.url(),
  capabilities: z.record(z.string(), z.unknown()).optional(),
});

const heartbeatNodeSchema = z.object({
  node_id: z.string().min(1),
});

const relayInvokeSchema = z.object({
  node_id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  sender_id: z.string().min(1),
  text: z.string().min(1),
  thread_id: z.string().min(1).max(128).optional(),
  mentions: z.array(z.string().min(1)).max(20).optional(),
  retry_max: z.number().int().min(0).max(3).optional(),
  stale_after_sec: z.number().int().min(1).max(86400).optional(),
});

const recommendationQuerySchema = z.object({
  intent: z.string().min(1),
  risk_max: z.enum(["low", "medium", "high", "critical"]).optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});

const nodesHealthQuerySchema = z.object({
  stale_after_sec: z.coerce.number().int().min(1).max(86400).optional(),
});

const usageCountersQuerySchema = z.object({
  actor_id: z.string().min(1).optional(),
  window_days: z.coerce.number().int().min(1).max(365).optional(),
});

const auditEventsQuerySchema = z.object({
  event_type: z.string().min(1).optional(),
  conversation_id: z.string().uuid().optional(),
  agent_id: z.string().uuid().optional(),
  actor_type: z.enum(["user", "agent", "system"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

const publicEntryEventSchema = z.object({
  event_name: z.enum([
    "page_view",
    "cta_click",
    "docs_click",
    "demo_click",
    "waitlist_submit",
    "demo_submit",
    "lang_switch",
  ]),
  locale: z.enum(["en", "zh-Hant", "zh-Hans"]),
  page: z.string().min(1).max(128),
  referrer: z.string().min(1).max(512).optional(),
  timestamp: z.string().min(1).max(64).optional(),
  cta_id: z.string().min(1).max(128).optional(),
  source: z.string().max(256).optional(),
  device_type: z.enum(["mobile", "desktop"]).optional(),
});

const toDecisionEventType = (
  decision: "allow" | "allow_limited" | "deny" | "need_confirmation",
): string => {
  if (decision === "allow") {
    return "invocation.allowed";
  }
  if (decision === "deny") {
    return "invocation.denied";
  }
  return "invocation.need_confirmation";
};

const riskRank = (risk: "low" | "medium" | "high" | "critical"): number => {
  if (risk === "low") return 0;
  if (risk === "medium") return 1;
  if (risk === "high") return 2;
  return 3;
};

const syncNodeDirectorySchema = z.object({
  node_id: z.string().uuid(),
  agents: z.array(
    z.object({
      name: z.string().min(1).max(255),
      description: z.string().min(1),
      agent_type: z.enum(["logical", "execution"]),
      source_url: z.url(),
      capabilities: z.array(
        z.object({
          name: z.string().min(1),
          risk_level: z.enum(["low", "medium", "high", "critical"]),
        }),
      ),
      status: z.enum(["active", "deprecated", "pending_review"]).optional(),
    }),
  ),
});

const resetAllStores = (): void => {
  resetConversationStore();
  resetAgentStore();
  resetInvocationStore();
  resetAuditStore();
  resetReceiptStore();
  resetNodeStore();
};

export const createApp = (): Hono => {
  resetAllStores();
  const app = new Hono();

  app.onError((error, c) => {
    if (error instanceof z.ZodError) {
      return c.json(
        {
          error: {
            code: "validation_error",
            message: "Invalid request payload",
            details: {
              issues: error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
          },
        },
        400,
      );
    }

    return c.json(
      {
        error: {
          code: "internal_error",
          message: "Internal server error",
        },
      },
      500,
    );
  });

  app.post("/api/v1/conversations", async (c) => {
    const payload = createConversationSchema.parse(await c.req.json());
    const conversation = await createConversationAsync(payload.title);

    return c.json({ data: conversation }, 201);
  });

  app.get("/api/v1/conversations", async () => {
    return new Response(JSON.stringify({ data: await listConversations() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/conversations/:id", async (c) => {
    const conversationId = c.req.param("id");
    const detail = await getConversationDetailAsync(conversationId);

    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: detail }, 200);
  });

  app.get("/api/v1/conversations/:id/presence", async (c) => {
    const conversationId = c.req.param("id");
    const detail = await getConversationDetailAsync(conversationId);
    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const items = [];
    for (const participant of detail.participants) {
      if (participant.participant_type === "user") {
        items.push({
          participant_id: participant.participant_id,
          participant_type: "user",
          status: "online",
          last_seen_at: participant.joined_at,
        });
        continue;
      }

      const agent = await getAgentByIdAsync(participant.participant_id);
      if (!agent) {
        items.push({
          participant_id: participant.participant_id,
          participant_type: "agent",
          status: "offline",
          last_seen_at: participant.joined_at,
        });
        continue;
      }

      if (agent.source_origin === "connected_node" && agent.node_id) {
        const node = await getNodeByNodeIdAsync(agent.node_id);
        items.push({
          participant_id: participant.participant_id,
          participant_type: "agent",
          status: node?.status ?? "offline",
          source_origin: agent.source_origin,
          node_id: agent.node_id,
          last_seen_at: node?.last_heartbeat ?? participant.joined_at,
        });
        continue;
      }

      items.push({
        participant_id: participant.participant_id,
        participant_type: "agent",
        status: "online",
        source_origin: agent.source_origin ?? "official",
        last_seen_at: participant.joined_at,
      });
    }

    return c.json({ data: { conversation_id: conversationId, participants: items } }, 200);
  });

  app.post("/api/v1/agents", async (c) => {
    const payload = registerAgentSchema.parse(await c.req.json());
    const agent = await registerAgentAsync(payload);

    return c.json({ data: agent }, 201);
  });

  app.get("/api/v1/agents", async () => {
    return new Response(JSON.stringify({ data: await listAgentsAsync() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/agents/recommendations", async (c) => {
    const parsed = recommendationQuerySchema.safeParse({
      intent: c.req.query("intent"),
      risk_max: c.req.query("risk_max"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_recommendation_query",
            message: "Invalid recommendation query",
          },
        },
        400,
      );
    }

    const { intent, risk_max: riskMax, limit } = parsed.data;
    const intentLower = intent.toLowerCase();
    const maxRank = riskMax ? riskRank(riskMax) : Number.POSITIVE_INFINITY;

    const agents = await listAgentsAsync();
    const scored = agents
      .map((agent) => {
        if (agent.capabilities.length === 0) {
          return null;
        }

        const matchedCapabilities = agent.capabilities.filter((capability) =>
          capability.name.toLowerCase().includes(intentLower),
        );
        const riskCandidates = matchedCapabilities.length > 0 ? matchedCapabilities : agent.capabilities;
        const bestRiskRank = Math.min(...riskCandidates.map((capability) => riskRank(capability.risk_level)));
        if (bestRiskRank > maxRank) {
          return null;
        }

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

        return {
          agent,
          score,
          reason: score > 0 ? "semantic_match" : "fallback_risk_filtered",
        };
      })
      .filter((item): item is { agent: Agent; score: number; reason: string } => Boolean(item))
      .sort((a, b) => b.score - a.score || b.agent.created_at.localeCompare(a.agent.created_at))
      .slice(0, limit ?? 5)
      .map((item) => ({
        agent: item.agent,
        score: item.score,
        reason: item.reason,
      }));

    return c.json({ data: scored }, 200);
  });

  app.get("/api/v1/agents/:id", async (c) => {
    const agentId = c.req.param("id");
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json({ data: agent }, 200);
  });

  app.post("/api/v1/conversations/:id/agents", async (c) => {
    const conversationId = c.req.param("id");
    const payload = joinAgentSchema.parse(await c.req.json());
    const agent = await getAgentByIdAsync(payload.agent_id);

    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const addedParticipant = await addParticipantAsync({
      conversationId,
      participantType: "agent",
      participantId: payload.agent_id,
      role: "member",
    });

    if (!addedParticipant) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: addedParticipant }, 201);
  });

  app.post("/api/v1/conversations/:id/messages", async (c) => {
    const conversationId = c.req.param("id");
    const payload = sendMessageSchema.parse(await c.req.json());
    const correlationId = randomUUID();

    const userMessage = await appendMessageAsync({
      conversationId,
      senderType: "user",
      senderId: payload.sender_id,
      text: payload.text,
      threadId: payload.thread_id,
      mentions: payload.mentions,
    });

    if (!userMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const detail = await getConversationDetailAsync(conversationId);
    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const joinedAgentIds = detail.participants
      .filter((participant) => participant.participant_type === "agent")
      .map((participant) => participant.participant_id);
    const firstAgentId = joinedAgentIds[0];

    if (!firstAgentId) {
      return c.json({ data: userMessage }, 201);
    }

    if (payload.target_agent_ids && payload.target_agent_ids.length > 0) {
      const targetIds = [...new Set(payload.target_agent_ids)];
      const invalidAgentId = targetIds.find((agentId) => !joinedAgentIds.includes(agentId));
      if (invalidAgentId) {
        return c.json(
          {
            error: {
              code: "agent_not_in_conversation",
              message: "Target agent is not part of this conversation",
              details: { agent_id: invalidAgentId },
            },
          },
          400,
        );
      }

      const pendingInvocations: Array<{ agent_id: string; invocation_id: string }> = [];
      const completedReceipts: Array<{ agent_id: string; receipt_id: string }> = [];
      const deniedAgents: Array<{ agent_id: string; reason_codes: string[] }> = [];
      const failedAgents: Array<{ agent_id: string; reason: string }> = [];

      for (const targetAgentId of targetIds) {
        const perAgentCorrelationId = randomUUID();
        const agent = await getAgentByIdAsync(targetAgentId);
        if (!agent) {
          return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
        }

        const trustDecision = evaluateTrustDecision({
          agent,
          capability: agent.capabilities[0],
          context: {
            conversationId,
            actorId: payload.sender_id,
          },
        });

        const decisionEventType = toDecisionEventType(trustDecision.decision);

        await emitAuditEventAsync({
          eventType: decisionEventType,
          conversationId,
          agentId: agent.id,
          actorType: "user",
          actorId: payload.sender_id,
          payload: {
            message_id: userMessage.id,
            text: payload.text,
          },
          trustDecision,
          correlationId: perAgentCorrelationId,
        });

        if (trustDecision.decision === "need_confirmation") {
          const pendingInvocation = await createPendingInvocationAsync({
            conversationId,
            agentId: agent.id,
            requesterId: payload.sender_id,
            userText: payload.text,
          });
          await emitAuditEventAsync({
            eventType: "invocation.pending_confirmation",
            conversationId,
            agentId: agent.id,
            actorType: "user",
            actorId: payload.sender_id,
            payload: {
              invocation_id: pendingInvocation.id,
              reason_codes: trustDecision.reason_codes,
            },
            trustDecision,
            correlationId: perAgentCorrelationId,
          });
          pendingInvocations.push({ agent_id: agent.id, invocation_id: pendingInvocation.id });
          continue;
        }

        if (trustDecision.decision === "deny") {
          deniedAgents.push({ agent_id: agent.id, reason_codes: trustDecision.reason_codes });
          continue;
        }

        let agentMessage: Message | null = null;
        try {
          const a2aResponse = await requestAgent({
            conversationId,
            agent,
            userText: payload.text,
          });
          agentMessage = await appendMessageAsync({
            conversationId,
            senderType: "agent",
            senderId: agent.id,
            text: a2aResponse.text,
          });
        } catch (error) {
          const reason = error instanceof Error ? error.message : "unknown_error";
          await emitAuditEventAsync({
            eventType: "invocation.failed",
            conversationId,
            agentId: agent.id,
            actorType: "system",
            actorId: "system",
            payload: { reason },
            trustDecision,
            correlationId: perAgentCorrelationId,
          });
          failedAgents.push({ agent_id: agent.id, reason });
          continue;
        }

        if (!agentMessage) {
          continue;
        }

        const completedEvent = await emitAuditEventAsync({
          eventType: "invocation.completed",
          conversationId,
          agentId: agent.id,
          actorType: "agent",
          actorId: agent.id,
          payload: {
            message_id: agentMessage.id,
          },
          trustDecision,
          correlationId: perAgentCorrelationId,
        });

        const receipt = await issueReceiptAsync({
          auditEventId: completedEvent.id,
          conversationId,
          receiptType: "invocation_completed",
          payload: {
            conversation_id: conversationId,
            user_message_id: userMessage.id,
            agent_message_id: agentMessage.id,
            agent_id: agent.id,
          },
        });
        completedReceipts.push({ agent_id: agent.id, receipt_id: receipt.id });
      }

      if (pendingInvocations.length > 0) {
        return c.json(
          {
            data: userMessage,
            meta: {
              pending_invocations: pendingInvocations,
              completed_receipts: completedReceipts,
              denied_agents: deniedAgents,
              failed_agents: failedAgents,
            },
          },
          202,
        );
      }

      if (completedReceipts.length > 0) {
        return c.json(
          {
            data: userMessage,
            meta: {
              completed_receipts: completedReceipts,
              denied_agents: deniedAgents,
              failed_agents: failedAgents,
            },
          },
          201,
        );
      }

      if (failedAgents.length > 0 && deniedAgents.length === 0) {
        return c.json(
          {
            error: {
              code: "a2a_invocation_failed",
              message: "A2A invocation failed",
              details: { failed_agents: failedAgents },
            },
          },
          502,
        );
      }

      return c.json(
        {
          error: {
            code: "invocation_denied",
            message: "Invocation denied by trust policy",
            details: { denied_agents: deniedAgents, failed_agents: failedAgents },
          },
        },
        403,
      );
    }

    const agent = await getAgentByIdAsync(firstAgentId);

    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const trustDecision = evaluateTrustDecision({
      agent,
      capability: agent.capabilities[0],
      context: {
        conversationId,
        actorId: payload.sender_id,
      },
    });

    const decisionEventType = toDecisionEventType(trustDecision.decision);

    await emitAuditEventAsync({
      eventType: decisionEventType,
      conversationId,
      agentId: agent.id,
      actorType: "user",
      actorId: payload.sender_id,
      payload: {
        message_id: userMessage.id,
        text: payload.text,
      },
      trustDecision,
      correlationId,
    });

    if (trustDecision.decision === "need_confirmation") {
      const pendingInvocation = await createPendingInvocationAsync({
        conversationId,
        agentId: agent.id,
        requesterId: payload.sender_id,
        userText: payload.text,
      });

      await emitAuditEventAsync({
        eventType: "invocation.pending_confirmation",
        conversationId,
        agentId: agent.id,
        actorType: "user",
        actorId: payload.sender_id,
        payload: {
          invocation_id: pendingInvocation.id,
          reason_codes: trustDecision.reason_codes,
        },
        trustDecision,
        correlationId,
      });

      return c.json(
        {
          data: userMessage,
          meta: {
            trust_decision: trustDecision,
            invocation_id: pendingInvocation.id,
          },
        },
        202,
      );
    }

    if (trustDecision.decision === "deny") {
      return c.json(
        {
          error: {
            code: "invocation_denied",
            message: "Invocation denied by trust policy",
            details: { trust_decision: trustDecision },
          },
        },
        403,
      );
    }

    let agentMessage: Message | null = null;
    try {
      const a2aResponse = await requestAgent({
        conversationId,
        agent,
        userText: payload.text,
      });

      agentMessage = await appendMessageAsync({
        conversationId,
        senderType: "agent",
        senderId: agent.id,
        text: a2aResponse.text,
      });
    } catch (error) {
      await emitAuditEventAsync({
        eventType: "invocation.failed",
        conversationId,
        agentId: agent.id,
        actorType: "system",
        actorId: "system",
        payload: { reason: error instanceof Error ? error.message : "unknown_error" },
        trustDecision,
        correlationId,
      });

      return c.json(
        {
          error: {
            code: "a2a_invocation_failed",
            message: "A2A invocation failed",
          },
        },
        502,
      );
    }

    if (!agentMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const completedEvent = await emitAuditEventAsync({
      eventType: "invocation.completed",
      conversationId,
      agentId: agent.id,
      actorType: "agent",
      actorId: agent.id,
      payload: {
        message_id: agentMessage.id,
      },
      trustDecision,
      correlationId,
    });

    const receipt = await issueReceiptAsync({
      auditEventId: completedEvent.id,
      conversationId,
      receiptType: "invocation_completed",
      payload: {
        conversation_id: conversationId,
        user_message_id: userMessage.id,
        agent_message_id: agentMessage.id,
      },
    });

    return c.json(
      {
        data: userMessage,
        meta: {
          trust_decision: trustDecision,
          receipt_id: receipt.id,
        },
      },
      201,
    );
  });

  app.post("/api/v1/invocations/:id/confirm", async (c) => {
    const invocationId = c.req.param("id");
    const payload = confirmInvocationSchema.parse(await c.req.json());

    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    if (invocation.status !== "pending_confirmation") {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const claimedInvocation = await claimInvocationForProcessingAsync(invocationId);
    if (!claimedInvocation) {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const agent = await getAgentByIdAsync(invocation.agent_id);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const correlationId = randomUUID();

    await emitAuditEventAsync({
      eventType: "invocation.confirmed",
      conversationId: invocation.conversation_id,
      agentId: agent.id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: { invocation_id: invocation.id },
      correlationId,
    });

    let agentMessage: Message | null = null;
    try {
      const a2aResponse = await requestAgent({
        conversationId: invocation.conversation_id,
        agent,
        userText: invocation.user_text,
      });

      agentMessage = await appendMessageAsync({
        conversationId: invocation.conversation_id,
        senderType: "agent",
        senderId: agent.id,
        text: a2aResponse.text,
      });
    } catch (error) {
      await emitAuditEventAsync({
        eventType: "invocation.failed",
        conversationId: claimedInvocation.conversation_id,
        agentId: agent.id,
        actorType: "system",
        actorId: "system",
        payload: { reason: error instanceof Error ? error.message : "unknown_error" },
        correlationId,
      });
      await rollbackInvocationProcessingAsync(claimedInvocation.id);

      return c.json(
        {
          error: {
            code: "a2a_invocation_failed",
            message: "A2A invocation failed",
          },
        },
        502,
      );
    }

    if (!agentMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const completedInvocation = await markInvocationCompletedAsync(claimedInvocation.id);
    if (!completedInvocation) {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const completedEvent = await emitAuditEventAsync({
      eventType: "invocation.completed",
      conversationId: invocation.conversation_id,
      agentId: agent.id,
      actorType: "agent",
      actorId: agent.id,
      payload: {
        invocation_id: invocation.id,
        message_id: agentMessage.id,
      },
      correlationId,
    });

    const receipt = await issueReceiptAsync({
      auditEventId: completedEvent.id,
      conversationId: invocation.conversation_id,
      receiptType: "invocation_completed",
      payload: {
        invocation_id: invocation.id,
        message_id: agentMessage.id,
      },
    });

    return c.json(
      {
        data: {
          invocation_id: completedInvocation.id,
          status: "completed",
        },
        meta: {
          receipt_id: receipt.id,
        },
      },
      200,
    );
  });

  app.get("/api/v1/invocations", async (c) => {
    const statusRaw = c.req.query("status");
    const conversationId = c.req.query("conversation_id");
    if (
      statusRaw &&
      statusRaw !== "pending_confirmation" &&
      statusRaw !== "completed"
    ) {
      return c.json(
        {
          error: {
            code: "invalid_status",
            message: "Invalid status filter",
            details: {
              allowed: ["pending_confirmation", "completed"],
            },
          },
        },
        400,
      );
    }
    const status =
      statusRaw === "pending_confirmation" || statusRaw === "completed" ? statusRaw : undefined;

    const invocations = await listInvocationsAsync({
      status,
      conversationId,
    });
    return c.json({ data: invocations }, 200);
  });

  app.get("/api/v1/invocations/:id", async (c) => {
    const invocationId = c.req.param("id");
    const invocation = await getInvocationByIdAsync(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    return c.json({ data: invocation }, 200);
  });

  app.get("/api/v1/audit-events", async (c) => {
    const parsed = auditEventsQuerySchema.safeParse({
      event_type: c.req.query("event_type"),
      conversation_id: c.req.query("conversation_id"),
      agent_id: c.req.query("agent_id"),
      actor_type: c.req.query("actor_type"),
      from: c.req.query("from"),
      to: c.req.query("to"),
      cursor: c.req.query("cursor"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_audit_events_query",
            message: "Invalid audit events query",
          },
        },
        400,
      );
    }

    const {
      event_type: eventType,
      conversation_id: conversationId,
      agent_id: agentId,
      actor_type: actorType,
      from,
      to,
      cursor,
      limit,
    } = parsed.data;
    const result = await listAuditEventsAsync({
      eventType,
      conversationId,
      agentId,
      actorType,
      from,
      to,
      cursor,
      limit,
    });

    return new Response(JSON.stringify({ data: result.data, meta: { next_cursor: result.nextCursor } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/receipts/:id", async (c) => {
    const receiptId = c.req.param("id");
    const receipt = await getReceiptByIdAsync(receiptId);

    if (!receipt) {
      return c.json({ error: { code: "receipt_not_found", message: "Receipt not found" } }, 404);
    }

    return c.json(
      {
        data: receipt,
        meta: {
          is_valid: await verifyReceiptAsync(receipt),
        },
      },
      200,
    );
  });

  app.post("/api/v1/nodes/register", async (c) => {
    const payload = registerNodeSchema.parse(await c.req.json());
    const node = await registerNodeAsync(payload);
    return c.json({ data: node }, 201);
  });

  app.post("/api/v1/nodes/heartbeat", async (c) => {
    const payload = heartbeatNodeSchema.parse(await c.req.json());
    const node = await heartbeatNodeAsync(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    return c.json({ data: node }, 200);
  });

  app.get("/api/v1/nodes", async () => {
    return new Response(JSON.stringify({ data: await listNodesAsync() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.post("/api/v1/nodes/relay/invoke", async (c) => {
    const payload = relayInvokeSchema.parse(await c.req.json());
    const node = await getNodeByNodeIdAsync(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    const staleAfterSec = payload.stale_after_sec ?? 30;
    const lagMs = Date.now() - Date.parse(node.last_heartbeat);
    if (lagMs > staleAfterSec * 1000) {
      return c.json(
        {
          error: {
            code: "node_unavailable",
            message: "Node is considered offline due to stale heartbeat",
            details: {
              node_id: payload.node_id,
              heartbeat_lag_ms: lagMs,
              stale_after_sec: staleAfterSec,
              retry_after_sec: 3,
            },
          },
        },
        503,
      );
    }

    const agent = await getAgentByIdAsync(payload.agent_id);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    if (agent.node_id !== payload.node_id) {
      return c.json(
        {
          error: {
            code: "agent_node_mismatch",
            message: "Agent does not belong to the specified node",
          },
        },
        400,
      );
    }

    const maxRetry = payload.retry_max ?? 1;
    let lastResponse: Response | null = null;
    for (let attempt = 0; attempt <= maxRetry; attempt += 1) {
      lastResponse = await app.request(`/api/v1/conversations/${payload.conversation_id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_id: payload.sender_id,
          text: payload.text,
          thread_id: payload.thread_id,
          mentions: payload.mentions,
          target_agent_ids: [payload.agent_id],
        }),
      });

      if (lastResponse.status !== 502) {
        break;
      }
    }

    if (!lastResponse) {
      return c.json({ error: { code: "relay_failed", message: "Relay invocation failed" } }, 502);
    }
    const body = await lastResponse.json();
    return c.json(body, lastResponse.status as 200 | 201 | 202 | 400 | 403 | 404 | 409 | 502);
  });

  app.post("/api/v1/nodes/sync-directory", async (c) => {
    const payload = syncNodeDirectorySchema.parse(await c.req.json());
    const node = await getNodeByNodeIdAsync(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    const syncedAgents: Agent[] = [];
    for (const agent of payload.agents) {
      const synced = await upsertAgentFromNodeAsync(payload.node_id, {
        ...agent,
        source_origin: "connected_node",
        node_id: payload.node_id,
      });
      syncedAgents.push(synced);
    }

    return c.json(
      {
        data: {
          node_id: payload.node_id,
          synced_count: syncedAgents.length,
          agents: syncedAgents,
        },
      },
      200,
    );
  });

  app.get("/api/v1/metrics", async () => {
    return new Response(JSON.stringify({ data: await getPhase0Metrics() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/nodes/compatibility", async (c) => {
    return c.json(
      {
        data: {
          node_protocol_min: "1.0.0",
          node_protocol_recommended: "1.1.0",
          supported_node_status: ["online", "degraded", "offline"],
        },
      },
      200,
    );
  });

  app.get("/api/v1/nodes/health", async (c) => {
    const parsed = nodesHealthQuerySchema.safeParse({
      stale_after_sec: c.req.query("stale_after_sec"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_nodes_health_query",
            message: "Invalid nodes health query",
          },
        },
        400,
      );
    }
    const staleAfterSec = parsed.data.stale_after_sec ?? 30;
    const staleAfterMs = staleAfterSec * 1000;
    const now = Date.now();

    const nodes = await listNodesAsync();
    const computed = nodes.map((node) => {
      const heartbeatTs = Date.parse(node.last_heartbeat);
      const lagMs = Number.isFinite(heartbeatTs) ? Math.max(0, now - heartbeatTs) : Number.POSITIVE_INFINITY;
      const healthStatus = lagMs > staleAfterMs ? "offline" : node.status;
      return {
        node_id: node.node_id,
        status: healthStatus,
        heartbeat_lag_ms: lagMs,
        endpoint: node.endpoint,
      };
    });

    const summary = {
      total: computed.length,
      online: computed.filter((node) => node.status === "online").length,
      degraded: computed.filter((node) => node.status === "degraded").length,
      offline: computed.filter((node) => node.status === "offline").length,
    };

    return c.json(
      {
        data: {
          stale_after_sec: staleAfterSec,
          summary,
          nodes: computed,
        },
      },
      200,
    );
  });

  app.get("/api/v1/usage/counters", async (c) => {
    const parsed = usageCountersQuerySchema.safeParse({
      actor_id: c.req.query("actor_id"),
      window_days: c.req.query("window_days"),
    });
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_usage_counters_query",
            message: "Invalid usage counters query",
          },
        },
        400,
      );
    }

    const actorId = parsed.data.actor_id;
    const windowDays = parsed.data.window_days ?? 30;
    const from = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const events = (await listAuditEventsAsync({ from, limit: 5000 })).data;
    const actorEvents = actorId ? events.filter((event) => event.actor_id === actorId) : events;

    const invocationEvents = actorEvents.filter((event) => event.event_type.startsWith("invocation."));
    const eventTypeCounts = actorEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
      return acc;
    }, {});
    return c.json(
      {
        data: {
          actor_id: actorId ?? null,
          window_days: windowDays,
          window_from: from,
          invocation_events_total: invocationEvents.length,
          audit_events_total: actorEvents.length,
          event_type_counts: eventTypeCounts,
        },
      },
      200,
    );
  });

  app.get("/api/v1/public/overview", async (c) => {
    const metrics = await getPhase0Metrics();
    return c.json(
      {
        data: {
          weekly_trusted_invocations: metrics.weekly_trusted_invocations,
          connected_nodes_total: metrics.connected_nodes_total,
          conversations_active_total: metrics.conversations_active_total,
          go_no_go: metrics.go_no_go,
        },
      },
      200,
    );
  });

  app.get("/api/v1/public/entry-metrics", async (c) => {
    const metrics = await getPhase0Metrics();
    const eventRows = (
      await listAuditEventsAsync({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        limit: 5000,
      })
    ).data.filter((event) => event.event_type.startsWith("entry."));

    const totals: Record<string, number> = {};
    const localeBreakdown: Record<string, Record<string, number>> = {
      en: {},
      "zh-Hant": {},
      "zh-Hans": {},
    };
    for (const event of eventRows) {
      const eventName = event.event_type.replace("entry.", "");
      totals[eventName] = (totals[eventName] ?? 0) + 1;
      const locale = (event.payload.locale as string | undefined) ?? "en";
      if (!localeBreakdown[locale]) {
        localeBreakdown[locale] = {};
      }
      localeBreakdown[locale][eventName] = (localeBreakdown[locale][eventName] ?? 0) + 1;
    }

    const startBuildingCtaClicks = eventRows.filter(
      (event) => event.event_type === "entry.cta_click" && event.payload.cta_id === "start_building",
    ).length;
    const pageViewHomeTotal = eventRows.filter(
      (event) =>
        event.event_type === "entry.page_view" &&
        (event.payload.page === "home" ||
          event.payload.page === "/en" ||
          event.payload.page === "/zh-Hant" ||
          event.payload.page === "/zh-Hans"),
    ).length;

    return c.json(
      {
        data: {
          locales_supported: ["en", "zh-Hant", "zh-Hans"],
          weekly_trusted_invocations: metrics.weekly_trusted_invocations,
          first_session_success_rate: metrics.first_session_success_rate,
          connected_nodes_total: metrics.connected_nodes_total,
          conversion_baseline: {
            page_view_home: pageViewHomeTotal,
            cta_click_start_building: startBuildingCtaClicks,
            docs_click: totals.docs_click ?? 0,
            waitlist_submit: totals.waitlist_submit ?? 0,
            demo_submit: totals.demo_submit ?? 0,
          },
          locale_breakdown: localeBreakdown,
        },
      },
      200,
    );
  });

  app.post("/api/v1/public/entry-events", async (c) => {
    const rawBody = await c.req.json().catch(() => null);
    const parsed = publicEntryEventSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "invalid_public_entry_event",
            message: "Invalid public entry event payload",
          },
        },
        400,
      );
    }
    const payload = parsed.data;
    const eventType = `entry.${payload.event_name}`;
    const normalizedPayload = {
      ...payload,
      referrer: payload.referrer ?? "unknown",
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };
    await emitAuditEventAsync({
      eventType,
      actorType: "user",
      actorId: "public-entry",
      payload: normalizedPayload,
      correlationId: randomUUID(),
    });
    return c.json({ data: { accepted: true, event_type: eventType } }, 202);
  });

  app.get("/api/v1/meta", async (c) => {
    return c.json(
      {
        data: {
          api_version: "v1",
          trust_policy_version: "trust-policy-v1",
          node_protocol: {
            min: "1.0.0",
            recommended: "1.1.0",
          },
          quickstart_endpoints: [
            "POST /api/v1/conversations",
            "POST /api/v1/agents",
            "POST /api/v1/conversations/:id/agents",
            "POST /api/v1/conversations/:id/messages",
            "GET /api/v1/metrics",
          ],
          features: [
            "multi_agent_targeting",
            "review_queue",
            "node_directory_sync",
            "receipt_signature_verification",
          ],
        },
      },
      200,
    );
  });

  return app;
};
