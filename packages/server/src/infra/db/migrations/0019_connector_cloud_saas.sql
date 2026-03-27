-- E-4 V1.3: cloud SaaS connectors (Google Calendar, Notion), external receipts, uploads
ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS connector_type VARCHAR(16) NOT NULL DEFAULT 'local';

ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS provider VARCHAR(64);

ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS oauth_access_token_encrypted TEXT;

ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS oauth_refresh_token_encrypted TEXT;

ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS oauth_expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS external_action_receipts (
  id UUID PRIMARY KEY,
  connector_authorization_id UUID NOT NULL REFERENCES connector_authorizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INT NOT NULL,
  env_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  audit_correlation_id TEXT,
  response_summary JSONB
);

CREATE INDEX IF NOT EXISTS external_action_receipts_auth_created_idx
  ON external_action_receipts(connector_authorization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS connector_uploaded_files (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  byte_size INT NOT NULL CHECK (byte_size >= 0),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS connector_uploaded_files_user_created_idx
  ON connector_uploaded_files(user_id, created_at DESC);
