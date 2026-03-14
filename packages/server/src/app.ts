import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import {
  addParticipant,
  appendMessage,
  createConversation,
  getConversationDetail,
  listConversations,
  resetConversationStore,
} from "./modules/conversation/conversation.store";
import {
  getAgentById,
  listAgents,
  registerAgent,
  resetAgentStore,
} from "./modules/directory/agent.store";
import { requestAgent } from "./modules/gateway/a2a.gateway";
import {
  createPendingInvocation,
  getInvocationById,
  markInvocationCompleted,
  resetInvocationStore,
} from "./modules/gateway/invocation.store";
import {
  emitAuditEvent,
  listAuditEvents,
  resetAuditStore,
} from "./modules/audit/audit.store";
import {
  getReceiptById,
  issueReceipt,
  resetReceiptStore,
  verifyReceipt,
} from "./modules/audit/receipt.store";
import { getPhase0Metrics } from "./modules/metrics/metrics.service";
import {
  heartbeatNode,
  listNodes,
  registerNode,
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
});

const joinAgentSchema = z.object({
  agent_id: z.string().min(1),
});

const sendMessageSchema = z.object({
  sender_id: z.string().min(1),
  text: z.string().min(1),
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

  app.post("/api/v1/conversations", async (c) => {
    const payload = createConversationSchema.parse(await c.req.json());
    const conversation = createConversation(payload.title);

    return c.json({ data: conversation }, 201);
  });

  app.get("/api/v1/conversations", () => {
    return new Response(JSON.stringify({ data: listConversations() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/conversations/:id", (c) => {
    const conversationId = c.req.param("id");
    const detail = getConversationDetail(conversationId);

    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    return c.json({ data: detail }, 200);
  });

  app.post("/api/v1/agents", async (c) => {
    const payload = registerAgentSchema.parse(await c.req.json());
    const agent = registerAgent(payload);

    return c.json({ data: agent }, 201);
  });

  app.get("/api/v1/agents", () => {
    return new Response(JSON.stringify({ data: listAgents() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/agents/:id", (c) => {
    const agentId = c.req.param("id");
    const agent = getAgentById(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    return c.json({ data: agent }, 200);
  });

  app.post("/api/v1/conversations/:id/agents", async (c) => {
    const conversationId = c.req.param("id");
    const payload = joinAgentSchema.parse(await c.req.json());
    const agent = getAgentById(payload.agent_id);

    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const addedParticipant = addParticipant({
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

    const userMessage = appendMessage({
      conversationId,
      senderType: "user",
      senderId: payload.sender_id,
      text: payload.text,
    });

    if (!userMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const detail = getConversationDetail(conversationId);
    if (!detail) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const firstAgent = detail.participants.find((participant) => participant.participant_type === "agent");

    if (!firstAgent) {
      return c.json({ data: userMessage }, 201);
    }

    const agent = getAgentById(firstAgent.participant_id);

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

    const decisionEventType =
      trustDecision.decision === "allow"
        ? "invocation.allowed"
        : trustDecision.decision === "deny"
          ? "invocation.denied"
          : "invocation.need_confirmation";

    emitAuditEvent({
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
      const pendingInvocation = createPendingInvocation({
        conversationId,
        agentId: agent.id,
        requesterId: payload.sender_id,
        userText: payload.text,
      });

      emitAuditEvent({
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

    const a2aResponse = await requestAgent({
      conversationId,
      agent,
      userText: payload.text,
    });

    const agentMessage = appendMessage({
      conversationId,
      senderType: "agent",
      senderId: agent.id,
      text: a2aResponse.text,
    });

    if (!agentMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    const completedEvent = emitAuditEvent({
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

    const receipt = issueReceipt({
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

    const invocation = getInvocationById(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    if (invocation.status !== "pending_confirmation") {
      return c.json({ error: { code: "invocation_not_confirmable", message: "Invocation already processed" } }, 409);
    }

    const agent = getAgentById(invocation.agent_id);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }

    const correlationId = randomUUID();

    emitAuditEvent({
      eventType: "invocation.confirmed",
      conversationId: invocation.conversation_id,
      agentId: agent.id,
      actorType: "user",
      actorId: payload.approver_id,
      payload: { invocation_id: invocation.id },
      correlationId,
    });

    const a2aResponse = await requestAgent({
      conversationId: invocation.conversation_id,
      agent,
      userText: invocation.user_text,
    });

    const agentMessage = appendMessage({
      conversationId: invocation.conversation_id,
      senderType: "agent",
      senderId: agent.id,
      text: a2aResponse.text,
    });

    if (!agentMessage) {
      return c.json({ error: { code: "conversation_not_found", message: "Conversation not found" } }, 404);
    }

    markInvocationCompleted(invocation.id);

    const completedEvent = emitAuditEvent({
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

    const receipt = issueReceipt({
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
          invocation_id: invocation.id,
          status: "completed",
        },
        meta: {
          receipt_id: receipt.id,
        },
      },
      200,
    );
  });

  app.get("/api/v1/invocations/:id", (c) => {
    const invocationId = c.req.param("id");
    const invocation = getInvocationById(invocationId);
    if (!invocation) {
      return c.json({ error: { code: "invocation_not_found", message: "Invocation not found" } }, 404);
    }

    return c.json({ data: invocation }, 200);
  });

  app.get("/api/v1/audit-events", (c) => {
    const eventType = c.req.query("event_type");
    const conversationId = c.req.query("conversation_id");
    const cursor = c.req.query("cursor");
    const limit = c.req.query("limit");

    const parsedLimit = limit ? Number(limit) : undefined;
    const result = listAuditEvents({
      eventType,
      conversationId,
      cursor,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    });

    return new Response(JSON.stringify({ data: result.data, meta: { next_cursor: result.nextCursor } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/receipts/:id", (c) => {
    const receiptId = c.req.param("id");
    const receipt = getReceiptById(receiptId);

    if (!receipt) {
      return c.json({ error: { code: "receipt_not_found", message: "Receipt not found" } }, 404);
    }

    return c.json(
      {
        data: receipt,
        meta: {
          is_valid: verifyReceipt(receipt),
        },
      },
      200,
    );
  });

  app.post("/api/v1/nodes/register", async (c) => {
    const payload = registerNodeSchema.parse(await c.req.json());
    const node = registerNode(payload);
    return c.json({ data: node }, 201);
  });

  app.post("/api/v1/nodes/heartbeat", async (c) => {
    const payload = heartbeatNodeSchema.parse(await c.req.json());
    const node = heartbeatNode(payload.node_id);
    if (!node) {
      return c.json({ error: { code: "node_not_found", message: "Node not found" } }, 404);
    }

    return c.json({ data: node }, 200);
  });

  app.get("/api/v1/nodes", () => {
    return new Response(JSON.stringify({ data: listNodes() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  app.get("/api/v1/metrics", () => {
    return new Response(JSON.stringify({ data: getPhase0Metrics() }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  });

  return app;
};
