-- P1: Multi-device independent authorization
ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE INDEX IF NOT EXISTS connector_authorizations_user_device_idx
  ON connector_authorizations(user_id, device_id);
