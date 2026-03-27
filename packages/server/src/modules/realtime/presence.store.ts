import { isPostgresEnabled, query } from "../../infra/db/client";
import { fanoutConversationPayload } from "./redis-pubsub";
import { listSpaceMembersAsync, type SpaceMemberRole } from "../spaces/space.store";

export type SpacePresenceStatus = "online" | "away" | "offline";

export interface SpaceMemberPresenceRow {
  user_id: string;
  space_role: SpaceMemberRole;
  presence_status: SpacePresenceStatus;
  last_seen_at: string | null;
  joined_at: string;
}

const AWAY_DELAY_MS = 30_000;

type MemPresence = { status: "online" | "away"; last_seen_at: string; updated_at: string };
const memPresence = new Map<string, MemPresence>();
const awayTimers = new Map<string, ReturnType<typeof setTimeout>>();

function memKey(spaceId: string, userId: string): string {
  return `${spaceId}\0${userId}`;
}

export function resetPresenceStore(): void {
  for (const t of awayTimers.values()) {
    clearTimeout(t);
  }
  awayTimers.clear();
  memPresence.clear();
}

function cancelAwayTimer(spaceId: string, userId: string): void {
  const k = memKey(spaceId, userId);
  const t = awayTimers.get(k);
  if (t) {
    clearTimeout(t);
    awayTimers.delete(k);
  }
}

export async function markUserOnlineInSpaceAsync(spaceId: string, userId: string): Promise<void> {
  const now = new Date().toISOString();
  cancelAwayTimer(spaceId, userId);

  if (!isPostgresEnabled()) {
    memPresence.set(memKey(spaceId, userId), { status: "online", last_seen_at: now, updated_at: now });
    return;
  }

  await query(
    `INSERT INTO space_presence (user_id, space_id, status, last_seen_at, updated_at)
     VALUES ($1::uuid, $2::uuid, 'online', $3::timestamptz, $3::timestamptz)
     ON CONFLICT (user_id, space_id) DO UPDATE SET
       status = 'online',
       last_seen_at = EXCLUDED.last_seen_at,
       updated_at = EXCLUDED.updated_at`,
    [userId, spaceId, now],
  );
}

export function scheduleMarkUserAwayInSpace(
  spaceId: string,
  userId: string,
  /** E-12: when set, fan-out `presence_update` on this conversation WS channel after marking away. */
  conversationId?: string,
): void {
  const k = memKey(spaceId, userId);
  cancelAwayTimer(spaceId, userId);

  const run = (): void => {
    awayTimers.delete(k);
    void markUserAwayInSpaceAsync(spaceId, userId, conversationId);
  };
  awayTimers.set(k, setTimeout(run, AWAY_DELAY_MS));
}

async function markUserAwayInSpaceAsync(
  spaceId: string,
  userId: string,
  conversationId?: string,
): Promise<void> {
  const now = new Date().toISOString();

  if (!isPostgresEnabled()) {
    const cur = memPresence.get(memKey(spaceId, userId));
    if (cur) {
      memPresence.set(memKey(spaceId, userId), { status: "away", last_seen_at: now, updated_at: now });
    }
  } else {
    await query(
      `UPDATE space_presence SET status = 'away', last_seen_at = $3::timestamptz, updated_at = $3::timestamptz
       WHERE user_id = $1::uuid AND space_id = $2::uuid AND status = 'online'`,
      [userId, spaceId, now],
    );
  }

  if (conversationId) {
    fanoutConversationPayload(
      conversationId,
      JSON.stringify({
        type: "presence_update",
        space_id: spaceId,
        user_id: userId,
        status: "away",
      }),
    );
  }
}

export async function getSpacePresenceForMembersAsync(spaceId: string): Promise<SpaceMemberPresenceRow[]> {
  const members = await listSpaceMembersAsync(spaceId);

  if (!isPostgresEnabled()) {
    return members.map((m) => {
      const row = memPresence.get(memKey(spaceId, m.user_id));
      const presence_status: SpacePresenceStatus = row
        ? row.status === "online"
          ? "online"
          : "away"
        : "offline";
      return {
        user_id: m.user_id,
        space_role: m.role,
        presence_status,
        last_seen_at: row?.last_seen_at ?? null,
        joined_at: m.joined_at,
      };
    });
  }

  const rows = await query<{ user_id: string; status: string; last_seen_at: string; updated_at: string }>(
    `SELECT user_id::text, status, last_seen_at::text, updated_at::text
     FROM space_presence WHERE space_id = $1::uuid`,
    [spaceId],
  );
  const byUser = new Map(rows.map((r) => [r.user_id, r]));

  return members.map((m) => {
    const p = byUser.get(m.user_id);
    const presence_status: SpacePresenceStatus = p ? (p.status === "online" ? "online" : "away") : "offline";
    return {
      user_id: m.user_id,
      space_role: m.role,
      presence_status,
      last_seen_at: p?.last_seen_at ?? null,
      joined_at: m.joined_at,
    };
  });
}
