-- E-17 V1.3.1: soft-archive columns for TTL-based data retention job (matrix: docs/Data-Retention-Matrix-v1.md).

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE invocations
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE orchestration_runs
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE external_action_receipts
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS messages_archived_created_idx ON messages (archived, created_at);
CREATE INDEX IF NOT EXISTS audit_events_archived_created_idx ON audit_events (archived, created_at);
CREATE INDEX IF NOT EXISTS receipts_archived_issued_idx ON receipts (archived, issued_at);
CREATE INDEX IF NOT EXISTS invocations_archived_created_idx ON invocations (archived, created_at);
CREATE INDEX IF NOT EXISTS orchestration_runs_archived_created_idx ON orchestration_runs (archived, created_at);
CREATE INDEX IF NOT EXISTS external_action_receipts_archived_created_idx ON external_action_receipts (archived, created_at);
