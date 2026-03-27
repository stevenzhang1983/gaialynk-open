-- E-20 V1.3.1: desktop Connector pairing, device registry, external receipts by device
CREATE TABLE IF NOT EXISTS connector_desktop_devices (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Desktop Connector',
  pairing_code_hash TEXT,
  device_secret TEXT NOT NULL,
  status VARCHAR(32) NOT NULL CHECK (status IN ('pending_pair', 'active', 'revoked')),
  paired_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS connector_desktop_devices_user_idx
  ON connector_desktop_devices(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS connector_desktop_devices_pending_pairing_hash_idx
  ON connector_desktop_devices(pairing_code_hash)
  WHERE pairing_code_hash IS NOT NULL AND status = 'pending_pair';

ALTER TABLE external_action_receipts
  ALTER COLUMN connector_authorization_id DROP NOT NULL;

ALTER TABLE external_action_receipts
  ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES connector_desktop_devices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS external_action_receipts_device_created_idx
  ON external_action_receipts(device_id, created_at DESC);

ALTER TABLE external_action_receipts DROP CONSTRAINT IF EXISTS external_action_receipts_source_chk;

ALTER TABLE external_action_receipts
  ADD CONSTRAINT external_action_receipts_source_chk CHECK (
    (connector_authorization_id IS NOT NULL AND device_id IS NULL)
    OR (connector_authorization_id IS NULL AND device_id IS NOT NULL)
  );
