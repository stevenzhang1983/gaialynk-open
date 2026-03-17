import { createHmac, randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

type ScopeLevel = "directory" | "application" | "action";

export interface ConnectorAuthorization {
  id: string;
  user_id: string;
  device_id: string | null;
  connector: string;
  scope_level: ScopeLevel;
  scope_value: string;
  expires_at: string;
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
}

export interface LocalActionReceipt {
  id: string;
  authorization_id: string;
  action: string;
  risk_level: "low" | "medium" | "high" | "critical";
  params_summary: Record<string, unknown>;
  result: "completed";
  env_signature: string;
  created_at: string;
}

const authorizations = new Map<string, ConnectorAuthorization>();
const receipts = new Map<string, LocalActionReceipt>();

const nowIso = (): string => new Date().toISOString();

const receiptSecret = "phase0-local-action-receipt-secret";

const signPayload = (payload: string): string =>
  createHmac("sha256", receiptSecret).update(payload).digest("hex");

export const createConnectorAuthorizationAsync = async (input: {
  userId: string;
  deviceId?: string | null;
  connector: string;
  scopeLevel: ScopeLevel;
  scopeValue: string;
  expiresInSec: number;
}): Promise<ConnectorAuthorization> => {
  const now = Date.now();
  const createdAt = new Date(now).toISOString();
  const deviceId = input.deviceId ?? null;
  const authorization: ConnectorAuthorization = {
    id: randomUUID(),
    user_id: input.userId,
    device_id: deviceId,
    connector: input.connector,
    scope_level: input.scopeLevel,
    scope_value: input.scopeValue,
    expires_at: new Date(now + input.expiresInSec * 1000).toISOString(),
    status: "active",
    created_at: createdAt,
    updated_at: createdAt,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO connector_authorizations
       (id, user_id, device_id, connector, scope_level, scope_value, expires_at, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        authorization.id,
        authorization.user_id,
        deviceId,
        authorization.connector,
        authorization.scope_level,
        authorization.scope_value,
        authorization.expires_at,
        authorization.status,
        authorization.created_at,
        authorization.updated_at,
      ],
    );
  } else {
    authorizations.set(authorization.id, authorization);
  }
  return authorization;
};

export const listConnectorAuthorizationsByUserIdAsync = async (input: {
  userId: string;
  deviceId?: string | null;
  limit?: number;
}): Promise<ConnectorAuthorization[]> => {
  const limit = Math.max(1, Math.min(100, input.limit ?? 20));
  if (isPostgresEnabled()) {
    if (input.deviceId != null && input.deviceId !== "") {
      const rows = await query<ConnectorAuthorization & { device_id: string | null }>(
        `SELECT id, user_id, device_id, connector, scope_level, scope_value, expires_at::text, status, created_at::text, updated_at::text
         FROM connector_authorizations
         WHERE user_id = $1 AND device_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [input.userId, input.deviceId, limit],
      );
      return rows;
    }
    const rows = await query<ConnectorAuthorization & { device_id: string | null }>(
      `SELECT id, user_id, device_id, connector, scope_level, scope_value, expires_at::text, status, created_at::text, updated_at::text
       FROM connector_authorizations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [input.userId, limit],
    );
    return rows;
  }
  return [...authorizations.values()]
    .filter(
      (a) =>
        a.user_id === input.userId &&
        (input.deviceId == null || a.device_id === input.deviceId),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
};

export const revokeConnectorAuthorizationsByDeviceAsync = async (input: {
  userId: string;
  deviceId: string;
}): Promise<number> => {
  const now = nowIso();
  if (isPostgresEnabled()) {
    const result = await query<{ id: string }>(
      `UPDATE connector_authorizations
       SET status = 'revoked', updated_at = $3
       WHERE user_id = $1 AND device_id = $2 AND status = 'active'
       RETURNING id`,
      [input.userId, input.deviceId, now],
    );
    return result.length;
  }
  let count = 0;
  for (const [id, a] of authorizations) {
    if (a.user_id === input.userId && a.device_id === input.deviceId && a.status === "active") {
      authorizations.set(id, { ...a, status: "revoked", updated_at: now });
      count += 1;
    }
  }
  return count;
};

export const getConnectorAuthorizationByIdAsync = async (
  authorizationId: string,
): Promise<ConnectorAuthorization | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<ConnectorAuthorization & { device_id: string | null }>(
      `SELECT id, user_id, device_id, connector, scope_level, scope_value, expires_at::text, status, created_at::text, updated_at::text
       FROM connector_authorizations
       WHERE id = $1`,
      [authorizationId],
    );
    return rows[0] ?? null;
  }
  return authorizations.get(authorizationId) ?? null;
};

export const revokeConnectorAuthorizationAsync = async (
  authorizationId: string,
): Promise<ConnectorAuthorization | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<ConnectorAuthorization & { device_id: string | null }>(
      `UPDATE connector_authorizations
       SET status = 'revoked', updated_at = $2
       WHERE id = $1
       RETURNING id, user_id, device_id, connector, scope_level, scope_value, expires_at::text, status, created_at::text, updated_at::text`,
      [authorizationId, nowIso()],
    );
    return rows[0] ?? null;
  }
  const authorization = authorizations.get(authorizationId);
  if (!authorization) return null;
  const updated: ConnectorAuthorization = {
    ...authorization,
    status: "revoked",
    updated_at: nowIso(),
  };
  authorizations.set(authorizationId, updated);
  return updated;
};

export const executeLocalActionAsync = async (input: {
  authorizationId: string;
  action: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  paramsSummary: Record<string, unknown>;
}): Promise<LocalActionReceipt> => {
  const createdAt = nowIso();
  const payload = JSON.stringify({
    authorization_id: input.authorizationId,
    action: input.action,
    risk_level: input.riskLevel,
    params_summary: input.paramsSummary,
    created_at: createdAt,
  });
  const receipt: LocalActionReceipt = {
    id: randomUUID(),
    authorization_id: input.authorizationId,
    action: input.action,
    risk_level: input.riskLevel,
    params_summary: input.paramsSummary,
    result: "completed",
    env_signature: signPayload(payload),
    created_at: createdAt,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO local_action_receipts
       (id, authorization_id, action, risk_level, params_summary, result, env_signature, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
      [
        receipt.id,
        receipt.authorization_id,
        receipt.action,
        receipt.risk_level,
        JSON.stringify(receipt.params_summary),
        receipt.result,
        receipt.env_signature,
        receipt.created_at,
      ],
    );
  } else {
    receipts.set(receipt.id, receipt);
  }
  return receipt;
};

export const getLocalActionReceiptByIdAsync = async (
  receiptId: string,
): Promise<LocalActionReceipt | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<{
      id: string;
      authorization_id: string;
      action: string;
      risk_level: "low" | "medium" | "high" | "critical";
      params_summary: Record<string, unknown> | string;
      result: "completed";
      env_signature: string;
      created_at: string;
    }>(
      `SELECT id, authorization_id, action, risk_level, params_summary, result, env_signature, created_at::text
       FROM local_action_receipts
       WHERE id = $1`,
      [receiptId],
    );
    const row = rows[0];
    if (!row) {
      return null;
    }
    return {
      ...row,
      params_summary:
        typeof row.params_summary === "string"
          ? (JSON.parse(row.params_summary) as Record<string, unknown>)
          : row.params_summary,
    };
  }
  return receipts.get(receiptId) ?? null;
};

export const resetConnectorStore = (): void => {
  if (isPostgresEnabled()) {
    return;
  }
  authorizations.clear();
  receipts.clear();
};
