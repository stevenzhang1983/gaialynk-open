import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

const ticketsById = new Map<string, DelegationTicket>();

export interface DelegationTicket {
  id: string;
  granter_id: string;
  grantee_id: string;
  scope_capabilities: string[];
  scope_objects: string[];
  scope_data_domain: string;
  expires_at: string;
  revoked: boolean;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDelegationTicketInput {
  granter_id: string;
  grantee_id: string;
  scope_capabilities?: string[];
  scope_objects?: string[];
  scope_data_domain?: string;
  expires_at: string;
}

export async function createDelegationTicketAsync(
  input: CreateDelegationTicketInput,
): Promise<DelegationTicket> {
  const id = randomUUID();
  const now = new Date().toISOString();
  const ticket: DelegationTicket = {
    id,
    granter_id: input.granter_id,
    grantee_id: input.grantee_id,
    scope_capabilities: input.scope_capabilities ?? [],
    scope_objects: input.scope_objects ?? [],
    scope_data_domain: input.scope_data_domain ?? "",
    expires_at: input.expires_at,
    revoked: false,
    revoked_at: null,
    created_at: now,
    updated_at: now,
  };

  if (!isPostgresEnabled()) {
    ticketsById.set(id, ticket);
    return ticket;
  }

  const capabilities = JSON.stringify(input.scope_capabilities ?? []);
  const objects = JSON.stringify(input.scope_objects ?? []);
  await query(
    `INSERT INTO delegation_tickets (
      id, granter_id, grantee_id, scope_capabilities, scope_objects, scope_data_domain,
      expires_at, revoked, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $8)`,
    [
      id,
      input.granter_id,
      input.grantee_id,
      capabilities,
      objects,
      input.scope_data_domain ?? "",
      input.expires_at,
      now,
    ],
  );

  return ticket;
}

export async function getDelegationTicketByIdAsync(id: string): Promise<DelegationTicket | null> {
  if (!isPostgresEnabled()) {
    return ticketsById.get(id) ?? null;
  }

  const rows = await query<{
    id: string;
    granter_id: string;
    grantee_id: string;
    scope_capabilities: string;
    scope_objects: string;
    scope_data_domain: string;
    expires_at: string;
    revoked: boolean;
    revoked_at: string | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, granter_id, grantee_id, scope_capabilities, scope_objects, scope_data_domain,
            expires_at::text, revoked, revoked_at::text, created_at::text, updated_at::text
     FROM delegation_tickets WHERE id = $1`,
    [id],
  );

  const row = rows[0];
  if (!row) return null;

  const scopeCapabilities =
    typeof row.scope_capabilities === "string"
      ? (JSON.parse(row.scope_capabilities) as string[])
      : Array.isArray(row.scope_capabilities)
        ? (row.scope_capabilities as string[])
        : [];
  const scopeObjects =
    typeof row.scope_objects === "string"
      ? (JSON.parse(row.scope_objects) as string[])
      : Array.isArray(row.scope_objects)
        ? (row.scope_objects as string[])
        : [];

  return {
    id: row.id,
    granter_id: row.granter_id,
    grantee_id: row.grantee_id,
    scope_capabilities: scopeCapabilities,
    scope_objects: scopeObjects,
    scope_data_domain: row.scope_data_domain,
    expires_at: row.expires_at,
    revoked: row.revoked,
    revoked_at: row.revoked_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function revokeDelegationTicketAsync(id: string): Promise<DelegationTicket | null> {
  const existing = await getDelegationTicketByIdAsync(id);
  if (!existing || existing.revoked) return existing;

  const now = new Date().toISOString();
  const updated = { ...existing, revoked: true, revoked_at: now, updated_at: now };

  if (!isPostgresEnabled()) {
    ticketsById.set(id, updated);
    return updated;
  }

  await query(
    `UPDATE delegation_tickets SET revoked = true, revoked_at = $2, updated_at = $2 WHERE id = $1`,
    [id, now],
  );

  return updated;
}
