CREATE TABLE IF NOT EXISTS deployment_records (
  id UUID PRIMARY KEY,
  template_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  agent_name VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL,
  activated_agent_id UUID,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS deployment_records_actor_idx
  ON deployment_records(actor_id, created_at DESC);
