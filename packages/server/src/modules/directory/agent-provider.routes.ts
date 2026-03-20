/**
 * T-5.4 Agent 接入 API：Provider 注册、健康检查、测试调用、提交审核
 * 需认证，仅 Provider 角色可调用
 */
import type { Context } from "hono";
import { z } from "zod";
import { createAuthMeMiddleware, requireAuth } from "../auth/auth.routes";
import {
  getAgentByIdAsync,
  getAgentOwnerIdAsync,
  listAgentsByOwnerAsync,
  registerAgentByProviderAsync,
  setAgentStatusAsync,
  updateAgentHealthCheckAsync,
  type RegisterAgentByProviderInput,
} from "./agent.store";
import { checkAgentHealth, requestAgent } from "../gateway/a2a.gateway";

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
    try {
      const response = await requestAgent({
        conversationId,
        agent,
        userText: message,
      });
      return c.json({ data: { output_text: response.text } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return c.json(
        { error: { code: "test_call_failed", message: errorMessage } },
        502,
      );
    }
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
}
