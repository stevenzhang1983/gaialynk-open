import type { Context } from "hono";
import { getMemberRoleAsync, type SpaceMemberRole } from "./space.store";

/** E-2 permission matrix (CTO V1.3) + E-11 `agent_invite_agent` (enforced in conversation routes, not via role alone). */
export type SpaceRbacAction =
  | "invite_others"
  | "join_agent_to_conversation"
  | "grant_agent_invite_permission"
  | "agent_invite_agent"
  | "trigger_connector"
  | "approve_high_risk"
  | "export_audit"
  | "modify_space_settings"
  | "archive_space";

const matrix: Record<SpaceRbacAction, SpaceMemberRole[]> = {
  invite_others: ["owner", "admin"],
  join_agent_to_conversation: ["owner", "admin", "member"],
  grant_agent_invite_permission: ["owner", "admin"],
  /** Human-side pre-check: same as join; agent path uses delegating-user grant check. */
  agent_invite_agent: ["owner", "admin", "member"],
  trigger_connector: ["owner", "admin", "member"],
  approve_high_risk: ["owner", "admin"],
  export_audit: ["owner", "admin"],
  modify_space_settings: ["owner", "admin"],
  archive_space: ["owner", "admin"],
};

export function spaceRoleAllows(role: SpaceMemberRole | null | undefined, action: SpaceRbacAction): boolean {
  if (!role) return false;
  return matrix[action].includes(role);
}

export function forbiddenMessageForAction(action: SpaceRbacAction): string {
  const labels: Record<SpaceRbacAction, string> = {
    invite_others: "邀请他人需要 Space 的 owner 或 admin 权限。",
    join_agent_to_conversation: "将 Agent 拉入会话需要 owner、admin 或 member；guest 无权操作。",
    grant_agent_invite_permission: "授予 Agent「可邀请」权限需要 owner 或 admin。",
    agent_invite_agent: "Agent 代邀请需要指定授权用户，且该用户须为 Space 的 owner 或 admin。",
    trigger_connector: "使用连接器需要 owner、admin 或 member；guest 无权触发连接器。",
    approve_high_risk: "审批高风险操作需要 owner 或 admin。",
    export_audit: "导出审计需要 owner 或 admin。",
    modify_space_settings: "修改 Space 设置需要 owner 或 admin。",
    archive_space: "归档 Space 需要 owner 或 admin。",
  };
  return labels[action];
}

/** Stable machine-facing reason for clients (E-11). */
export function rbacReasonCodeForAction(action: SpaceRbacAction): string {
  return `space_rbac_${action}`;
}

export function rbacForbiddenJson(c: Context, action: SpaceRbacAction): Response {
  return c.json(
    {
      error: {
        code: "forbidden",
        message: forbiddenMessageForAction(action),
        details: { reason_code: rbacReasonCodeForAction(action) },
      },
    },
    403,
  );
}

/**
 * When `spaceId` is set, require `userId` to be a member with permission for `action`.
 * Returns a 403 Response to short-circuit the handler, or `null` to continue.
 */
export async function forbiddenUnlessSpaceRbac(
  c: Context,
  spaceId: string | null | undefined,
  userId: string,
  action: SpaceRbacAction,
): Promise<Response | null> {
  if (!spaceId) return null;
  const role = await getMemberRoleAsync(spaceId, userId);
  if (!spaceRoleAllows(role, action)) {
    return rbacForbiddenJson(c, action);
  }
  return null;
}

export function delegatingUserCanAuthorizeAgentInvite(role: SpaceMemberRole | null | undefined): boolean {
  return spaceRoleAllows(role, "grant_agent_invite_permission");
}
