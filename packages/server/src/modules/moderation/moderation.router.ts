import type { Hono } from "hono";
import { z } from "zod";
import { createAuthMeMiddleware, requireAuth } from "../auth/auth.routes";
import { hideMessageAsync, reportMessageAsync } from "./message-moderation.store";

const authMw = createAuthMeMiddleware();

const reportBodySchema = z.object({
  reason: z.string().min(1).max(500),
  detail: z.string().max(2000).optional().nullable(),
});

export function registerModerationRoutes(app: Hono): void {
  app.post("/api/v1/messages/:id/report", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);
    const parsed = reportBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "validation_error", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const messageId = c.req.param("id") ?? "";
    if (!messageId) {
      return c.json({ error: { code: "invalid_param", message: "message id required" } }, 400);
    }
    const result = await reportMessageAsync({
      messageId,
      reporterUserId: me.userId,
      reason: parsed.data.reason,
      detail: parsed.data.detail ?? null,
    });
    if (!result.ok) {
      const status =
        result.code === "message_not_found"
          ? 404
          : result.code === "forbidden"
            ? 403
            : result.code === "already_reported"
              ? 409
              : 400;
      return c.json({ error: { code: result.code, message: result.message } }, status);
    }
    return c.json({ data: { report: result.report } }, 201);
  });

  app.post("/api/v1/messages/:id/hide", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);
    const messageId = c.req.param("id") ?? "";
    if (!messageId) {
      return c.json({ error: { code: "invalid_param", message: "message id required" } }, 400);
    }
    const result = await hideMessageAsync({ messageId, actorUserId: me.userId });
    if (!result.ok) {
      const status =
        result.code === "message_not_found"
          ? 404
          : result.code === "forbidden"
            ? 403
            : result.code === "no_space"
              ? 400
              : 400;
      return c.json({ error: { code: result.code, message: result.message } }, status);
    }
    return c.json({ data: { hidden: true } }, 200);
  });
}
