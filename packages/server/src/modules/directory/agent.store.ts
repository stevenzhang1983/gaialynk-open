import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";
import { notifyAgentLifecycleChangeAsync } from "../notifications/notification-triggers";

export interface AgentCapability {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

export type HealthCheckStatus = "ok" | "failed" | "pending";

export type QueueBehavior = "queue" | "fast_fail";

export type MemoryTier = "none" | "session" | "user_isolated";

/** E-15: directory / gateway listing lifecycle (distinct from `status` deprecated/active). */
export type AgentListingStatus = "listed" | "maintenance" | "delisted";

export interface AgentChangelogEntry {
  version: string;
  summary: string;
  breaking: boolean;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
  source_origin?: "official" | "self_hosted" | "connected_node" | "vendor";
  node_id?: string;
  status?: "active" | "deprecated" | "pending_review";
  created_at: string;
  /** Set when registered via Provider API (T-5.4) */
  owner_id?: string;
  health_check_status?: HealthCheckStatus;
  health_check_at?: string;
  health_check_error?: string;
  /** E-7: gateway / listing (defaults: 1 concurrent, queue) */
  max_concurrent?: number;
  queue_behavior?: QueueBehavior;
  timeout_ms?: number | null;
  supports_scheduled?: boolean;
  memory_tier?: MemoryTier;
  /** E-15 */
  current_version?: string;
  changelog?: AgentChangelogEntry[];
  listing_status?: AgentListingStatus;
}

interface RegisterAgentInput {
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
  source_origin?: "official" | "self_hosted" | "connected_node" | "vendor";
  node_id?: string;
  status?: "active" | "deprecated" | "pending_review";
}

/** Input for Provider registering an agent; source_origin/status are set by server */
export interface RegisterAgentByProviderInput {
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[];
}

const agents = new Map<string, Agent>();

const AGENT_SELECT_COLUMNS = `id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at::text,
    owner_id, health_check_status, health_check_at::text, health_check_error,
    max_concurrent, queue_behavior, timeout_ms, supports_scheduled, memory_tier,
    current_version, changelog, listing_status`;

type AgentRow = {
  id: string;
  name: string;
  description: string;
  agent_type: "logical" | "execution";
  source_url: string;
  capabilities: AgentCapability[] | string;
  source_origin?: "official" | "self_hosted" | "connected_node" | "vendor";
  node_id?: string;
  status?: "active" | "deprecated" | "pending_review";
  created_at: string;
  owner_id?: string;
  health_check_status?: HealthCheckStatus;
  health_check_at?: string;
  health_check_error?: string;
  max_concurrent?: number | string | null;
  queue_behavior?: string | null;
  timeout_ms?: number | string | null;
  supports_scheduled?: boolean | null;
  memory_tier?: string | null;
  current_version?: string | null;
  changelog?: unknown;
  listing_status?: string | null;
};

const parseListingStatus = (raw: unknown): AgentListingStatus => {
  if (raw === "maintenance" || raw === "delisted" || raw === "listed") return raw;
  return "listed";
};

export const parseAgentChangelog = (raw: unknown): AgentChangelogEntry[] => {
  if (raw == null) return [];
  let arr: unknown[] = [];
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw) as unknown[];
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    arr = raw;
  } else {
    return [];
  }
  const out: AgentChangelogEntry[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const version = typeof o.version === "string" ? o.version : "";
    const summary = typeof o.summary === "string" ? o.summary : "";
    const breaking = Boolean(o.breaking);
    const created_at =
      typeof o.created_at === "string" ? o.created_at : new Date().toISOString();
    if (version && summary) {
      out.push({ version, summary, breaking, created_at });
    }
  }
  return out;
};

const normalizeAgentRow = (row: AgentRow): Agent => {
  const qb = row.queue_behavior === "fast_fail" || row.queue_behavior === "queue" ? row.queue_behavior : "queue";
  const mt =
    row.memory_tier === "none" || row.memory_tier === "session" || row.memory_tier === "user_isolated"
      ? row.memory_tier
      : "none";
  const mc =
    row.max_concurrent != null && row.max_concurrent !== ""
      ? Number(row.max_concurrent)
      : undefined;
  const to =
    row.timeout_ms != null && row.timeout_ms !== "" ? Number(row.timeout_ms) : undefined;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    agent_type: row.agent_type,
    source_url: row.source_url,
    capabilities: typeof row.capabilities === "string" ? (JSON.parse(row.capabilities) as AgentCapability[]) : row.capabilities,
    source_origin: row.source_origin,
    node_id: row.node_id,
    status: row.status,
    created_at: row.created_at,
    owner_id: row.owner_id ?? undefined,
    health_check_status: row.health_check_status ?? undefined,
    health_check_at: row.health_check_at ?? undefined,
    health_check_error: row.health_check_error ?? undefined,
    max_concurrent: Number.isFinite(mc) && mc! >= 1 ? mc : 1,
    queue_behavior: qb,
    timeout_ms: to !== undefined && Number.isFinite(to) ? to : null,
    supports_scheduled: Boolean(row.supports_scheduled),
    memory_tier: mt,
    current_version:
      typeof row.current_version === "string" && row.current_version.length > 0
        ? row.current_version
        : "1.0.0",
    changelog: parseAgentChangelog(row.changelog),
    listing_status: parseListingStatus(row.listing_status),
  };
};

export const registerAgent = (input: RegisterAgentInput): Agent => {
  if (isPostgresEnabled()) {
    throw new Error("Use registerAgentAsync in PostgreSQL mode");
  }

  const agent: Agent = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    agent_type: input.agent_type,
    source_url: input.source_url,
    capabilities: input.capabilities,
    source_origin: input.source_origin ?? "official",
    node_id: input.node_id,
    status: input.status ?? "active",
    created_at: new Date().toISOString(),
    max_concurrent: 1,
    queue_behavior: "queue",
    timeout_ms: null,
    supports_scheduled: false,
    memory_tier: "none",
    current_version: "1.0.0",
    changelog: [],
    listing_status: "listed",
  };

  agents.set(agent.id, agent);

  return agent;
};

export const registerAgentAsync = async (input: RegisterAgentInput): Promise<Agent> => {
  if (!isPostgresEnabled()) {
    return registerAgent(input);
  }

  const agent: Agent = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    agent_type: input.agent_type,
    source_url: input.source_url,
    capabilities: input.capabilities,
    source_origin: input.source_origin ?? "official",
    node_id: input.node_id,
    status: input.status ?? "active",
    created_at: new Date().toISOString(),
    max_concurrent: 1,
    queue_behavior: "queue",
    timeout_ms: null,
    supports_scheduled: false,
    memory_tier: "none",
    current_version: "1.0.0",
    changelog: [],
    listing_status: "listed",
  };

  await query(
    `INSERT INTO agents (id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)`,
    [
      agent.id,
      agent.name,
      agent.description,
      agent.agent_type,
      agent.source_url,
      JSON.stringify(agent.capabilities),
      agent.source_origin ?? "official",
      agent.node_id ?? null,
      agent.status ?? "active",
      agent.created_at,
    ],
  );

  return agent;
};

/** Register agent by Provider; sets source_origin=self_hosted, status=pending_review. */
export const registerAgentByProviderAsync = async (
  ownerId: string,
  input: RegisterAgentByProviderInput,
): Promise<Agent> => {
  if (!isPostgresEnabled()) {
    const agent = registerAgent({
      ...input,
      source_origin: "self_hosted",
      status: "pending_review",
    });
    const withOwner = { ...agent, owner_id: ownerId };
    agents.set(agent.id, withOwner);
    return withOwner;
  }

  const agent: Agent = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    agent_type: input.agent_type,
    source_url: input.source_url,
    capabilities: input.capabilities,
    source_origin: "self_hosted",
    node_id: undefined,
    status: "pending_review",
    created_at: new Date().toISOString(),
    owner_id: ownerId,
    max_concurrent: 1,
    queue_behavior: "queue",
    timeout_ms: null,
    supports_scheduled: false,
    memory_tier: "none",
    current_version: "1.0.0",
    changelog: [],
    listing_status: "listed",
  };

  await query(
    `INSERT INTO agents (id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)`,
    [
      agent.id,
      agent.name,
      agent.description,
      agent.agent_type,
      agent.source_url,
      JSON.stringify(agent.capabilities),
      agent.source_origin,
      null,
      agent.status,
      agent.created_at,
      ownerId,
    ],
  );

  return agent;
};

export const getAgentById = (agentId: string): Agent | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use getAgentByIdAsync in PostgreSQL mode");
  }

  return agents.get(agentId) ?? null;
};

export const getAgentByIdAsync = async (agentId: string): Promise<Agent | null> => {
  if (!isPostgresEnabled()) {
    return getAgentById(agentId);
  }

  const rows = await query<AgentRow>(
    `SELECT ${AGENT_SELECT_COLUMNS}
     FROM agents
     WHERE id = $1`,
    [agentId],
  );

  const row = rows[0];
  return row ? normalizeAgentRow(row) : null;
};

export const listAgents = (): Agent[] => {
  if (isPostgresEnabled()) {
    throw new Error("Use listAgentsAsync in PostgreSQL mode");
  }

  return [...agents.values()];
};

export type ListAgentsSort = "created_at:desc" | "created_at:asc";

export interface ListAgentsOptions {
  limit?: number;
  cursor?: string;
  sort?: ListAgentsSort;
  /** Keyword fuzzy match on name and description (ILIKE %q%) */
  search?: string;
  status?: "active" | "deprecated" | "pending_review";
  source_origin?: "official" | "self_hosted" | "connected_node" | "vendor";
  agent_type?: "logical" | "execution";
}

export interface ListAgentsResult {
  data: Agent[];
  next_cursor?: string;
}

/** Normalize listAgentsAsync result to Agent[] (plain list or paginated envelope). */
export function agentsListAsArray(result: Agent[] | ListAgentsResult): Agent[] {
  return Array.isArray(result) ? result : result.data;
}

export const listAgentsAsync = async (
  opts?: ListAgentsOptions,
): Promise<Agent[] | ListAgentsResult> => {
  if (!isPostgresEnabled()) {
    const all = listAgents();
    if (!opts?.limit && !opts?.cursor && !opts?.search && !opts?.status && !opts?.source_origin && !opts?.agent_type && !opts?.sort) {
      return all;
    }
    return listAgentsInMemory(all, opts);
  }

  const selectCols = AGENT_SELECT_COLUMNS;
  const usePagination = opts?.limit != null || opts?.cursor != null;
  const limit = usePagination ? Math.min(Math.max(opts?.limit ?? 50, 1), 100) : 0;
  const sort = opts?.sort ?? "created_at:desc";
  const orderDir = sort === "created_at:asc" ? "ASC" : "DESC";
  const cursor = opts?.cursor?.trim();
  const search = opts?.search?.trim();
  const conditions: string[] = ["1=1"];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (search && search.length > 0) {
    conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    values.push(`%${search}%`);
    paramIndex += 1;
  }
  if (opts?.status) {
    conditions.push(`status = $${paramIndex}`);
    values.push(opts.status);
    paramIndex += 1;
  }
  if (opts?.source_origin) {
    conditions.push(`source_origin = $${paramIndex}`);
    values.push(opts.source_origin);
    paramIndex += 1;
  }
  if (opts?.agent_type) {
    conditions.push(`agent_type = $${paramIndex}`);
    values.push(opts.agent_type);
    paramIndex += 1;
  }

  const whereClause = conditions.join(" AND ");

  let rows: AgentRow[];
  if (usePagination) {
    const cmpOp = orderDir === "DESC" ? "<" : ">";
    if (cursor) {
      rows = await query<AgentRow>(
        `SELECT ${selectCols}
         FROM agents
         WHERE ${whereClause} AND (created_at, id::text) ${cmpOp} (
           SELECT created_at, id::text FROM agents WHERE id = $${paramIndex}
         )
         ORDER BY created_at ${orderDir}
         LIMIT $${paramIndex + 1}`,
        [...values, cursor, limit + 1],
      );
    } else {
      rows = await query<AgentRow>(
        `SELECT ${selectCols}
         FROM agents
         WHERE ${whereClause}
         ORDER BY created_at ${orderDir}
         LIMIT $${paramIndex}`,
        [...values, limit + 1],
      );
    }
  } else {
    rows = await query<AgentRow>(
      `SELECT ${selectCols}
       FROM agents
       WHERE ${whereClause}
       ORDER BY created_at ${orderDir}`,
      values,
    );
  }

  const data = rows.map(normalizeAgentRow);

  if (!usePagination) {
    return data;
  }
  const hasMore = rows.length > limit;
  const pageData = hasMore ? data.slice(0, limit) : data;
  const result: ListAgentsResult = { data: pageData };
  if (hasMore && pageData.length > 0) {
    result.next_cursor = pageData[pageData.length - 1]!.id;
  }
  return result;
};

function listAgentsInMemory(all: Agent[], opts?: ListAgentsOptions): ListAgentsResult {
  let list = [...all];
  const search = opts?.search?.trim().toLowerCase();
  if (search) {
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(search) || a.description.toLowerCase().includes(search),
    );
  }
  if (opts?.status) list = list.filter((a) => a.status === opts.status);
  if (opts?.source_origin) list = list.filter((a) => a.source_origin === opts.source_origin);
  if (opts?.agent_type) list = list.filter((a) => a.agent_type === opts.agent_type);
  const sort = opts?.sort ?? "created_at:desc";
  list.sort((a, b) =>
    sort === "created_at:asc"
      ? a.created_at.localeCompare(b.created_at)
      : b.created_at.localeCompare(a.created_at),
  );
  const limit = Math.min(Math.max(opts?.limit ?? 50, 1), 100);
  if (opts?.cursor) {
    const idx = list.findIndex((a) => a.id === opts!.cursor);
    if (idx >= 0) list = list.slice(idx + 1);
  }
  const hasMore = list.length > limit;
  const data = hasMore ? list.slice(0, limit) : list;
  const result: ListAgentsResult = { data };
  if (hasMore && data.length > 0) result.next_cursor = data[data.length - 1]!.id;
  return result;
}

export const resetAgentStore = (): void => {
  agents.clear();
};

export const upsertAgentFromNodeAsync = async (
  nodeId: string,
  input: RegisterAgentInput,
): Promise<Agent> => {
  if (!isPostgresEnabled()) {
    const existing = [...agents.values()].find(
      (agent) => agent.node_id === nodeId && agent.source_url === input.source_url,
    );
    if (existing) {
      const updated: Agent = {
        ...existing,
        name: input.name,
        description: input.description,
        agent_type: input.agent_type,
        capabilities: input.capabilities,
        source_origin: "connected_node",
        node_id: nodeId,
        status: input.status ?? "active",
      };
      agents.set(updated.id, updated);
      return updated;
    }

    return registerAgent({
      ...input,
      source_origin: "connected_node",
      node_id: nodeId,
      status: input.status ?? "active",
    });
  }

  const rows = await query<AgentRow>(
    `SELECT ${AGENT_SELECT_COLUMNS}
     FROM agents
     WHERE node_id = $1 AND source_url = $2
     LIMIT 1`,
    [nodeId, input.source_url],
  );

  const existing = rows[0];
  if (existing) {
    await query(
      `UPDATE agents
       SET name = $2, description = $3, agent_type = $4, capabilities = $5::jsonb, source_origin = $6, status = $7
       WHERE id = $1`,
      [
        existing.id,
        input.name,
        input.description,
        input.agent_type,
        JSON.stringify(input.capabilities),
        "connected_node",
        input.status ?? "active",
      ],
    );

    return {
      ...normalizeAgentRow(existing),
      name: input.name,
      description: input.description,
      agent_type: input.agent_type,
      capabilities: input.capabilities,
      source_origin: "connected_node",
      node_id: nodeId,
      status: input.status ?? "active",
    };
  }

  return registerAgentAsync({
    ...input,
    source_origin: "connected_node",
    node_id: nodeId,
    status: input.status ?? "active",
  });
};

/** List agents owned by the given Provider (T-5.4 GET /api/v1/agents/mine). */
export const listAgentsByOwnerAsync = async (ownerId: string): Promise<Agent[]> => {
  if (!isPostgresEnabled()) {
    return [...agents.values()].filter((a) => (a as Agent & { owner_id?: string }).owner_id === ownerId);
  }
  const rows = await query<AgentRow>(
    `SELECT ${AGENT_SELECT_COLUMNS}
     FROM agents
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId],
  );
  return rows.map(normalizeAgentRow);
};

/** Return owner_id of agent or null if not found / no owner (T-5.4 authz). */
export const getAgentOwnerIdAsync = async (agentId: string): Promise<string | null> => {
  if (!isPostgresEnabled()) {
    const a = agents.get(agentId) as (Agent & { owner_id?: string }) | undefined;
    return a?.owner_id ?? null;
  }
  const rows = await query<{ owner_id: string | null }>(
    `SELECT owner_id FROM agents WHERE id = $1`,
    [agentId],
  );
  const row = rows[0];
  return row?.owner_id ?? null;
};

/** Write health check result for an agent (T-5.4 POST .../health-check). */
export const updateAgentHealthCheckAsync = async (
  agentId: string,
  status: "ok" | "failed",
  error?: string,
): Promise<void> => {
  if (!isPostgresEnabled()) {
    const a = agents.get(agentId);
    if (a) {
      (a as Agent & { health_check_status?: HealthCheckStatus; health_check_at?: string; health_check_error?: string }).health_check_status = status;
      (a as Agent & { health_check_at?: string }).health_check_at = new Date().toISOString();
      (a as Agent & { health_check_error?: string }).health_check_error = error;
    }
    return;
  }
  await query(
    `UPDATE agents SET health_check_status = $2, health_check_at = NOW(), health_check_error = $3 WHERE id = $1`,
    [agentId, status, error ?? null],
  );
};

/** E-7: Provider-owned listing / gateway fields (full snapshot after merge). */
export interface AgentGatewayListingSnapshot {
  max_concurrent: number;
  queue_behavior: QueueBehavior;
  timeout_ms: number | null;
  supports_scheduled: boolean;
  memory_tier: MemoryTier;
}

export const updateAgentGatewayListingAsync = async (
  agentId: string,
  ownerId: string,
  snapshot: AgentGatewayListingSnapshot,
): Promise<Agent | null> => {
  if (!isPostgresEnabled()) {
    const a = agents.get(agentId);
    if (!a || (a as Agent & { owner_id?: string }).owner_id !== ownerId) {
      return null;
    }
    a.max_concurrent = snapshot.max_concurrent;
    a.queue_behavior = snapshot.queue_behavior;
    a.timeout_ms = snapshot.timeout_ms;
    a.supports_scheduled = snapshot.supports_scheduled;
    a.memory_tier = snapshot.memory_tier;
    return a;
  }

  const rows = await query<AgentRow>(
    `UPDATE agents SET
       max_concurrent = $3,
       queue_behavior = $4,
       timeout_ms = $5,
       supports_scheduled = $6,
       memory_tier = $7
     WHERE id = $1::uuid AND owner_id = $2
     RETURNING ${AGENT_SELECT_COLUMNS}`,
    [
      agentId,
      ownerId,
      snapshot.max_concurrent,
      snapshot.queue_behavior,
      snapshot.timeout_ms,
      snapshot.supports_scheduled,
      snapshot.memory_tier,
    ],
  );

  const row = rows[0];
  return row ? normalizeAgentRow(row) : null;
};

/** Set agent status (T-5.4 submit-review: pending_review → active). */
export const setAgentStatusAsync = async (
  agentId: string,
  status: "active" | "deprecated" | "pending_review",
): Promise<boolean> => {
  if (!isPostgresEnabled()) {
    const a = agents.get(agentId);
    if (!a) return false;
    a.status = status;
    return true;
  }
  const result = await query(
    `UPDATE agents SET status = $2 WHERE id = $1`,
    [agentId, status],
  );
  return result.length > 0;
};

/** E-15: current listing gate for gateway (null if agent removed). */
export const getAgentListingStatusForGatewayAsync = async (
  agentId: string,
): Promise<AgentListingStatus | null> => {
  const a = await getAgentByIdAsync(agentId);
  if (!a) return null;
  return a.listing_status ?? "listed";
};

function notifyListingChange(
  agentId: string,
  agentName: string,
  changeKind: "version_updated" | "listing_maintenance" | "listing_listed" | "listing_delisted",
  version?: string,
  summary?: string,
): void {
  void notifyAgentLifecycleChangeAsync({
    agentId,
    agentName,
    changeKind,
    version,
    summary,
  }).catch((err: unknown) => {
    console.error("[agent.store] notifyAgentLifecycleChangeAsync failed", err);
  });
}

/** E-15: Provider bumps published version + changelog (owner-only). */
export const updateAgentVersionByOwnerAsync = async (
  ownerId: string,
  agentId: string,
  input: { version: string; summary: string; breaking?: boolean },
): Promise<Agent | null> => {
  const entry: AgentChangelogEntry = {
    version: input.version,
    summary: input.summary,
    breaking: Boolean(input.breaking),
    created_at: new Date().toISOString(),
  };
  if (!isPostgresEnabled()) {
    const a = agents.get(agentId);
    if (!a || (a as Agent & { owner_id?: string }).owner_id !== ownerId) {
      return null;
    }
    const changelog = [...(a.changelog ?? []), entry];
    a.current_version = input.version;
    a.changelog = changelog;
    notifyListingChange(a.id, a.name, "version_updated", input.version, input.summary);
    return { ...a };
  }
  const current = await getAgentByIdAsync(agentId);
  if (!current || current.owner_id !== ownerId) {
    return null;
  }
  const changelog = [...(current.changelog ?? []), entry];
  const rows = await query<AgentRow>(
    `UPDATE agents SET current_version = $3, changelog = $4::jsonb
     WHERE id = $1::uuid AND owner_id = $2
     RETURNING ${AGENT_SELECT_COLUMNS}`,
    [agentId, ownerId, input.version, JSON.stringify(changelog)],
  );
  const row = rows[0];
  if (!row) return null;
  const updated = normalizeAgentRow(row);
  notifyListingChange(updated.id, updated.name, "version_updated", input.version, input.summary);
  return updated;
};

/** CTO E-15 alias */
export const updateAgentVersionAsync = updateAgentVersionByOwnerAsync;

/** E-15: Provider sets listing_status (listed | maintenance | delisted). */
export const setAgentListingStatusByOwnerAsync = async (
  ownerId: string,
  agentId: string,
  listingStatus: AgentListingStatus,
): Promise<Agent | null> => {
  if (!isPostgresEnabled()) {
    const a = agents.get(agentId);
    if (!a || (a as Agent & { owner_id?: string }).owner_id !== ownerId) {
      return null;
    }
    const prev = a.listing_status ?? "listed";
    if (prev === listingStatus) {
      return { ...a };
    }
    a.listing_status = listingStatus;
    const changeKind =
      listingStatus === "maintenance"
        ? "listing_maintenance"
        : listingStatus === "delisted"
          ? "listing_delisted"
          : "listing_listed";
    notifyListingChange(a.id, a.name, changeKind);
    return { ...a };
  }
  const current = await getAgentByIdAsync(agentId);
  if (!current || current.owner_id !== ownerId) {
    return null;
  }
  const prev = current.listing_status ?? "listed";
  if (prev === listingStatus) {
    return current;
  }
  const rows = await query<AgentRow>(
    `UPDATE agents SET listing_status = $3
     WHERE id = $1::uuid AND owner_id = $2
     RETURNING ${AGENT_SELECT_COLUMNS}`,
    [agentId, ownerId, listingStatus],
  );
  const row = rows[0];
  if (!row) return null;
  const updated = normalizeAgentRow(row);
  const changeKind =
    listingStatus === "maintenance"
      ? "listing_maintenance"
      : listingStatus === "delisted"
        ? "listing_delisted"
        : "listing_listed";
  notifyListingChange(updated.id, updated.name, changeKind);
  return updated;
};

/** CTO E-15: toggle maintenance vs listed (not for delisted — use setAgentListingStatusByOwnerAsync). */
export const setMaintenanceModeAsync = async (
  ownerId: string,
  agentId: string,
  enabled: boolean,
): Promise<Agent | null> =>
  setAgentListingStatusByOwnerAsync(ownerId, agentId, enabled ? "maintenance" : "listed");
