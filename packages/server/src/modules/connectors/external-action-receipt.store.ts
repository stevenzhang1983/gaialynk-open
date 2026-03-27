import { createHmac, randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export interface ExternalActionReceipt {
  id: string;
  connector_authorization_id: string | null;
  device_id?: string | null;
  action: string;
  request_hash: string;
  response_status: number;
  env_signature: string;
  created_at: string;
  audit_correlation_id: string | null;
  response_summary: Record<string, unknown> | null;
}

const mem = new Map<string, ExternalActionReceipt>();

const signEnv = (payload: string): string =>
  createHmac("sha256", process.env.EXTERNAL_RECEIPT_SECRET?.trim() || "external-receipt-test-secret")
    .update(payload)
    .digest("hex");

export async function insertExternalActionReceiptAsync(input: {
  connectorAuthorizationId?: string | null;
  deviceId?: string | null;
  action: string;
  requestHash: string;
  responseStatus: number;
  auditCorrelationId?: string;
  responseSummary?: Record<string, unknown>;
}): Promise<ExternalActionReceipt> {
  const authId = input.connectorAuthorizationId ?? null;
  const devId = input.deviceId ?? null;
  if ((authId == null) === (devId == null)) {
    throw new Error("external receipt requires exactly one of connectorAuthorizationId or deviceId");
  }

  const createdAt = new Date().toISOString();
  const id = randomUUID();
  const payload = JSON.stringify({
    id,
    connector_authorization_id: authId,
    device_id: devId,
    action: input.action,
    request_hash: input.requestHash,
    response_status: input.responseStatus,
    created_at: createdAt,
  });
  const env_signature = signEnv(payload);

  const row: ExternalActionReceipt = {
    id,
    connector_authorization_id: authId,
    device_id: devId,
    action: input.action,
    request_hash: input.requestHash,
    response_status: input.responseStatus,
    env_signature,
    created_at: createdAt,
    audit_correlation_id: input.auditCorrelationId ?? null,
    response_summary: input.responseSummary ?? null,
  };

  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO external_action_receipts
       (id, connector_authorization_id, device_id, action, request_hash, response_status, env_signature, created_at, audit_correlation_id, response_summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)`,
      [
        row.id,
        row.connector_authorization_id,
        row.device_id ?? null,
        row.action,
        row.request_hash,
        row.response_status,
        row.env_signature,
        row.created_at,
        row.audit_correlation_id,
        row.response_summary ? JSON.stringify(row.response_summary) : null,
      ],
    );
  } else {
    mem.set(row.id, row);
  }
  return row;
}

export async function getExternalActionReceiptByIdAsync(id: string): Promise<ExternalActionReceipt | null> {
  if (isPostgresEnabled()) {
    const rows = await query<{
      id: string;
      connector_authorization_id: string | null;
      device_id: string | null;
      action: string;
      request_hash: string;
      response_status: number;
      env_signature: string;
      created_at: string;
      audit_correlation_id: string | null;
      response_summary: unknown;
    }>(
      `SELECT id, connector_authorization_id::text, device_id::text, action, request_hash, response_status, env_signature,
              created_at::text, audit_correlation_id, response_summary
       FROM external_action_receipts WHERE id = $1`,
      [id],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      ...r,
      response_summary:
        r.response_summary && typeof r.response_summary === "object"
          ? (r.response_summary as Record<string, unknown>)
          : null,
    };
  }
  return mem.get(id) ?? null;
}

export function resetExternalActionReceiptStore(): void {
  mem.clear();
}
