import { randomUUID } from "node:crypto";
import type { Hono } from "hono";
import { z } from "zod";
import { emitAuditEventAsync } from "../audit/audit.store";
import { createAuthMeMiddleware, requireAuth } from "../auth/auth.routes";
import { getUserByIdAsync } from "../auth/user.store";
import { notifySpaceInvitationRecipientAsync } from "../notifications/notification-triggers";
import { createSpaceInvitationAsync, redeemSpaceInvitationAsync } from "./space-invitation.store";
import { forbiddenMessageForAction, spaceRoleAllows } from "./rbac.middleware";
import { getSpacePresenceForMembersAsync } from "../realtime/presence.store";
import {
  addSpaceMemberAsync,
  createTeamSpaceAsync,
  getMemberRoleAsync,
  getSpaceByIdAsync,
  leaveSpaceAsync,
  listSpaceMembersPublicAsync,
  listSpacesForUserAsync,
  removeSpaceMemberAsync,
  setSpaceArchivedAsync,
  transferSpaceOwnershipAsync,
  updateMemberSpaceRoleAsync,
  updateSpaceNameAsync,
  userIsMemberOfSpaceAsync,
} from "./space.store";
import type { SpaceMemberRole } from "./space.store";

const createSpaceBodySchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["team"]).default("team"),
});

const addMemberBodySchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["admin", "member", "guest"]).default("member"),
});

const spaceInviteBodySchema = z.object({
  preset_role: z.enum(["admin", "member", "guest"]).default("member"),
  ttl_hours: z.number().int().min(1).max(720).optional(),
  /** E-16: 若填写，则向该已注册用户发送 Space 邀请通知（应用内 + 邮件偏好允许时发邮件）。 */
  invitee_user_id: z.string().uuid().optional(),
});

const spaceJoinBodySchema = z.object({
  token: z.string().min(16),
});

const patchSpaceSchema = z.object({
  name: z.string().min(1).max(255),
});

const transferOwnerSchema = z.object({
  new_owner_user_id: z.string().uuid(),
});

const patchMemberRoleSchema = z.object({
  role: z.enum(["owner", "admin", "member", "guest"]),
});

function correlationIdFrom(c: { req: { header: (n: string) => string | undefined } }): string {
  return c.req.header("X-Correlation-Id")?.trim() || randomUUID();
}

function canActorChangeMemberRole(params: {
  actorRole: SpaceMemberRole;
  targetRole: SpaceMemberRole;
  newRole: SpaceMemberRole;
}): boolean {
  const { actorRole, targetRole, newRole } = params;
  if (actorRole === "owner") {
    if (newRole === "owner") return false;
    return true;
  }
  if (actorRole === "admin") {
    if (targetRole === "owner" || targetRole === "admin") return false;
    if (newRole === "owner" || newRole === "admin") return false;
    return true;
  }
  return false;
}

export function registerSpaceRoutes(app: Hono): void {
  const authMw = createAuthMeMiddleware();

  app.get("/api/v1/spaces", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaces = await listSpacesForUserAsync(auth.userId);
    return c.json({ data: spaces }, 200);
  });

  app.post("/api/v1/spaces", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const parsed = createSpaceBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    if (parsed.data.type !== "team") {
      return c.json(
        { error: { code: "invalid_input", message: "Only team spaces can be created via this endpoint" } },
        400,
      );
    }
    const space = await createTeamSpaceAsync(auth.userId, parsed.data.name);
    return c.json({ data: space }, 201);
  });

  app.post("/api/v1/spaces/join", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const parsed = spaceJoinBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid token", details: parsed.error.flatten() } },
        400,
      );
    }
    const cid = correlationIdFrom(c);
    try {
      const result = await redeemSpaceInvitationAsync({ token: parsed.data.token, userId: auth.userId });
      await emitAuditEventAsync({
        eventType: "space.member_joined",
        actorType: "user",
        actorId: auth.userId,
        payload: { space_id: result.space_id, via: "invite_token", role: result.role },
        correlationId: cid,
      });
      return c.json({ data: { space_id: result.space_id, role: result.role } }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "invalid_or_expired_invite") {
        return c.json({ error: { code: "invalid_invite", message: "邀请无效或已过期。" } }, 400);
      }
      if (msg === "invite_already_used") {
        return c.json({ error: { code: "invite_used", message: "该邀请链接已被使用。" } }, 409);
      }
      if (msg === "already_member") {
        return c.json({ error: { code: "already_member", message: "你已在该 Space 中。" } }, 409);
      }
      throw e;
    }
  });

  app.get("/api/v1/spaces/:id/members", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const member = await userIsMemberOfSpaceAsync(spaceId, auth.userId);
    if (!member) {
      return c.json({ error: { code: "forbidden", message: "Not a member of this space" } }, 403);
    }
    const members = await listSpaceMembersPublicAsync(spaceId);
    return c.json({ data: members }, 200);
  });

  app.get("/api/v1/spaces/:id/presence", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const member = await userIsMemberOfSpaceAsync(spaceId, auth.userId);
    if (!member) {
      return c.json({ error: { code: "forbidden", message: "Not a member of this space" } }, 403);
    }
    const members = await getSpacePresenceForMembersAsync(spaceId);
    return c.json({ data: { space_id: spaceId, members } }, 200);
  });

  app.post("/api/v1/spaces/:id/members", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const role = await getMemberRoleAsync(spaceId, auth.userId);
    if (!spaceRoleAllows(role, "invite_others")) {
      return c.json(
        {
          error: {
            code: "forbidden",
            message: forbiddenMessageForAction("invite_others"),
          },
        },
        403,
      );
    }
    const parsed = addMemberBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    try {
      const row = await addSpaceMemberAsync({
        spaceId,
        actorUserId: auth.userId,
        targetUserId: parsed.data.user_id,
        role: parsed.data.role,
      });
      await emitAuditEventAsync({
        eventType: "space.member_joined",
        actorType: "user",
        actorId: auth.userId,
        payload: { space_id: spaceId, target_user_id: parsed.data.user_id, role: row.role, via: "direct_add" },
        correlationId: correlationIdFrom(c),
      });
      return c.json({ data: row }, 201);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("forbidden")) {
        return c.json({ error: { code: "forbidden", message: "Only owner or admin can add members" } }, 403);
      }
      if (msg.includes("member_already_exists")) {
        return c.json({ error: { code: "member_already_exists", message: "User is already a member" } }, 409);
      }
      throw e;
    }
  });

  app.post("/api/v1/spaces/:id/invitations", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const role = await getMemberRoleAsync(spaceId, auth.userId);
    if (!spaceRoleAllows(role, "invite_others")) {
      return c.json(
        { error: { code: "forbidden", message: forbiddenMessageForAction("invite_others") } },
        403,
      );
    }
    const parsed = spaceInviteBodySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const inv = await createSpaceInvitationAsync({
      spaceId,
      createdByUserId: auth.userId,
      presetRole: parsed.data.preset_role,
      ttlHours: parsed.data.ttl_hours,
    });
    const space = await getSpaceByIdAsync(spaceId);
    const spaceName = space?.name ?? "Space";
    const inviteeId = parsed.data.invitee_user_id;
    if (inviteeId) {
      if (inviteeId === auth.userId) {
        return c.json(
          { error: { code: "invalid_input", message: "不能向自己发送邀请通知。" } },
          400,
        );
      }
      const memberRole = await getMemberRoleAsync(spaceId, inviteeId);
      if (memberRole) {
        return c.json(
          { error: { code: "already_member", message: "该用户已是 Space 成员。" } },
          409,
        );
      }
      const inviter = await getUserByIdAsync(auth.userId);
      const inviterLabel =
        inviter?.display_name?.trim() || inviter?.email || "Member";
      await notifySpaceInvitationRecipientAsync({
        inviteeUserId: inviteeId,
        spaceId,
        spaceName,
        invitationId: inv.id,
        token: inv.token,
        inviterLabel,
        presetRole: inv.preset_role,
        expiresAt: inv.expires_at,
      });
    }
    await emitAuditEventAsync({
      eventType: "space.invitation_created",
      actorType: "user",
      actorId: auth.userId,
      payload: {
        space_id: spaceId,
        invitation_id: inv.id,
        preset_role: inv.preset_role,
        expires_at: inv.expires_at,
        invitee_user_id: inviteeId ?? null,
      },
      correlationId: correlationIdFrom(c),
    });
    return c.json(
      {
        data: {
          invitation_id: inv.id,
          token: inv.token,
          expires_at: inv.expires_at,
          preset_role: inv.preset_role,
          join_hint: "POST /api/v1/spaces/join with body { token }",
        },
      },
      201,
    );
  });

  app.patch("/api/v1/spaces/:id", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const r = await getMemberRoleAsync(spaceId, auth.userId);
    if (!spaceRoleAllows(r, "modify_space_settings")) {
      return c.json(
        { error: { code: "forbidden", message: forbiddenMessageForAction("modify_space_settings") } },
        403,
      );
    }
    const parsed = patchSpaceSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    const updated = await updateSpaceNameAsync(spaceId, parsed.data.name);
    if (!updated) return c.json({ error: { code: "space_not_found", message: "Space not found" } }, 404);
    return c.json({ data: updated }, 200);
  });

  app.post("/api/v1/spaces/:id/archive", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const r = await getMemberRoleAsync(spaceId, auth.userId);
    if (!spaceRoleAllows(r, "archive_space")) {
      return c.json({ error: { code: "forbidden", message: forbiddenMessageForAction("archive_space") } }, 403);
    }
    const updated = await setSpaceArchivedAsync(spaceId, true);
    if (!updated) return c.json({ error: { code: "space_not_found", message: "Space not found" } }, 404);
    await emitAuditEventAsync({
      eventType: "space.archived",
      actorType: "user",
      actorId: auth.userId,
      payload: { space_id: spaceId },
      correlationId: correlationIdFrom(c),
    });
    return c.json({ data: updated }, 200);
  });

  app.post("/api/v1/spaces/:id/leave", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    try {
      await leaveSpaceAsync(spaceId, auth.userId);
      await emitAuditEventAsync({
        eventType: "space.member_left",
        actorType: "user",
        actorId: auth.userId,
        payload: { space_id: spaceId },
        correlationId: correlationIdFrom(c),
      });
      return c.json({ data: { space_id: spaceId, left: true } }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "not_a_member") {
        return c.json({ error: { code: "not_a_member", message: "你不是该 Space 成员。" } }, 400);
      }
      if (msg === "owner_must_transfer_before_leave") {
        return c.json(
          {
            error: {
              code: "owner_must_transfer",
              message: "你是唯一 owner，请先转让所有权再离开。",
            },
          },
          409,
        );
      }
      throw e;
    }
  });

  app.post("/api/v1/spaces/:id/transfer-owner", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const parsed = transferOwnerSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    try {
      await transferSpaceOwnershipAsync({
        spaceId,
        actorUserId: auth.userId,
        newOwnerUserId: parsed.data.new_owner_user_id,
      });
      await emitAuditEventAsync({
        eventType: "space.owner_transferred",
        actorType: "user",
        actorId: auth.userId,
        payload: { space_id: spaceId, new_owner_user_id: parsed.data.new_owner_user_id },
        correlationId: correlationIdFrom(c),
      });
      return c.json({ data: { space_id: spaceId, new_owner_user_id: parsed.data.new_owner_user_id } }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("only owner")) {
        return c.json({ error: { code: "forbidden", message: "仅 owner 可转让所有权。" } }, 403);
      }
      if (msg.includes("target_not_member")) {
        return c.json({ error: { code: "invalid_target", message: "新 owner 必须是当前成员。" } }, 400);
      }
      throw e;
    }
  });

  app.patch("/api/v1/spaces/:id/members/:userId", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    const targetUserId = c.req.param("userId") ?? "";
    if (!spaceId || !targetUserId) {
      return c.json({ error: { code: "invalid_input", message: "Missing space or user id" } }, 400);
    }
    const actorRole = await getMemberRoleAsync(spaceId, auth.userId);
    if (!actorRole) {
      return c.json({ error: { code: "forbidden", message: "Not a member of this space" } }, 403);
    }
    const targetRole = await getMemberRoleAsync(spaceId, targetUserId);
    if (!targetRole) {
      return c.json({ error: { code: "not_a_member", message: "目标用户不是成员。" } }, 404);
    }
    const parsed = patchMemberRoleSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return c.json(
        { error: { code: "invalid_input", message: "Invalid body", details: parsed.error.flatten() } },
        400,
      );
    }
    if (!canActorChangeMemberRole({ actorRole, targetRole, newRole: parsed.data.role })) {
      return c.json(
        {
          error: {
            code: "forbidden",
            message: "你没有权限修改该成员的角色，或不能使用该角色值（例如应使用转让 owner 接口）。",
          },
        },
        403,
      );
    }
    const updated = await updateMemberSpaceRoleAsync({
      spaceId,
      targetUserId,
      newRole: parsed.data.role,
    });
    if (!updated) return c.json({ error: { code: "update_failed", message: "更新失败" } }, 500);
    await emitAuditEventAsync({
      eventType: "space.member_role_updated",
      actorType: "user",
      actorId: auth.userId,
      payload: { space_id: spaceId, target_user_id: targetUserId, new_role: parsed.data.role },
      correlationId: correlationIdFrom(c),
    });
    return c.json({ data: updated }, 200);
  });

  app.delete("/api/v1/spaces/:id/members/:userId", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    const targetUserId = c.req.param("userId") ?? "";
    if (!spaceId || !targetUserId) {
      return c.json({ error: { code: "invalid_input", message: "Missing space or user id" } }, 400);
    }
    if (targetUserId === auth.userId) {
      return c.json(
        { error: { code: "invalid_input", message: "请使用「离开 Space」移除自己。" } },
        400,
      );
    }
    const actorRole = await getMemberRoleAsync(spaceId, auth.userId);
    if (!actorRole) {
      return c.json({ error: { code: "forbidden", message: "Not a member of this space" } }, 403);
    }
    if (actorRole !== "owner" && actorRole !== "admin") {
      return c.json({ error: { code: "forbidden", message: "仅 owner 或 admin 可移除成员。" } }, 403);
    }
    const targetRole = await getMemberRoleAsync(spaceId, targetUserId);
    if (!targetRole) {
      return c.json({ error: { code: "not_a_member", message: "目标用户不是成员。" } }, 404);
    }
    if (actorRole === "admin" && (targetRole === "owner" || targetRole === "admin")) {
      return c.json({ error: { code: "forbidden", message: "admin 不能移除 owner 或其他 admin。" } }, 403);
    }
    if (targetRole === "owner") {
      return c.json({ error: { code: "forbidden", message: "不能移除 Space owner。" } }, 403);
    }
    const removed = await removeSpaceMemberAsync(spaceId, targetUserId);
    if (!removed) {
      return c.json({ error: { code: "not_a_member", message: "目标用户不是成员。" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "space.member_removed",
      actorType: "user",
      actorId: auth.userId,
      payload: { space_id: spaceId, target_user_id: targetUserId, target_role: targetRole },
      correlationId: correlationIdFrom(c),
    });
    return c.json({ data: { space_id: spaceId, user_id: targetUserId, removed: true } }, 200);
  });

  app.get("/api/v1/spaces/:id", authMw, async (c) => {
    const auth = requireAuth(c);
    if (!auth) return c.json({ error: { code: "unauthorized", message: "Not authenticated" } }, 401);
    const spaceId = c.req.param("id") ?? "";
    if (!spaceId) return c.json({ error: { code: "invalid_input", message: "Missing space id" } }, 400);
    const allowed = await userIsMemberOfSpaceAsync(spaceId, auth.userId);
    if (!allowed) {
      return c.json({ error: { code: "forbidden", message: "Not a member of this space" } }, 403);
    }
    const space = await getSpaceByIdAsync(spaceId);
    if (!space) return c.json({ error: { code: "space_not_found", message: "Space not found" } }, 404);
    return c.json({ data: space }, 200);
  });
}
