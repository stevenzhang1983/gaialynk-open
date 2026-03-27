import { createHash, randomBytes, randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { getMemberRoleAsync, insertSpaceMemberRowAsync } from "./space.store";
import type { SpaceMemberRole } from "./space.store";

export type SpaceInvitePresetRole = Exclude<SpaceMemberRole, "owner">;

export interface SpaceInvitationRecord {
  id: string;
  space_id: string;
  token_hash: string;
  preset_role: SpaceInvitePresetRole;
  created_by: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  used_by: string | null;
}

const memInvitesByHash = new Map<string, SpaceInvitationRecord>();

function nowIso(): string {
  return new Date().toISOString();
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export interface SpaceInviteCreated {
  id: string;
  space_id: string;
  token: string;
  expires_at: string;
  preset_role: SpaceInvitePresetRole;
}

export async function createSpaceInvitationAsync(params: {
  spaceId: string;
  createdByUserId: string;
  presetRole: SpaceInvitePresetRole;
  ttlHours?: number;
}): Promise<SpaceInviteCreated> {
  const ttlHours = params.ttlHours ?? 168;
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashInviteToken(token);
  const id = randomUUID();
  const now = nowIso();
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();

  if (!isPostgresEnabled()) {
    memInvitesByHash.set(tokenHash, {
      id,
      space_id: params.spaceId,
      token_hash: tokenHash,
      preset_role: params.presetRole,
      created_by: params.createdByUserId,
      expires_at: expiresAt,
      created_at: now,
      used_at: null,
      used_by: null,
    });
    return { id, space_id: params.spaceId, token, expires_at: expiresAt, preset_role: params.presetRole };
  }

  await query(
    `INSERT INTO space_invitations (id, space_id, token_hash, preset_role, created_by, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, params.spaceId, tokenHash, params.presetRole, params.createdByUserId, expiresAt, now],
  );
  return { id, space_id: params.spaceId, token, expires_at: expiresAt, preset_role: params.presetRole };
}

export async function redeemSpaceInvitationAsync(params: {
  token: string;
  userId: string;
}): Promise<{ space_id: string; role: SpaceMemberRole }> {
  const tokenHash = hashInviteToken(params.token.trim());
  const { userId } = params;

  if (!isPostgresEnabled()) {
    const row = memInvitesByHash.get(tokenHash);
    if (!row) throw new Error("invalid_or_expired_invite");
    if (row.used_at) throw new Error("invite_already_used");
    if (Date.parse(row.expires_at) <= Date.now()) throw new Error("invalid_or_expired_invite");
    const existing = await getMemberRoleAsync(row.space_id, userId);
    if (existing) throw new Error("already_member");
    row.used_at = nowIso();
    row.used_by = userId;
    const m = await insertSpaceMemberRowAsync({ spaceId: row.space_id, userId, role: row.preset_role });
    return { space_id: m.space_id, role: m.role };
  }

  const rows = await query<SpaceInvitationRecord & { preset_role: string }>(
    `SELECT id, space_id, token_hash, preset_role, created_by, expires_at::text, created_at::text, used_at::text, used_by::text
     FROM space_invitations WHERE token_hash = $1`,
    [tokenHash],
  );
  const inv = rows[0];
  if (!inv) throw new Error("invalid_or_expired_invite");
  if (inv.used_at) throw new Error("invite_already_used");
  if (Date.parse(inv.expires_at) <= Date.now()) throw new Error("invalid_or_expired_invite");
  const existing = await getMemberRoleAsync(inv.space_id, userId);
  if (existing) throw new Error("already_member");

  const usedAt = nowIso();
  await query(
    `UPDATE space_invitations SET used_at = $2, used_by = $3 WHERE id = $1`,
    [inv.id, usedAt, userId],
  );
  const m = await insertSpaceMemberRowAsync({
    spaceId: inv.space_id,
    userId,
    role: inv.preset_role as SpaceMemberRole,
  });
  return { space_id: m.space_id, role: m.role };
}

export function resetSpaceInvitationStore(): void {
  memInvitesByHash.clear();
}
