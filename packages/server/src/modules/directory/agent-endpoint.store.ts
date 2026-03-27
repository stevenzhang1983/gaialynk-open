import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type AgentEndpointStatus = "healthy" | "unhealthy";

export interface AgentEndpointRow {
  id: string;
  agent_id: string;
  endpoint_url: string;
  status: AgentEndpointStatus;
  last_health_check_at: string | null;
  created_at: string;
}

const memByAgent = new Map<string, AgentEndpointRow[]>();

export function resetAgentEndpointStoreForTests(): void {
  memByAgent.clear();
}

export async function listHealthyEndpointUrlsForAgentAsync(
  agentId: string,
  fallbackSourceUrl: string,
): Promise<string[]> {
  if (!isPostgresEnabled()) {
    const rows = memByAgent.get(agentId)?.filter((r) => r.status === "healthy") ?? [];
    const urls = rows.map((r) => r.endpoint_url);
    return urls.length > 0 ? urls : [fallbackSourceUrl];
  }

  const rows = await query<{ endpoint_url: string }>(
    `SELECT endpoint_url FROM agent_endpoints
     WHERE agent_id = $1 AND status = 'healthy'
     ORDER BY created_at ASC`,
    [agentId],
  );
  const urls = rows.map((r) => r.endpoint_url);
  return urls.length > 0 ? urls : [fallbackSourceUrl];
}

export async function listAgentEndpointsAsync(agentId: string): Promise<AgentEndpointRow[]> {
  if (!isPostgresEnabled()) {
    return [...(memByAgent.get(agentId) ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }
  const rows = await query<AgentEndpointRow>(
    `SELECT id::text, agent_id::text, endpoint_url, status,
            last_health_check_at::text, created_at::text
     FROM agent_endpoints
     WHERE agent_id = $1
     ORDER BY created_at ASC`,
    [agentId],
  );
  return rows.map((r) => ({
    ...r,
    last_health_check_at: r.last_health_check_at ?? null,
  }));
}

export async function createAgentEndpointAsync(
  agentId: string,
  endpointUrl: string,
): Promise<AgentEndpointRow> {
  const now = new Date().toISOString();
  const row: AgentEndpointRow = {
    id: randomUUID(),
    agent_id: agentId,
    endpoint_url: endpointUrl,
    status: "healthy",
    last_health_check_at: null,
    created_at: now,
  };

  if (!isPostgresEnabled()) {
    const list = memByAgent.get(agentId) ?? [];
    if (list.some((e) => e.endpoint_url === endpointUrl)) {
      throw new Error("endpoint_url_exists");
    }
    list.push(row);
    memByAgent.set(agentId, list);
    return row;
  }

  await query(
    `INSERT INTO agent_endpoints (id, agent_id, endpoint_url, status)
     VALUES ($1::uuid, $2::uuid, $3, $4)`,
    [row.id, agentId, endpointUrl, row.status],
  );
  return row;
}

export async function deleteAgentEndpointAsync(agentId: string, endpointId: string): Promise<boolean> {
  if (!isPostgresEnabled()) {
    const list = memByAgent.get(agentId);
    if (!list) return false;
    const i = list.findIndex((e) => e.id === endpointId);
    if (i < 0) return false;
    list.splice(i, 1);
    if (list.length === 0) memByAgent.delete(agentId);
    return true;
  }
  const res = await query<{ id: string }>(
    `DELETE FROM agent_endpoints WHERE id = $1::uuid AND agent_id = $2::uuid RETURNING id::text AS id`,
    [endpointId, agentId],
  );
  return res.length > 0;
}

export async function setAgentEndpointStatusAsync(
  agentId: string,
  endpointId: string,
  status: AgentEndpointStatus,
): Promise<boolean> {
  const now = new Date().toISOString();
  if (!isPostgresEnabled()) {
    const list = memByAgent.get(agentId);
    const row = list?.find((e) => e.id === endpointId);
    if (!row) return false;
    row.status = status;
    row.last_health_check_at = now;
    return true;
  }
  const res = await query<{ id: string }>(
    `UPDATE agent_endpoints
     SET status = $3, last_health_check_at = $4::timestamptz
     WHERE id = $1::uuid AND agent_id = $2::uuid
     RETURNING id::text AS id`,
    [endpointId, agentId, status, now],
  );
  return res.length > 0;
}
