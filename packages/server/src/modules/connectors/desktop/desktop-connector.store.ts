import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../../infra/db/client";

export type DesktopDeviceStatus = "pending_pair" | "active" | "revoked";

export interface DesktopDeviceRow {
  id: string;
  user_id: string;
  device_name: string;
  pairing_code_hash: string | null;
  device_secret: string;
  status: DesktopDeviceStatus;
  paired_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

function pairingSecret(): string {
  const s = process.env.DESKTOP_CONNECTOR_PAIRING_SECRET?.trim();
  if (s && s.length >= 16) {
    return s;
  }
  if (process.env.NODE_ENV === "test" || process.env.VITEST === "true") {
    return "test-desktop-pairing-secret-min-16";
  }
  throw new Error("DESKTOP_CONNECTOR_PAIRING_SECRET must be set (min 16 chars) for desktop connector pairing");
}

export function hashPairingCode(pairingCode: string): string {
  return createHmac("sha256", pairingSecret()).update(pairingCode.trim(), "utf8").digest("hex");
}

function randomSecret(): string {
  return randomBytes(32).toString("hex");
}

export async function registerWebPairingAsync(input: {
  userId: string;
  pairingCode: string;
  deviceName?: string;
}): Promise<DesktopDeviceRow> {
  if (!isPostgresEnabled()) {
    throw new Error("desktop connector pairing requires PostgreSQL");
  }
  const normalized = input.pairingCode.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new Error("invalid_pairing_code_format");
  }
  const hash = hashPairingCode(normalized);
  const id = randomUUID();
  const secret = randomSecret();
  const now = new Date().toISOString();
  const name = input.deviceName?.trim() || "Desktop Connector";

  await query(
    `INSERT INTO connector_desktop_devices
     (id, user_id, device_name, pairing_code_hash, device_secret, status, paired_at, last_seen_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'pending_pair', NULL, NULL, $6, $6)`,
    [id, input.userId, name, hash, secret, now],
  );

  const row = await getDeviceByIdAsync(id);
  if (!row) {
    throw new Error("device_insert_failed");
  }
  return row;
}

export async function getDeviceByIdAsync(id: string): Promise<DesktopDeviceRow | null> {
  if (!isPostgresEnabled()) {
    return null;
  }
  const rows = await query<DesktopDeviceRow>(
    `SELECT id, user_id, device_name, pairing_code_hash, device_secret, status,
            paired_at::text, last_seen_at::text, created_at::text, updated_at::text
     FROM connector_desktop_devices WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function getDeviceByPairingHashAsync(hash: string): Promise<DesktopDeviceRow | null> {
  if (!isPostgresEnabled()) {
    return null;
  }
  const rows = await query<DesktopDeviceRow>(
    `SELECT id, user_id, device_name, pairing_code_hash, device_secret, status,
            paired_at::text, last_seen_at::text, created_at::text, updated_at::text
     FROM connector_desktop_devices
     WHERE pairing_code_hash = $1 AND status = 'pending_pair'`,
    [hash],
  );
  return rows[0] ?? null;
}

export async function activateDeviceAfterConnectorPollAsync(deviceId: string): Promise<DesktopDeviceRow | null> {
  if (!isPostgresEnabled()) {
    return null;
  }
  const now = new Date().toISOString();
  await query(
    `UPDATE connector_desktop_devices SET
       status = 'active',
       paired_at = COALESCE(paired_at, $2),
       pairing_code_hash = NULL,
       last_seen_at = $2,
       updated_at = $2
     WHERE id = $1 AND status = 'pending_pair'`,
    [deviceId, now],
  );
  return getDeviceByIdAsync(deviceId);
}

export async function touchDeviceLastSeenAsync(deviceId: string): Promise<void> {
  if (!isPostgresEnabled()) {
    return;
  }
  const now = new Date().toISOString();
  await query(`UPDATE connector_desktop_devices SET last_seen_at = $2, updated_at = $2 WHERE id = $1`, [
    deviceId,
    now,
  ]);
}

export async function revokeDeviceForUserAsync(deviceId: string, userId: string): Promise<boolean> {
  if (!isPostgresEnabled()) {
    return false;
  }
  const now = new Date().toISOString();
  const r = await query<{ id: string }>(
    `UPDATE connector_desktop_devices SET status = 'revoked', pairing_code_hash = NULL, updated_at = $3
     WHERE id = $1 AND user_id = $2 AND status <> 'revoked'
     RETURNING id`,
    [deviceId, userId, now],
  );
  return r.length > 0;
}

export async function listDesktopDevicesForUserAsync(userId: string): Promise<DesktopDeviceRow[]> {
  if (!isPostgresEnabled()) {
    return [];
  }
  return query<DesktopDeviceRow>(
    `SELECT id, user_id, device_name, pairing_code_hash, device_secret, status,
            paired_at::text, last_seen_at::text, created_at::text, updated_at::text
     FROM connector_desktop_devices
     WHERE user_id = $1 AND status IN ('active', 'pending_pair')
     ORDER BY created_at DESC`,
    [userId],
  );
}

export async function assertDeviceActiveForUserAsync(
  deviceId: string,
  userId: string,
): Promise<DesktopDeviceRow | null> {
  if (!isPostgresEnabled()) {
    return null;
  }
  const rows = await query<DesktopDeviceRow>(
    `SELECT id, user_id, device_name, pairing_code_hash, device_secret, status,
            paired_at::text, last_seen_at::text, created_at::text, updated_at::text
     FROM connector_desktop_devices
     WHERE id = $1 AND user_id = $2 AND status = 'active'`,
    [deviceId, userId],
  );
  return rows[0] ?? null;
}

export async function assertDeviceActiveByIdAsync(deviceId: string): Promise<DesktopDeviceRow | null> {
  if (!isPostgresEnabled()) {
    return null;
  }
  const rows = await query<DesktopDeviceRow>(
    `SELECT id, user_id, device_name, pairing_code_hash, device_secret, status,
            paired_at::text, last_seen_at::text, created_at::text, updated_at::text
     FROM connector_desktop_devices
     WHERE id = $1 AND status = 'active'`,
    [deviceId],
  );
  return rows[0] ?? null;
}
