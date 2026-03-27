/**
 * T-5.4 Agent 接入 API：Provider 注册、健康检查、测试调用、提交审核
 * 需认证，仅 Provider 角色可调用
 */
import { randomUUID } from "node:crypto";
import type { Context } from "hono";
import { z } from "zod";
import { createAuthMeMiddleware, requireAuth } from "../auth/auth.routes";
import {
  createAgentEndpointAsync,
  deleteAgentEndpointAsync,
  listAgentEndpointsAsync,
} from "./agent-endpoint.store";
import {
  getAgentByIdAsync,
  getAgentOwnerIdAsync,
  listAgentsByOwnerAsync,
  registerAgentByProviderAsync,
  setAgentListingStatusByOwnerAsync,
  setAgentStatusAsync,
  updateAgentGatewayListingAsync,
  updateAgentHealthCheckAsync,
  updateAgentVersionByOwnerAsync,
  type RegisterAgentByProviderInput,
} from "./agent.store";
import {
  AgentDelistedGatewayError,
  AgentMaintenanceGatewayError,
  checkAgentHealth,
  requestAgent,
} from "../gateway/a2a.gateway";
import { sessionInvocationContext } from "../gateway/invocation-context";

const registerSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  agent_type: z.enum(["logical", "execution"]),
  source_url: z.string().url(),
  capabilities: z.array(
    z.object({
      name: z.string().min(1),
      risk_level: z.enum(["low", "medium", "high", "critical"]),
    }),
  ),
});

const testCallSchema = z.object({
  message: z.string().min(1).max(2000).optional(),
}).optional();

const gatewayListingPatchSchema = z.object({
  max_concurrent: z.number().int().min(1).max(1000).optional(),
  queue_behavior: z.enum(["queue", "fast_fail"]).optional(),
  timeout_ms: z.number().int().min(1000).max(3600000).nullable().optional(),
  supports_scheduled: z.boolean().optional(),
  memory_tier: z.enum(["none", "session", "user_isolated"]).optional(),
});

const addEndpointSchema = z.object({
  endpoint_url: z.string().url(),
});

const agentVersionPatchSchema = z.object({
  version: z.string().min(1).max(64),
  summary: z.string().min(1).max(4000),
  breaking: z.boolean().optional().default(false),
});

const agentListingStatusPatchSchema = z.object({
  listing_status: z.enum(["listed", "maintenance", "delisted"]),
});

function requireProvider(c: Context): { userId: string; email: string } | Response {
  const auth = requireAuth(c);
  if (!auth) {
    return c.json({ error: { code: "unauthorized", message: "Authorization required" } }, 401);
  }
  if (auth.role !== "provider") {
    return c.json(
      { error: { code: "forbidden", message: "Provider role required" } },
      403,
    );
  }
  return { userId: auth.userId, email: auth.email };
}

export function registerAgentProviderRoutes(app: import("hono").Hono): void {
  const authMe = createAuthMeMiddleware();

  app.post("/api/v1/agents/register", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const parsed = registerSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const input: RegisterAgentByProviderInput = parsed.data;
    const agent = await registerAgentByProviderAsync(provider.userId, input);
    return c.json({ data: agent }, 201);
  });

  app.get("/api/v1/agents/mine", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agents = await listAgentsByOwnerAsync(provider.userId);
    return c.json({ data: agents });
  });

  app.post("/api/v1/agents/:id/health-check", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const result = await checkAgentHealth(agent.source_url);
    await updateAgentHealthCheckAsync(agentId, result.ok ? "ok" : "failed", result.error);
    return c.json({
      data: {
        status: result.ok ? "ok" : "failed",
        error: result.error,
      },
    });
  });

  app.get("/api/v1/agents/:id/health-check/result", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json({
      data: {
        status: agent.health_check_status ?? null,
        checked_at: agent.health_check_at ?? null,
        error: agent.health_check_error ?? null,
      },
    });
  });

  app.post("/api/v1/agents/:id/test-call", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const body = await c.req.json().catch(() => ({}));
    const parsed = testCallSchema.safeParse(body);
    const message = parsed.success && parsed.data?.message
      ? parsed.data.message
      : "Hello, this is a test call from GaiaLynk.";
    const conversationId = `test-${agentId}-${Date.now()}`;
    const testRunId = randomUUID();
    const testTraceId = randomUUID();
    try {
      const response = await requestAgent({
        agent,
        userText: message,
        context: sessionInvocationContext({
          gaiaUserId: provider.userId,
          conversationId,
          runId: testRunId,
          traceId: testTraceId,
        }),
      });
      return c.json({ data: { output_text: response.text } });
    } catch (err) {
      if (err instanceof AgentDelistedGatewayError) {
        return c.json(
          {
            error: {
              code: err.code,
              message: err.user_facing_message.zh,
              details: { user_facing_message: err.user_facing_message },
            },
          },
          403,
        );
      }
      if (err instanceof AgentMaintenanceGatewayError) {
        return c.json(
          {
            error: {
              code: err.code,
              message: err.user_facing_message.zh,
              details: { user_facing_message: err.user_facing_message },
            },
          },
          503,
        );
      }
      const errorMessage = err instanceof Error ? err.message : String(err);
      return c.json(
        { error: { code: "test_call_failed", message: errorMessage } },
        502,
      );
    }
  });

  app.patch("/api/v1/agents/:id/gateway-listing", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const parsed = gatewayListingPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const body = parsed.data;
    const snapshot = {
      max_concurrent: body.max_concurrent ?? agent.max_concurrent ?? 1,
      queue_behavior: body.queue_behavior ?? agent.queue_behavior ?? "queue",
      timeout_ms:
        body.timeout_ms !== undefined ? body.timeout_ms : (agent.timeout_ms ?? null),
      supports_scheduled: body.supports_scheduled ?? agent.supports_scheduled ?? false,
      memory_tier: body.memory_tier ?? agent.memory_tier ?? "none",
    };
    const updated = await updateAgentGatewayListingAsync(agentId, provider.userId, snapshot);
    if (!updated) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json({ data: updated });
  });

  app.get("/api/v1/agents/:id/endpoints", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const endpoints = await listAgentEndpointsAsync(agentId);
    return c.json({ data: { primary_source_url: agent.source_url, endpoints } });
  });

  app.post("/api/v1/agents/:id/endpoints", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const parsed = addEndpointSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    try {
      const row = await createAgentEndpointAsync(agentId, parsed.data.endpoint_url);
      return c.json({ data: row }, 201);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "endpoint_url_exists") {
        return c.json({ error: { code: "duplicate_endpoint", message: "Endpoint URL already registered" } }, 409);
      }
      const pe = e as { code?: string };
      if (pe?.code === "23505") {
        return c.json({ error: { code: "duplicate_endpoint", message: "Endpoint URL already registered" } }, 409);
      }
      throw e;
    }
  });

  app.delete("/api/v1/agents/:id/endpoints/:endpointId", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const endpointId = c.req.param("endpointId") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const ok = await deleteAgentEndpointAsync(agentId, endpointId);
    if (!ok) {
      return c.json({ error: { code: "endpoint_not_found", message: "Endpoint not found" } }, 404);
    }
    return c.json({ data: { deleted: true } });
  });

  app.post("/api/v1/agents/:id/submit-review", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const agent = await getAgentByIdAsync(agentId);
    if (!agent) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const updated = await setAgentStatusAsync(agentId, "active");
    if (!updated) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    const updatedAgent = await getAgentByIdAsync(agentId);
    return c.json({ data: updatedAgent });
  });

  app.patch("/api/v1/agents/:id/version", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const parsed = agentVersionPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const updated = await updateAgentVersionByOwnerAsync(provider.userId, agentId, parsed.data);
    if (!updated) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json({ data: updated });
  });

  app.patch("/api/v1/agents/:id/listing-status", authMe, async (c) => {
    const provider = requireProvider(c);
    if (provider instanceof Response) return provider;
    const agentId = c.req.param("id") ?? "";
    const ownerId = await getAgentOwnerIdAsync(agentId);
    if (ownerId !== provider.userId) {
      return c.json({ error: { code: "forbidden", message: "Not the owner of this agent" } }, 403);
    }
    const parsed = agentListingStatusPatchSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const updated = await setAgentListingStatusByOwnerAsync(
      provider.userId,
      agentId,
      parsed.data.listing_status,
    );
    if (!updated) {
      return c.json({ error: { code: "agent_not_found", message: "Agent not found" } }, 404);
    }
    return c.json({ data: updated });
  });
}
