import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface NodeRecord {
  id: string;
  node_id: string;
  name: string;
  endpoint: string;
  status: "online" | "offline" | "degraded";
  capabilities: Record<string, unknown>;
  last_heartbeat: string;
  created_at: string;
}

interface RegisterNodeInput {
  name: string;
  endpoint: string;
  capabilities?: Record<string, unknown>;
}

const nodesByNodeId = new Map<string, NodeRecord>();

const nowIso = (): string => new Date().toISOString();

export const registerNode = (input: RegisterNodeInput): NodeRecord => {
  if (isPostgresEnabled()) {
    throw new Error("Use registerNodeAsync in PostgreSQL mode");
  }

  const timestamp = nowIso();
  const node: NodeRecord = {
    id: randomUUID(),
    node_id: randomUUID(),
    name: input.name,
    endpoint: input.endpoint,
    status: "online",
    capabilities: input.capabilities ?? {},
    last_heartbeat: timestamp,
    created_at: timestamp,
  };

  nodesByNodeId.set(node.node_id, node);
  return node;
};

export const heartbeatNode = (nodeId: string): NodeRecord | null => {
  if (isPostgresEnabled()) {
    throw new Error("Use heartbeatNodeAsync in PostgreSQL mode");
  }

  const existing = nodesByNodeId.get(nodeId);
  if (!existing) {
    return null;
  }

  const updated: NodeRecord = {
    ...existing,
    status: "online",
    last_heartbeat: nowIso(),
  };

  nodesByNodeId.set(nodeId, updated);
  return updated;
};

export const listNodes = (): NodeRecord[] => {
  if (isPostgresEnabled()) {
    throw new Error("Use listNodesAsync in PostgreSQL mode");
  }

  return [...nodesByNodeId.values()];
};

export const resetNodeStore = (): void => {
  nodesByNodeId.clear();
};

export const registerNodeAsync = async (input: RegisterNodeInput): Promise<NodeRecord> => {
  if (!isPostgresEnabled()) {
    return registerNode(input);
  }

  const timestamp = nowIso();
  const node: NodeRecord = {
    id: randomUUID(),
    node_id: randomUUID(),
    name: input.name,
    endpoint: input.endpoint,
    status: "online",
    capabilities: input.capabilities ?? {},
    last_heartbeat: timestamp,
    created_at: timestamp,
  };

  await query(
    `INSERT INTO nodes (id, node_id, name, endpoint, status, capabilities, last_heartbeat, created_at)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
    [
      node.id,
      node.node_id,
      node.name,
      node.endpoint,
      node.status,
      JSON.stringify(node.capabilities),
      node.last_heartbeat,
      node.created_at,
    ],
  );

  return node;
};

export const heartbeatNodeAsync = async (nodeId: string): Promise<NodeRecord | null> => {
  if (!isPostgresEnabled()) {
    return heartbeatNode(nodeId);
  }

  const lastHeartbeat = nowIso();
  const rows = await query<{
    id: string;
    node_id: string;
    name: string;
    endpoint: string;
    status: "online" | "offline" | "degraded";
    capabilities: Record<string, unknown> | string;
    last_heartbeat: string;
    created_at: string;
  }>(
    `UPDATE nodes
     SET status = 'online', last_heartbeat = $2
     WHERE node_id = $1
     RETURNING id, node_id, name, endpoint, status, capabilities, last_heartbeat::text, created_at::text`,
    [nodeId, lastHeartbeat],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    node_id: row.node_id,
    name: row.name,
    endpoint: row.endpoint,
    status: row.status,
    capabilities: typeof row.capabilities === "string" ? (JSON.parse(row.capabilities) as Record<string, unknown>) : row.capabilities,
    last_heartbeat: row.last_heartbeat,
    created_at: row.created_at,
  };
};

export const listNodesAsync = async (): Promise<NodeRecord[]> => {
  if (!isPostgresEnabled()) {
    return listNodes();
  }

  const rows = await query<{
    id: string;
    node_id: string;
    name: string;
    endpoint: string;
    status: "online" | "offline" | "degraded";
    capabilities: Record<string, unknown> | string;
    last_heartbeat: string;
    created_at: string;
  }>(
    `SELECT id, node_id, name, endpoint, status, capabilities, last_heartbeat::text, created_at::text
     FROM nodes
     ORDER BY created_at DESC`,
  );

  return rows.map((row) => ({
    id: row.id,
    node_id: row.node_id,
    name: row.name,
    endpoint: row.endpoint,
    status: row.status,
    capabilities: typeof row.capabilities === "string" ? (JSON.parse(row.capabilities) as Record<string, unknown>) : row.capabilities,
    last_heartbeat: row.last_heartbeat,
    created_at: row.created_at,
  }));
};

export const getNodeByNodeIdAsync = async (nodeId: string): Promise<NodeRecord | null> => {
  if (!isPostgresEnabled()) {
    return nodesByNodeId.get(nodeId) ?? null;
  }

  const rows = await query<{
    id: string;
    node_id: string;
    name: string;
    endpoint: string;
    status: "online" | "offline" | "degraded";
    capabilities: Record<string, unknown> | string;
    last_heartbeat: string;
    created_at: string;
  }>(
    `SELECT id, node_id, name, endpoint, status, capabilities, last_heartbeat::text, created_at::text
     FROM nodes
     WHERE node_id = $1
     LIMIT 1`,
    [nodeId],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    node_id: row.node_id,
    name: row.name,
    endpoint: row.endpoint,
    status: row.status,
    capabilities: typeof row.capabilities === "string" ? (JSON.parse(row.capabilities) as Record<string, unknown>) : row.capabilities,
    last_heartbeat: row.last_heartbeat,
    created_at: row.created_at,
  };
};
