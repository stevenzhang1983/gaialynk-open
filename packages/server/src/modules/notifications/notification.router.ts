import type { Hono } from "hono";
import { z } from "zod";
import { createAuthMeMiddleware, requireAuth } from "../auth/auth.routes";
import {
  countUnreadNotificationsAsync,
  listNotificationsPagedAsync,
  markAllNotificationsReadAsync,
  markNotificationReadAsync,
} from "./notification.store";

const authMw = createAuthMeMiddleware();

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  unread_only: z.enum(["true", "false"]).optional(),
  cursor: z.string().max(2048).optional(),
});

export function registerNotificationCenterRoutes(app: Hono): void {
  app.get("/api/v1/notifications", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);
    const parsed = listQuerySchema.safeParse({
      limit: c.req.query("limit"),
      unread_only: c.req.query("unread_only"),
      cursor: c.req.query("cursor"),
    });
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_query", message: "Invalid notifications query", details: parsed.error.flatten() } },
        400,
      );
    }
    const limit = parsed.data.limit ?? 20;
    const unreadOnly = parsed.data.unread_only === "true";
    const { items, next_cursor } = await listNotificationsPagedAsync({
      userId: me.userId,
      limit,
      unreadOnly,
      cursor: parsed.data.cursor,
    });
    const unread_count = await countUnreadNotificationsAsync(me.userId);
    return c.json(
      {
        data: { items, next_cursor },
        meta: { unread_count },
      },
      200,
    );
  });

  app.post("/api/v1/notifications/read-all", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);
    const n = await markAllNotificationsReadAsync(me.userId);
    return c.json({ data: { updated: n } }, 200);
  });

  app.post("/api/v1/notifications/:id/read", authMw, async (c) => {
    const me = requireAuth(c);
    if (!me) return c.json({ error: { code: "unauthorized", message: "Unauthorized" } }, 401);
    const id = c.req.param("id")?.trim() ?? "";
    if (!id) {
      return c.json({ error: { code: "invalid_id", message: "Missing notification id" } }, 400);
    }
    const row = await markNotificationReadAsync(me.userId, id);
    if (!row) {
      return c.json({ error: { code: "notification_not_found", message: "Notification not found" } }, 404);
    }
    return c.json({ data: row }, 200);
  });
}
