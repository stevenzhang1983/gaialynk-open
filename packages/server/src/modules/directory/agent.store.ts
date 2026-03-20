import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface AgentCapability {
  name: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

export type HealthCheckStatus = "ok" | "failed" | "pending";

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
};

const normalizeAgentRow = (row: AgentRow): Agent => {
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
    `SELECT id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at::text,
            owner_id, health_check_status, health_check_at::text, health_check_error
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

  const selectCols = `id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at::text,
    owner_id, health_check_status, health_check_at::text, health_check_error`;
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
    `SELECT id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at::text,
            owner_id, health_check_status, health_check_at::text, health_check_error
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
    `SELECT id, name, description, agent_type, source_url, capabilities, source_origin, node_id, status, created_at::text,
            owner_id, health_check_status, health_check_at::text, health_check_error
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
