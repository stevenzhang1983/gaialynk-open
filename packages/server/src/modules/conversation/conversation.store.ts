import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { recordUserMessageSentProductEventAsync } from "../product-events/product-events.emit";

export type ConversationState = "active" | "archived" | "closed";

export type ConversationTopology = "T1" | "T2" | "T3" | "T4" | "T5";
export type AuthorizationMode = "user_explicit" | "policy_based" | "delegated";
export type VisibilityMode = "full" | "summarized" | "restricted";
export type ConversationRiskLevel = "low" | "medium" | "high" | "critical";

/** E-3: user-visible delivery state; `sending` is primarily client-local, persisted for retries/audit. */
export type MessageDeliveryStatus = "sending" | "delivered" | "failed";

export interface Conversation {
  id: string;
  title: string;
  state: ConversationState;
  created_at: string;
  updated_at: string;
  /** E-2: bound Space; null = personal / legacy. */
  space_id?: string | null;
  conversation_topology?: ConversationTopology;
  authorization_mode?: AuthorizationMode;
  visibility_mode?: VisibilityMode;
  risk_level?: ConversationRiskLevel;
}

export interface Participant {
  id: string;
  conversation_id: string;
  participant_type: "user" | "agent";
  participant_id: string;
  role: "member" | "admin" | "readonly";
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: "user" | "agent" | "system";
  sender_id: string;
  content: {
    type: "text";
    text: string;
    thread_id?: string;
    mentions?: string[];
    file_ref_id?: string;
  };
  created_at: string;
  status: MessageDeliveryStatus;
  /** E-18: in-memory store only; API responses mask `content` when true. */
  content_hidden?: boolean;
}

interface AddParticipantInput {
  conversationId: string;
  participantType: "user" | "agent";
  participantId: string;
  role: "member" | "admin" | "readonly";
}

interface AppendMessageInput {
  conversationId: string;
  senderType: "user" | "agent" | "system";
  senderId: string;
  text: string;
  threadId?: string;
  mentions?: string[];
  /** E-4: optional uploaded file reference. */
  fileRefId?: string;
  /** Defaults to `delivered` when persisted on server (E-3). */
  status?: MessageDeliveryStatus;
}

const conversations = new Map<string, Conversation>();
const participantsByConversation = new Map<string, Participant[]>();
const messagesByConversation = new Map<string, Message[]>();
/** W-6: key `${userId}::${conversationId}` */
const conversationUserPrefsInMemory = new Map<string, { pinned_at: string | null; starred: boolean }>();

const nowIso = (): string => new Date().toISOString();

function normalizeMessageStatus(status: string | null | undefined): MessageDeliveryStatus {
  if (status === "sending" || status === "failed" || status === "delivered") {
    return status;
  }
  return "delivered";
}

export interface CreateConversationInput {
  title: string;
  space_id?: string | null;
  conversation_topology?: ConversationTopology;
  authorization_mode?: AuthorizationMode;
  visibility_mode?: VisibilityMode;
  risk_level?: ConversationRiskLevel;
}

export const createConversation = (input: string | CreateConversationInput): Conversation => {
  if (isPostgresEnabled()) {
    throw new Error("Use createConversationAsync in PostgreSQL mode");
  }
  const opts = typeof input === "string" ? { title: input } : input;
  const timestamp = nowIso();
  const conversation: Conversation = {
    id: randomUUID(),
    title: opts.title,
    state: "active",
    created_at: timestamp,
    updated_at: timestamp,
    space_id: opts.space_id ?? null,
    conversation_topology: opts.conversation_topology ?? "T1",
    authorization_mode: opts.authorization_mode ?? "user_explicit",
    visibility_mode: opts.visibility_mode ?? "full",
    risk_level: opts.risk_level ?? "low",
  };

  conversations.set(conversation.id, conversation);
  participantsByConversation.set(conversation.id, []);
  messagesByConversation.set(conversation.id, []);

  return conversation;
};

export const createConversationAsync = async (
  input: string | CreateConversationInput,
): Promise<Conversation> => {
  const opts = typeof input === "string" ? { title: input } : input;
  const topology = opts.conversation_topology ?? "T1";
  const authMode = opts.authorization_mode ?? "user_explicit";
  const visibility = opts.visibility_mode ?? "full";
  const riskLevel = opts.risk_level ?? "low";

  if (!isPostgresEnabled()) {
    return createConversation(opts);
  }

  const spaceId = opts.space_id ?? null;
  const conversation: Conversation = {
    id: randomUUID(),
    title: opts.title,
    state: "active",
    created_at: nowIso(),
    updated_at: nowIso(),
    space_id: spaceId,
    conversation_topology: topology,
    authorization_mode: authMode,
    visibility_mode: visibility,
    risk_level: riskLevel,
  };

  await query(
    `INSERT INTO conversations (id, title, state, created_at, updated_at, space_id, conversation_topology, authorization_mode, visibility_mode, risk_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      conversation.id,
      conversation.title,
      conversation.state,
      conversation.created_at,
      conversation.updated_at,
      spaceId,
      topology,
      authMode,
      visibility,
      riskLevel,
    ],
  );

  return conversation;
};

export type ListConversationsSort = "created_at:desc" | "created_at:asc";

export interface ListConversationsOptions {
  limit?: number;
  cursor?: string;
  sort?: ListConversationsSort;
  /** When set, only conversations in this Space (E-2). */
  space_id?: string;
  /** W-6: when set, only rows whose `state` is in this list */
  states?: ConversationState[];
  /** W-6: when set (Postgres), left join prefs for this user */
  prefsForUserId?: string;
}

export interface ListConversationsResult {
  data: Conversation[];
  next_cursor?: string;
}

/** Normalize listConversations result to Conversation[] (plain list or paginated envelope). */
export function conversationsListAsArray(
  result: Conversation[] | ListConversationsResult,
): Conversation[] {
  return Array.isArray(result) ? result : result.data;
}

export const listConversations = async (
  opts?: ListConversationsOptions,
): Promise<Conversation[] | ListConversationsResult> => {
  if (!isPostgresEnabled()) {
    let all = [...conversations.values()];
    if (opts?.space_id) {
      all = all.filter((c) => c.space_id === opts.space_id);
    }
    if (opts?.states?.length) {
      const allow = new Set(opts.states);
      all = all.filter((c) => allow.has(c.state));
    }
    const uid = opts?.prefsForUserId?.trim();
    const enriched = all.map((c) => {
      const pref = uid ? conversationUserPrefsInMemory.get(`${uid}::${c.id}`) : undefined;
      return {
        ...c,
        pinned_at: pref?.pinned_at ?? null,
        starred: pref?.starred ?? false,
      } as Conversation & { pinned_at: string | null; starred: boolean };
    });
    if (!opts?.limit && !opts?.cursor && !opts?.sort) {
      return enriched;
    }
    return listConversationsInMemory(enriched as unknown as Conversation[], opts);
  }

  type Row = Conversation & {
    conversation_topology?: string;
    authorization_mode?: string;
    visibility_mode?: string;
    risk_level?: string;
    space_id?: string | null;
    pinned_at?: string | null;
    starred?: boolean;
  };

  const usePagination = opts?.limit != null || opts?.cursor != null;
  const limit = usePagination ? Math.min(Math.max(opts?.limit ?? 50, 1), 100) : 0;
  const sort = opts?.sort ?? "created_at:desc";
  const orderDir = sort === "created_at:asc" ? "ASC" : "DESC";
  const cursor = opts?.cursor?.trim();
  const spaceIdFilter = opts?.space_id ?? null;
  const statesFilter = opts?.states?.length ? opts.states : null;
  const prefsUserId = opts?.prefsForUserId?.trim() || null;

  const selectCols = `c.id, c.title, c.state, c.created_at::text, c.updated_at::text, c.space_id::text,
                COALESCE(c.conversation_topology, 'T1') AS conversation_topology,
                COALESCE(c.authorization_mode, 'user_explicit') AS authorization_mode,
                COALESCE(c.visibility_mode, 'full') AS visibility_mode,
                COALESCE(c.risk_level, 'low') AS risk_level,
                cup.pinned_at::text AS pinned_at,
                COALESCE(cup.starred, false) AS starred`;

  const fromSql = `FROM conversations c
        LEFT JOIN conversation_user_prefs cup ON cup.conversation_id = c.id
          AND cup.user_id IS NOT DISTINCT FROM $2::text`;

  const whereBase = `WHERE ($1::uuid IS NULL OR c.space_id = $1)
          AND ($3::text[] IS NULL OR c.state = ANY($3))`;

  let rows: Row[];
  if (usePagination) {
    const cmpOp = orderDir === "DESC" ? "<" : ">";
    if (cursor) {
      rows = await query<Row>(
        `SELECT ${selectCols}
         ${fromSql}
         ${whereBase}
           AND (c.created_at, c.id::text) ${cmpOp} (
           SELECT created_at, id::text FROM conversations WHERE id = $4
         )
         ORDER BY c.created_at ${orderDir}
         LIMIT $5`,
        [spaceIdFilter, prefsUserId, statesFilter, cursor, limit + 1],
      );
    } else {
      rows = await query<Row>(
        `SELECT ${selectCols}
         ${fromSql}
         ${whereBase}
         ORDER BY c.created_at ${orderDir}
         LIMIT $4`,
        [spaceIdFilter, prefsUserId, statesFilter, limit + 1],
      );
    }
  } else {
    rows = await query<Row>(
      `SELECT ${selectCols}
       ${fromSql}
       ${whereBase}
       ORDER BY c.created_at ${orderDir}`,
      [spaceIdFilter, prefsUserId, statesFilter],
    );
  }

  const data = rows.map((r) => ({
    ...r,
    space_id: r.space_id ?? null,
    conversation_topology: (r.conversation_topology ?? "T1") as ConversationTopology,
    authorization_mode: (r.authorization_mode ?? "user_explicit") as AuthorizationMode,
    visibility_mode: (r.visibility_mode ?? "full") as VisibilityMode,
    risk_level: (r.risk_level ?? "low") as ConversationRiskLevel,
    pinned_at: r.pinned_at ?? null,
    starred: Boolean(r.starred),
  }));

  if (!usePagination) {
    return data as Conversation[];
  }
  const hasMore = rows.length > limit;
  const pageData = hasMore ? data.slice(0, limit) : data;
  const result: ListConversationsResult = { data: pageData as Conversation[] };
  if (hasMore && pageData.length > 0) {
    result.next_cursor = pageData[pageData.length - 1]!.id;
  }
  return result;
};

function listConversationsInMemory(
  all: Conversation[],
  opts?: ListConversationsOptions,
): ListConversationsResult {
  const sort = opts?.sort ?? "created_at:desc";
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  let list = [...all];
  if (sort === "created_at:asc") {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } else {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const cursor = opts?.cursor;
  if (cursor) {
    const idx = list.findIndex((c) => c.id === cursor);
    if (idx >= 0) {
      list = list.slice(idx + 1);
    }
  }
  const hasMore = list.length > limit;
  const data = hasMore ? list.slice(0, limit) : list;
  const result: ListConversationsResult = { data };
  if (hasMore && data.length > 0) {
    result.next_cursor = data[data.length - 1]!.id;
  }
  return result;
}

export const getConversationDetail = (
  conversationId: string,
): { conversation: Conversation; participants: Participant[]; messages: Message[] } | null => {
  const conversation = conversations.get(conversationId);

  if (!conversation) {
    return null;
  }

  const rawMsgs = messagesByConversation.get(conversationId) ?? [];
  return {
    conversation,
    participants: participantsByConversation.get(conversationId) ?? [],
    messages: rawMsgs.map((m) =>
      mapMessageForApi({ ...m, status: m.status ?? "delivered" }, Boolean(m.content_hidden)),
    ),
  };
};

export const getConversationDetailAsync = async (
  conversationId: string,
): Promise<{ conversation: Conversation; participants: Participant[]; messages: Message[] } | null> => {
  if (!isPostgresEnabled()) {
    return getConversationDetail(conversationId);
  }

  const conversationsRows = await query<
    Conversation & {
      conversation_topology?: string;
      authorization_mode?: string;
      visibility_mode?: string;
      risk_level?: string;
      space_id?: string | null;
    }
  >(
    `SELECT id, title, state, created_at::text, updated_at::text, space_id::text,
            COALESCE(conversation_topology, 'T1') AS conversation_topology,
            COALESCE(authorization_mode, 'user_explicit') AS authorization_mode,
            COALESCE(visibility_mode, 'full') AS visibility_mode,
            COALESCE(risk_level, 'low') AS risk_level
     FROM conversations
     WHERE id = $1`,
    [conversationId],
  );

  const row = conversationsRows[0];
  if (!row) {
    return null;
  }
  const conversation: Conversation = {
    ...row,
    space_id: row.space_id ?? null,
    conversation_topology: (row.conversation_topology ?? "T1") as ConversationTopology,
    authorization_mode: (row.authorization_mode ?? "user_explicit") as AuthorizationMode,
    visibility_mode: (row.visibility_mode ?? "full") as VisibilityMode,
    risk_level: (row.risk_level ?? "low") as ConversationRiskLevel,
  };

  const participants = await query<Participant>(
    `SELECT id, conversation_id, participant_type, participant_id, role, joined_at::text
     FROM participants
     WHERE conversation_id = $1
     ORDER BY joined_at ASC`,
    [conversationId],
  );

  const messageRows = await query<
    Message & { content: unknown; status?: string | null; content_hidden?: boolean | null }
  >(
    `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text,
            COALESCE(status, 'delivered') AS status,
            COALESCE(content_hidden, FALSE) AS content_hidden
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId],
  );
  const messages: Message[] = messageRows.map((m) => {
    const st = normalizeMessageStatus(m.status);
    const msg: Message = {
      id: m.id,
      conversation_id: m.conversation_id,
      sender_type: m.sender_type,
      sender_id: m.sender_id,
      content: m.content as Message["content"],
      created_at: m.created_at,
      status: st,
    };
    return mapMessageForApi(msg, Boolean(m.content_hidden));
  });

  return { conversation, participants, messages };
};

export async function getConversationSummaryAsync(
  conversationId: string,
): Promise<{ id: string; space_id: string | null; state: ConversationState } | null> {
  if (!isPostgresEnabled()) {
    const c = conversations.get(conversationId);
    return c ? { id: c.id, space_id: c.space_id ?? null, state: c.state } : null;
  }
  const rows = await query<{ id: string; space_id: string | null; state: ConversationState }>(
    `SELECT id, space_id::text, state FROM conversations WHERE id = $1`,
    [conversationId],
  );
  const r = rows[0];
  return r ? { id: r.id, space_id: r.space_id, state: r.state } : null;
}

export async function updateConversationAsync(
  conversationId: string,
  patch: { state?: ConversationState; title?: string },
): Promise<Conversation | null> {
  if (patch.state === undefined && patch.title === undefined) {
    return null;
  }
  if (!isPostgresEnabled()) {
    const c = conversations.get(conversationId);
    if (!c) {
      return null;
    }
    if (patch.state !== undefined) {
      c.state = patch.state;
    }
    if (patch.title !== undefined) {
      c.title = patch.title;
    }
    c.updated_at = nowIso();
    return c;
  }
  const sets: string[] = [];
  const vals: unknown[] = [];
  let n = 1;
  if (patch.title !== undefined) {
    sets.push(`title = $${n++}`);
    vals.push(patch.title);
  }
  if (patch.state !== undefined) {
    sets.push(`state = $${n++}`);
    vals.push(patch.state);
  }
  sets.push(`updated_at = $${n++}`);
  vals.push(nowIso());
  vals.push(conversationId);
  await query(`UPDATE conversations SET ${sets.join(", ")} WHERE id = $${n}`, vals);
  const rows = await query<
    Conversation & {
      conversation_topology?: string;
      authorization_mode?: string;
      visibility_mode?: string;
      risk_level?: string;
      space_id?: string | null;
    }
  >(
    `SELECT id, title, state, created_at::text, updated_at::text, space_id::text,
            COALESCE(conversation_topology, 'T1') AS conversation_topology,
            COALESCE(authorization_mode, 'user_explicit') AS authorization_mode,
            COALESCE(visibility_mode, 'full') AS visibility_mode,
            COALESCE(risk_level, 'low') AS risk_level
     FROM conversations WHERE id = $1`,
    [conversationId],
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    ...row,
    space_id: row.space_id ?? null,
    conversation_topology: (row.conversation_topology ?? "T1") as ConversationTopology,
    authorization_mode: (row.authorization_mode ?? "user_explicit") as AuthorizationMode,
    visibility_mode: (row.visibility_mode ?? "full") as VisibilityMode,
    risk_level: (row.risk_level ?? "low") as ConversationRiskLevel,
  };
}

export type ConversationUserPrefs = {
  pinned_at: string | null;
  starred: boolean;
};

export async function upsertConversationUserPrefsAsync(
  userId: string,
  conversationId: string,
  patch: { pinned?: boolean; starred?: boolean },
): Promise<ConversationUserPrefs> {
  if (!isPostgresEnabled()) {
    const key = `${userId}::${conversationId}`;
    if (patch.pinned === undefined && patch.starred === undefined) {
      return conversationUserPrefsInMemory.get(key) ?? { pinned_at: null, starred: false };
    }
    const cur = conversationUserPrefsInMemory.get(key) ?? { pinned_at: null, starred: false };
    if (patch.pinned === true) {
      cur.pinned_at = nowIso();
    }
    if (patch.pinned === false) {
      cur.pinned_at = null;
    }
    if (patch.starred !== undefined) {
      cur.starred = patch.starred;
    }
    conversationUserPrefsInMemory.set(key, cur);
    return cur;
  }
  if (patch.pinned === undefined && patch.starred === undefined) {
    const rows = await query<{ pinned_at: string | null; starred: boolean }>(
      `SELECT pinned_at::text, starred FROM conversation_user_prefs WHERE user_id = $1 AND conversation_id = $2`,
      [userId, conversationId],
    );
    return rows[0] ?? { pinned_at: null, starred: false };
  }
  const existing = await query<{ pinned_at: string | null; starred: boolean }>(
    `SELECT pinned_at::text, starred FROM conversation_user_prefs WHERE user_id = $1 AND conversation_id = $2`,
    [userId, conversationId],
  );
  let pinned_at = existing[0]?.pinned_at ?? null;
  let starred = existing[0]?.starred ?? false;
  if (patch.pinned === true) {
    pinned_at = nowIso();
  }
  if (patch.pinned === false) {
    pinned_at = null;
  }
  if (patch.starred !== undefined) {
    starred = patch.starred;
  }
  await query(
    `INSERT INTO conversation_user_prefs (user_id, conversation_id, pinned_at, starred)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, conversation_id) DO UPDATE SET
       pinned_at = EXCLUDED.pinned_at,
       starred = EXCLUDED.starred`,
    [userId, conversationId, pinned_at, starred],
  );
  return { pinned_at, starred };
}

export async function countUserParticipantsAsync(conversationId: string): Promise<number> {
  if (!isPostgresEnabled()) {
    const parts = participantsByConversation.get(conversationId) ?? [];
    return parts.filter((p) => p.participant_type === "user").length;
  }
  const rows = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM participants
     WHERE conversation_id = $1 AND participant_type = 'user'`,
    [conversationId],
  );
  return Number.parseInt(rows[0]?.c ?? "0", 10);
}

export async function conversationHasUserParticipantAsync(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  if (!isPostgresEnabled()) {
    const parts = participantsByConversation.get(conversationId) ?? [];
    return parts.some((p) => p.participant_type === "user" && p.participant_id === userId);
  }
  const rows = await query<{ one: number }>(
    `SELECT 1 AS one FROM participants
     WHERE conversation_id = $1 AND participant_type = 'user' AND participant_id = $2`,
    [conversationId, userId],
  );
  return rows.length > 0;
}

export async function conversationHasAgentParticipantAsync(
  conversationId: string,
  agentId: string,
): Promise<boolean> {
  if (!isPostgresEnabled()) {
    const parts = participantsByConversation.get(conversationId) ?? [];
    return parts.some((p) => p.participant_type === "agent" && p.participant_id === agentId);
  }
  const rows = await query<{ one: number }>(
    `SELECT 1 AS one FROM participants
     WHERE conversation_id = $1 AND participant_type = 'agent' AND participant_id = $2`,
    [conversationId, agentId],
  );
  return rows.length > 0;
}

export const addParticipant = (input: AddParticipantInput): Participant | null => {
  const conversation = conversations.get(input.conversationId);

  if (!conversation) {
    return null;
  }

  const participant: Participant = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    participant_type: input.participantType,
    participant_id: input.participantId,
    role: input.role,
    joined_at: nowIso(),
  };

  const existingParticipants = participantsByConversation.get(input.conversationId) ?? [];
  participantsByConversation.set(input.conversationId, [...existingParticipants, participant]);

  conversation.updated_at = nowIso();

  return participant;
};

export const addParticipantAsync = async (input: AddParticipantInput): Promise<Participant | null> => {
  if (!isPostgresEnabled()) {
    return addParticipant(input);
  }

  const conversationRows = await query<Conversation>(
    `SELECT id, title, state, created_at::text, updated_at::text
     FROM conversations
     WHERE id = $1`,
    [input.conversationId],
  );

  if (!conversationRows[0]) {
    return null;
  }

  const participant: Participant = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    participant_type: input.participantType,
    participant_id: input.participantId,
    role: input.role,
    joined_at: nowIso(),
  };

  await query(
    `INSERT INTO participants (id, conversation_id, participant_type, participant_id, role, joined_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      participant.id,
      participant.conversation_id,
      participant.participant_type,
      participant.participant_id,
      participant.role,
      participant.joined_at,
    ],
  );

  await query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [input.conversationId, nowIso()]);

  return participant;
};

export const appendMessage = (input: AppendMessageInput): Message | null => {
  const conversation = conversations.get(input.conversationId);

  if (!conversation) {
    return null;
  }

  const message: Message = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    sender_type: input.senderType,
    sender_id: input.senderId,
    content: {
      type: "text",
      text: input.text,
      thread_id: input.threadId,
      mentions: input.mentions,
      ...(input.fileRefId ? { file_ref_id: input.fileRefId } : {}),
    },
    created_at: nowIso(),
    status: input.status ?? "delivered",
  };

  const existingMessages = messagesByConversation.get(input.conversationId) ?? [];
  messagesByConversation.set(input.conversationId, [...existingMessages, message]);

  conversation.updated_at = nowIso();

  return message;
};

export const appendMessageAsync = async (input: AppendMessageInput): Promise<Message | null> => {
  if (!isPostgresEnabled()) {
    return appendMessage(input);
  }

  const conversationRows = await query<Conversation>(
    `SELECT id, title, state, created_at::text, updated_at::text
     FROM conversations
     WHERE id = $1`,
    [input.conversationId],
  );

  if (!conversationRows[0]) {
    return null;
  }

  const message: Message = {
    id: randomUUID(),
    conversation_id: input.conversationId,
    sender_type: input.senderType,
    sender_id: input.senderId,
    content: {
      type: "text",
      text: input.text,
      thread_id: input.threadId,
      mentions: input.mentions,
      ...(input.fileRefId ? { file_ref_id: input.fileRefId } : {}),
    },
    created_at: nowIso(),
    status: input.status ?? "delivered",
  };

  await query(
    `INSERT INTO messages (id, conversation_id, sender_type, sender_id, content, created_at, status)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
    [
      message.id,
      message.conversation_id,
      message.sender_type,
      message.sender_id,
      JSON.stringify(message.content),
      message.created_at,
      message.status,
    ],
  );

  await query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [input.conversationId, nowIso()]);

  if (input.senderType === "user") {
    void recordUserMessageSentProductEventAsync({
      userId: input.senderId,
      conversationId: input.conversationId,
    });
  }

  return message;
};

export const deleteConversation = (conversationId: string): boolean => {
  if (!conversations.has(conversationId)) {
    return false;
  }
  conversations.delete(conversationId);
  participantsByConversation.delete(conversationId);
  messagesByConversation.delete(conversationId);
  const suffix = `::${conversationId}`;
  for (const key of [...conversationUserPrefsInMemory.keys()]) {
    if (key.endsWith(suffix)) {
      conversationUserPrefsInMemory.delete(key);
    }
  }
  return true;
};

export const deleteConversationAsync = async (conversationId: string): Promise<boolean> => {
  if (!isPostgresEnabled()) {
    return deleteConversation(conversationId);
  }
  const result = await query<{ id: string }>(
    `DELETE FROM conversations WHERE id = $1 RETURNING id`,
    [conversationId],
  );
  return result.length > 0;
};

export type ListMessagesSort = "created_at:desc" | "created_at:asc";

export interface ListMessagesOptions {
  limit?: number;
  cursor?: string;
  sort?: ListMessagesSort;
}

export interface ListMessagesResult {
  data: Message[];
  next_cursor?: string;
}

export const listMessagesAsync = async (
  conversationId: string,
  opts?: ListMessagesOptions,
): Promise<ListMessagesResult | null> => {
  if (!isPostgresEnabled()) {
    const list = messagesByConversation.get(conversationId) ?? [];
    if (!conversations.has(conversationId)) {
      return null;
    }
    const sort = opts?.sort ?? "created_at:desc";
    const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
    let ordered = [...list];
    ordered.sort((a, b) =>
      sort === "created_at:asc"
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
    );
    if (opts?.cursor) {
      const idx = ordered.findIndex((m) => m.id === opts!.cursor);
      if (idx >= 0) ordered = ordered.slice(idx + 1);
    }
    const hasMore = ordered.length > limit;
    const slice = hasMore ? ordered.slice(0, limit) : ordered;
    const data: Message[] = slice.map((m) =>
      mapMessageForApi({ ...m, status: m.status ?? "delivered" }, Boolean(m.content_hidden)),
    );
    const result: ListMessagesResult = { data };
    if (hasMore && data.length > 0) result.next_cursor = data[data.length - 1]!.id;
    return result;
  }

  const convExists = await query(
    `SELECT id FROM conversations WHERE id = $1`,
    [conversationId],
  );
  if (convExists.length === 0) {
    return null;
  }

  const limit = Math.min(Math.max(opts?.limit ?? 20, 1), 100);
  const sort = opts?.sort ?? "created_at:desc";
  const orderDir = sort === "created_at:asc" ? "ASC" : "DESC";
  const cursor = opts?.cursor?.trim();

  type MsgRow = Message & { content: unknown; status?: string | null; content_hidden?: boolean | null };
  const cmpOp = orderDir === "DESC" ? "<" : ">";
  let rows: MsgRow[];
  if (cursor) {
    rows = await query<MsgRow>(
      `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text,
              COALESCE(status, 'delivered') AS status,
              COALESCE(content_hidden, FALSE) AS content_hidden
       FROM messages
       WHERE conversation_id = $1 AND (created_at, id::text) ${cmpOp} (
         SELECT created_at, id::text FROM messages WHERE id = $2 AND conversation_id = $1
       )
       ORDER BY created_at ${orderDir}
       LIMIT $3`,
      [conversationId, cursor, limit + 1],
    );
  } else {
    rows = await query<MsgRow>(
      `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text,
              COALESCE(status, 'delivered') AS status,
              COALESCE(content_hidden, FALSE) AS content_hidden
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ${orderDir}
       LIMIT $2`,
      [conversationId, limit + 1],
    );
  }

  const hasMore = rows.length > limit;
  const data: Message[] = (hasMore ? rows.slice(0, limit) : rows).map((r) => {
    const st = normalizeMessageStatus(r.status);
    const hidden = Boolean(r.content_hidden);
    const msg: Message = {
      id: r.id,
      conversation_id: r.conversation_id,
      sender_type: r.sender_type,
      sender_id: r.sender_id,
      content: r.content as Message["content"],
      created_at: r.created_at,
      status: st,
    };
    return mapMessageForApi(msg, hidden);
  });
  const result: ListMessagesResult = { data };
  if (hasMore && data.length > 0) {
    result.next_cursor = data[data.length - 1]!.id;
  }
  return result;
};

const MAX_REPLAY_MESSAGES = 500;

/** E-3: messages strictly after `afterMessageId` (by `created_at`), ordered oldest-first for WS replay. */
export async function listMessagesAfterMessageIdAsync(
  conversationId: string,
  afterMessageId?: string,
): Promise<Message[] | null> {
  if (!isPostgresEnabled()) {
    if (!conversations.has(conversationId)) {
      return null;
    }
    const list = messagesByConversation.get(conversationId) ?? [];
    if (!afterMessageId) {
      return [];
    }
    const idx = list.findIndex((m) => m.id === afterMessageId);
    if (idx < 0) {
      return [];
    }
    return list.slice(idx + 1).map((m) =>
      mapMessageForApi({ ...m, status: m.status ?? "delivered" }, Boolean(m.content_hidden)),
    );
  }

  const convExists = await query(`SELECT id FROM conversations WHERE id = $1`, [conversationId]);
  if (convExists.length === 0) {
    return null;
  }

  type MsgRow = Message & { content: unknown; status?: string | null; content_hidden?: boolean | null };
  const anchor = afterMessageId?.trim() || null;
  const rows = await query<MsgRow>(
    `SELECT id, conversation_id, sender_type, sender_id, content, created_at::text,
            COALESCE(status, 'delivered') AS status,
            COALESCE(content_hidden, FALSE) AS content_hidden
     FROM messages
     WHERE conversation_id = $1
       AND (
         $2::text IS NULL OR $2::text = ''
         OR created_at > (
           SELECT created_at FROM messages WHERE id::text = $2 AND conversation_id = $1 LIMIT 1
         )
       )
     ORDER BY created_at ASC
     LIMIT $3`,
    [conversationId, anchor, MAX_REPLAY_MESSAGES],
  );

  return rows.map((r) => {
    const st = normalizeMessageStatus(r.status);
    const msg: Message = {
      id: r.id,
      conversation_id: r.conversation_id,
      sender_type: r.sender_type,
      sender_id: r.sender_id,
      content: r.content as Message["content"],
      created_at: r.created_at,
      status: st,
    };
    return mapMessageForApi(msg, Boolean(r.content_hidden));
  });
}

/** E-12: locate message → conversation in in-memory store (no PG). */
export function findMessageConversationIdInMemory(messageId: string): string | null {
  for (const [cid, list] of messagesByConversation.entries()) {
    if (list.some((m) => m.id === messageId)) {
      return cid;
    }
  }
  return null;
}

/** E-18: in-memory moderation helpers. */
export function findMessageInMemory(messageId: string): { message: Message; conversationId: string } | null {
  for (const [cid, list] of messagesByConversation.entries()) {
    const m = list.find((x) => x.id === messageId);
    if (m) {
      return { message: m, conversationId: cid };
    }
  }
  return null;
}

export function setMessageContentHiddenInMemory(messageId: string): boolean {
  const hit = findMessageInMemory(messageId);
  if (!hit) {
    return false;
  }
  hit.message.content_hidden = true;
  return true;
}

const MODERATION_HIDDEN_PLACEHOLDER = "[该消息已被管理员隐藏]";

function mapMessageForApi(m: Message, contentHidden: boolean): Message {
  const { content_hidden: _ch, ...base } = m;
  if (!contentHidden) {
    return {
      ...base,
      status: base.status ?? "delivered",
    };
  }
  return {
    ...base,
    content: { type: "text", text: MODERATION_HIDDEN_PLACEHOLDER },
    status: base.status ?? "delivered",
  };
}

export const resetConversationStore = (): void => {
  conversations.clear();
  participantsByConversation.clear();
  messagesByConversation.clear();
  conversationUserPrefsInMemory.clear();
};
