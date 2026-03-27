-- Persist Notion (and future SaaS) workspace display name for connector settings UI (W-17).
ALTER TABLE connector_authorizations
  ADD COLUMN IF NOT EXISTS oauth_workspace_name TEXT NULL;
