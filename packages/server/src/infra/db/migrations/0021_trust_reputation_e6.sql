-- E-6: Trust user-facing extensions + reputation retest queue + agent user reports

ALTER TABLE agent_run_feedback
  ADD COLUMN IF NOT EXISTS usefulness VARCHAR(16)
    CHECK (usefulness IS NULL OR usefulness IN ('helpful', 'not_helpful', 'neutral')),
  ADD COLUMN IF NOT EXISTS reason_code VARCHAR(64);

CREATE INDEX IF NOT EXISTS agent_run_feedback_agent_usefulness_idx
  ON agent_run_feedback (agent_id, usefulness, reason_code, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_retest_queue (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  reason_code VARCHAR(64) NOT NULL,
  feedback_count INTEGER NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS agent_retest_queue_agent_status_idx
  ON agent_retest_queue (agent_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_user_reports (
  id UUID PRIMARY KEY,
  agent_id UUID NOT NULL,
  reporter_id VARCHAR(128) NOT NULL,
  reason_code VARCHAR(64) NOT NULL,
  detail TEXT,
  status VARCHAR(24) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'upheld', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS agent_user_reports_agent_status_idx
  ON agent_user_reports (agent_id, status, created_at DESC);
