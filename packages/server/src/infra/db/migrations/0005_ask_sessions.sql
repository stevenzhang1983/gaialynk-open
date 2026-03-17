CREATE TABLE IF NOT EXISTS ask_sessions (
  id UUID PRIMARY KEY,
  request_json JSONB NOT NULL,
  route_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ask_sessions_created_idx
  ON ask_sessions(created_at DESC);

CREATE TABLE IF NOT EXISTS ask_runs (
  id UUID PRIMARY KEY,
  ask_id UUID NOT NULL REFERENCES ask_sessions(id) ON DELETE CASCADE,
  action VARCHAR(32) NOT NULL,
  selected_agent_ids JSONB NOT NULL,
  summary TEXT NOT NULL,
  evidence JSONB NOT NULL,
  cost_estimate_tokens INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  timeline JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS ask_runs_ask_created_idx
  ON ask_runs(ask_id, created_at ASC);
