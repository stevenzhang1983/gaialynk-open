import { randomUUID } from "node:crypto";

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
  return [...nodesByNodeId.values()];
};

export const resetNodeStore = (): void => {
  nodesByNodeId.clear();
};
