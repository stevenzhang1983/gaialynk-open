import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { getUserByIdAsync, maskEmailForMemberList, updateUserDefaultSpaceIdAsync } from "../auth/user.store";

export type SpaceType = "personal" | "team";
export type SpaceMemberRole = "owner" | "admin" | "member" | "guest";
export type SpaceStatus = "active" | "archived";

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  status: SpaceStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  space_id: string;
  user_id: string;
  role: SpaceMemberRole;
  joined_at: string;
  /** E-11 migration default `human`. */
  invited_by_actor_type?: string;
}

/** Member row for `GET /spaces/:id/members` (E-11). */
export interface SpaceMemberPublic extends SpaceMember {
  display_name: string | null;
  email_masked: string | null;
}

const memSpaces = new Map<string, Space>();
const memMembers = new Map<string, SpaceMember[]>();

function spaceMembersKey(spaceId: string): string {
  return spaceId;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getMemMembers(spaceId: string): SpaceMember[] {
  return memMembers.get(spaceMembersKey(spaceId)) ?? [];
}

function setMemMembers(spaceId: string, members: SpaceMember[]): void {
  memMembers.set(spaceMembersKey(spaceId), members);
}

function rowToSpace(r: {
  id: string;
  name: string;
  type: string;
  status?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}): Space {
  return {
    id: r.id,
    name: r.name,
    type: r.type as SpaceType,
    status: (r.status ?? "active") as SpaceStatus,
    created_by: r.created_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

/** Idempotent: ensures the user has a personal Space and default_space_id. */
export async function ensureDefaultPersonalSpaceAsync(userId: string): Promise<{ spaceId: string }> {
  const user = await getUserByIdAsync(userId);
  if (!user) {
    throw new Error("User not found for space bootstrap");
  }
  if (user.default_space_id) {
    return { spaceId: user.default_space_id };
  }

  const spaceId = randomUUID();
  const name = "Personal";
  const now = nowIso();

  if (!isPostgresEnabled()) {
    const space: Space = {
      id: spaceId,
      name,
      type: "personal",
      status: "active",
      created_by: userId,
      created_at: now,
      updated_at: now,
    };
    memSpaces.set(spaceId, space);
    setMemMembers(spaceId, [
      { space_id: spaceId, user_id: userId, role: "owner", joined_at: now, invited_by_actor_type: "human" },
    ]);
    await updateUserDefaultSpaceIdAsync(userId, spaceId);
    return { spaceId };
  }

  await query(
    `INSERT INTO spaces (id, name, type, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, 'active', $4, $5, $6)`,
    [spaceId, name, "personal", userId, now, now],
  );
  await query(
    `INSERT INTO space_members (space_id, user_id, role, joined_at, invited_by_actor_type)
     VALUES ($1, $2, $3, $4, 'human')`,
    [spaceId, userId, "owner", now],
  );
  await updateUserDefaultSpaceIdAsync(userId, spaceId);
  return { spaceId };
}

/** Backfill for legacy rows: call after login if default_space_id is null. */
export async function ensureUserHasPersonalSpaceAsync(userId: string): Promise<void> {
  await ensureDefaultPersonalSpaceAsync(userId);
}

export async function listSpacesForUserAsync(userId: string): Promise<Space[]> {
  if (!isPostgresEnabled()) {
    const out: Space[] = [];
    for (const m of [...memMembers.values()].flat()) {
      if (m.user_id === userId) {
        const s = memSpaces.get(m.space_id);
        if (s) out.push(s);
      }
    }
    return out.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  }
  const rows = await query<{
    id: string;
    name: string;
    type: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT s.id, s.name, s.type, s.status, s.created_by, s.created_at::text, s.updated_at::text
     FROM spaces s
     INNER JOIN space_members sm ON sm.space_id = s.id AND sm.user_id = $1
     ORDER BY s.created_at ASC`,
    [userId],
  );
  return rows.map(rowToSpace);
}

export async function getSpaceByIdAsync(spaceId: string): Promise<Space | null> {
  if (!isPostgresEnabled()) {
    return memSpaces.get(spaceId) ?? null;
  }
  const rows = await query<{
    id: string;
    name: string;
    type: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, name, type, status, created_by, created_at::text, updated_at::text FROM spaces WHERE id = $1`,
    [spaceId],
  );
  const r = rows[0];
  return r ? rowToSpace(r) : null;
}

export async function userIsMemberOfSpaceAsync(spaceId: string, userId: string): Promise<boolean> {
  if (!isPostgresEnabled()) {
    return getMemMembers(spaceId).some((m) => m.user_id === userId);
  }
  const rows = await query<{ one: number }>(
    `SELECT 1 AS one FROM space_members WHERE space_id = $1 AND user_id = $2`,
    [spaceId, userId],
  );
  return rows.length > 0;
}

export async function getMemberRoleAsync(spaceId: string, userId: string): Promise<SpaceMemberRole | null> {
  if (!isPostgresEnabled()) {
    const m = getMemMembers(spaceId).find((x) => x.user_id === userId);
    return m?.role ?? null;
  }
  const rows = await query<{ role: string }>(
    `SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2`,
    [spaceId, userId],
  );
  const r = rows[0]?.role;
  return r ? (r as SpaceMemberRole) : null;
}

export async function listSpaceMembersAsync(spaceId: string): Promise<SpaceMember[]> {
  if (!isPostgresEnabled()) {
    return [...getMemMembers(spaceId)];
  }
  const rows = await query<{
    space_id: string;
    user_id: string;
    role: string;
    joined_at: string;
    invited_by_actor_type: string | null;
  }>(
    `SELECT space_id, user_id, role, joined_at::text,
            COALESCE(invited_by_actor_type, 'human') AS invited_by_actor_type
     FROM space_members WHERE space_id = $1 ORDER BY joined_at ASC`,
    [spaceId],
  );
  return rows.map((r) => ({
    space_id: r.space_id,
    user_id: r.user_id,
    role: r.role as SpaceMemberRole,
    joined_at: r.joined_at,
    invited_by_actor_type: r.invited_by_actor_type ?? "human",
  }));
}

export async function listSpaceMembersPublicAsync(spaceId: string): Promise<SpaceMemberPublic[]> {
  const base = await listSpaceMembersAsync(spaceId);
  const out: SpaceMemberPublic[] = [];
  for (const m of base) {
    const u = await getUserByIdAsync(m.user_id);
    out.push({
      ...m,
      display_name: u?.display_name ?? null,
      email_masked: maskEmailForMemberList(u?.email ?? null),
    });
  }
  return out;
}

export async function createTeamSpaceAsync(userId: string, name: string): Promise<Space> {
  const spaceId = randomUUID();
  const now = nowIso();
  if (!isPostgresEnabled()) {
    const space: Space = {
      id: spaceId,
      name: name.trim(),
      type: "team",
      status: "active",
      created_by: userId,
      created_at: now,
      updated_at: now,
    };
    memSpaces.set(spaceId, space);
    setMemMembers(spaceId, [
      { space_id: spaceId, user_id: userId, role: "owner", joined_at: now, invited_by_actor_type: "human" },
    ]);
    return space;
  }
  await query(
    `INSERT INTO spaces (id, name, type, status, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, 'active', $4, $5, $6)`,
    [spaceId, name.trim(), "team", userId, now, now],
  );
  await query(
    `INSERT INTO space_members (space_id, user_id, role, joined_at, invited_by_actor_type)
     VALUES ($1, $2, $3, $4, 'human')`,
    [spaceId, userId, "owner", now],
  );
  const created = await getSpaceByIdAsync(spaceId);
  if (!created) throw new Error("Failed to load created space");
  return created;
}

/** Low-level insert after authorization (invites, admin add member). */
export async function insertSpaceMemberRowAsync(params: {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
  /** E-11: who initiated membership (default human). */
  invitedByActorType?: "human" | "agent" | "system" | "service";
}): Promise<SpaceMember> {
  const { spaceId, userId, role } = params;
  const invitedBy = params.invitedByActorType ?? "human";
  const now = nowIso();
  if (!isPostgresEnabled()) {
    const list = [...getMemMembers(spaceId)];
    const row: SpaceMember = {
      space_id: spaceId,
      user_id: userId,
      role,
      joined_at: now,
      invited_by_actor_type: invitedBy,
    };
    list.push(row);
    setMemMembers(spaceId, list);
    return row;
  }
  await query(
    `INSERT INTO space_members (space_id, user_id, role, joined_at, invited_by_actor_type)
     VALUES ($1, $2, $3, $4, $5)`,
    [spaceId, userId, role, now, invitedBy],
  );
  return {
    space_id: spaceId,
    user_id: userId,
    role,
    joined_at: now,
    invited_by_actor_type: invitedBy,
  };
}

export async function addSpaceMemberAsync(params: {
  spaceId: string;
  actorUserId: string;
  targetUserId: string;
  role: Exclude<SpaceMemberRole, "owner">;
}): Promise<SpaceMember> {
  const { spaceId, actorUserId, targetUserId, role } = params;
  const actorRole = await getMemberRoleAsync(spaceId, actorUserId);
  if (actorRole !== "owner" && actorRole !== "admin") {
    throw new Error("forbidden: only owner or admin can add members");
  }
  const exists = await getMemberRoleAsync(spaceId, targetUserId);
  if (exists) {
    throw new Error("member_already_exists");
  }
  return insertSpaceMemberRowAsync({ spaceId, userId: targetUserId, role });
}

export async function updateSpaceNameAsync(spaceId: string, name: string): Promise<Space | null> {
  const now = nowIso();
  const trimmed = name.trim();
  if (!isPostgresEnabled()) {
    const s = memSpaces.get(spaceId);
    if (!s) return null;
    const u = { ...s, name: trimmed, updated_at: now };
    memSpaces.set(spaceId, u);
    return u;
  }
  const rows = await query<{
    id: string;
    name: string;
    type: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>(
    `UPDATE spaces SET name = $2, updated_at = $3 WHERE id = $1
     RETURNING id, name, type, status, created_by, created_at::text, updated_at::text`,
    [spaceId, trimmed, now],
  );
  const r = rows[0];
  return r ? rowToSpace(r) : null;
}

export async function setSpaceArchivedAsync(spaceId: string, archived: boolean): Promise<Space | null> {
  const now = nowIso();
  const status: SpaceStatus = archived ? "archived" : "active";
  if (!isPostgresEnabled()) {
    const s = memSpaces.get(spaceId);
    if (!s) return null;
    const u = { ...s, status, updated_at: now };
    memSpaces.set(spaceId, u);
    return u;
  }
  const rows = await query<{
    id: string;
    name: string;
    type: string;
    status: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>(
    `UPDATE spaces SET status = $2, updated_at = $3 WHERE id = $1
     RETURNING id, name, type, status, created_by, created_at::text, updated_at::text`,
    [spaceId, status, now],
  );
  const r = rows[0];
  return r ? rowToSpace(r) : null;
}

export async function countOwnersAsync(spaceId: string): Promise<number> {
  const members = await listSpaceMembersAsync(spaceId);
  return members.filter((m) => m.role === "owner").length;
}

export async function removeSpaceMemberAsync(spaceId: string, userId: string): Promise<boolean> {
  if (!isPostgresEnabled()) {
    const list = getMemMembers(spaceId).filter((m) => m.user_id !== userId);
    if (list.length === getMemMembers(spaceId).length) return false;
    setMemMembers(spaceId, list);
    const now = nowIso();
    const s = memSpaces.get(spaceId);
    if (s) memSpaces.set(spaceId, { ...s, updated_at: now });
    return true;
  }
  const r = await query(`DELETE FROM space_members WHERE space_id = $1 AND user_id = $2 RETURNING user_id`, [
    spaceId,
    userId,
  ]);
  if (r.length > 0) {
    await query(`UPDATE spaces SET updated_at = $2 WHERE id = $1`, [spaceId, nowIso()]);
  }
  return r.length > 0;
}

export async function updateMemberSpaceRoleAsync(params: {
  spaceId: string;
  targetUserId: string;
  newRole: SpaceMemberRole;
}): Promise<SpaceMember | null> {
  const { spaceId, targetUserId, newRole } = params;
  const now = nowIso();
  if (!isPostgresEnabled()) {
    const list = getMemMembers(spaceId);
    const idx = list.findIndex((m) => m.user_id === targetUserId);
    if (idx < 0) return null;
    const u = { ...list[idx]!, role: newRole, joined_at: list[idx]!.joined_at };
    const next = [...list];
    next[idx] = u;
    setMemMembers(spaceId, next);
    const s = memSpaces.get(spaceId);
    if (s) memSpaces.set(spaceId, { ...s, updated_at: now });
    return u;
  }
  const rows = await query<{ space_id: string; user_id: string; role: string; joined_at: string }>(
    `UPDATE space_members SET role = $3 WHERE space_id = $1 AND user_id = $2
     RETURNING space_id, user_id, role, joined_at::text`,
    [spaceId, targetUserId, newRole],
  );
  const r = rows[0];
  if (r) await query(`UPDATE spaces SET updated_at = $2 WHERE id = $1`, [spaceId, now]);
  return r
    ? { space_id: r.space_id, user_id: r.user_id, role: r.role as SpaceMemberRole, joined_at: r.joined_at }
    : null;
}

/** Owner must transfer before leaving; other roles may leave. */
export async function leaveSpaceAsync(spaceId: string, userId: string): Promise<void> {
  const role = await getMemberRoleAsync(spaceId, userId);
  if (!role) throw new Error("not_a_member");
  if (role === "owner") {
    const owners = await countOwnersAsync(spaceId);
    if (owners <= 1) {
      throw new Error("owner_must_transfer_before_leave");
    }
  }
  const ok = await removeSpaceMemberAsync(spaceId, userId);
  if (!ok) throw new Error("leave_failed");
}

export async function transferSpaceOwnershipAsync(params: {
  spaceId: string;
  actorUserId: string;
  newOwnerUserId: string;
}): Promise<void> {
  const { spaceId, actorUserId, newOwnerUserId } = params;
  const actorRole = await getMemberRoleAsync(spaceId, actorUserId);
  if (actorRole !== "owner") throw new Error("forbidden: only owner can transfer");
  const newRole = await getMemberRoleAsync(spaceId, newOwnerUserId);
  if (!newRole) throw new Error("target_not_member");
  await updateMemberSpaceRoleAsync({ spaceId, targetUserId: actorUserId, newRole: "admin" });
  await updateMemberSpaceRoleAsync({ spaceId, targetUserId: newOwnerUserId, newRole: "owner" });
}

export function resetSpaceStore(): void {
  memSpaces.clear();
  memMembers.clear();
}
