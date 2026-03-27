"use client";

import { useMemo } from "react";
import type { SpaceMemberRole } from "@/components/product/space-context";

/** 与主线 `spaceRoleAllows(..., "trigger_connector")` 一致：owner / admin / member */
export function roleMayTriggerConnector(role: SpaceMemberRole | null): boolean {
  if (!role) return false;
  return role === "owner" || role === "admin" || role === "member";
}

/** 与主线 `export_audit` 矩阵一致 */
export function roleMayExportAudit(role: SpaceMemberRole | null): boolean {
  if (!role) return false;
  return role === "owner" || role === "admin";
}

/**
 * W-15：产品区内基于当前 Space 角色的 UI 门控（服务端仍强制 RBAC）。
 * 角色修改 / 移除成员：按 CTO W-15 仅 **owner** 在成员表中操作（与 PATCH/DELETE API 中 admin 能力区分）。
 */
export function useSpacePermissions(myRole: SpaceMemberRole | null) {
  return useMemo(
    () => ({
      mayTriggerConnector: roleMayTriggerConnector(myRole),
      mayExportAudit: roleMayExportAudit(myRole),
      showConnectorsNav: roleMayTriggerConnector(myRole),
      isOwner: myRole === "owner",
      mayEditMemberRolesInUi: myRole === "owner",
      mayRemoveMembersInUi: myRole === "owner",
    }),
    [myRole],
  );
}
