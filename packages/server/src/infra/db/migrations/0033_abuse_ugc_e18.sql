-- E-18 V1.3.1: UGC reports + message hide (soft moderation). Migration number follows 0032 (data retention).

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS content_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS user_content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_content_reports_message_id_idx ON user_content_reports (message_id);
CREATE INDEX IF NOT EXISTS user_content_reports_reporter_id_idx ON user_content_reports (reporter_id);
CREATE INDEX IF NOT EXISTS user_content_reports_status_idx ON user_content_reports (status);

CREATE UNIQUE INDEX IF NOT EXISTS user_content_reports_message_reporter_uidx
  ON user_content_reports (message_id, reporter_id);
