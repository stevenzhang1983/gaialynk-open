-- E-5 V1.3: multi-agent orchestration runs + steps (official dynamic topology runtime).

CREATE TABLE IF NOT EXISTS orchestration_runs (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  topology_source VARCHAR(16) NOT NULL CHECK (topology_source IN ('dynamic', 'package')),
  steps_json JSONB NOT NULL,
  current_step INT NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  user_message TEXT NOT NULL DEFAULT '',
  idempotency_key TEXT,
  step_timeout_ms INT NOT NULL DEFAULT 120000,
  cancel_requested BOOLEAN NOT NULL DEFAULT FALSE,
  paused_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS orchestration_runs_conversation_id_idx
  ON orchestration_runs(conversation_id);

CREATE INDEX IF NOT EXISTS orchestration_runs_user_idempotency_idx
  ON orchestration_runs(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND idempotency_key <> '';

CREATE TABLE IF NOT EXISTS orchestration_steps (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES orchestration_runs(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id),
  status VARCHAR(32) NOT NULL,
  input_json JSONB,
  output_json JSONB,
  run_id_per_step UUID NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  pending_invocation_id UUID,
  error_message TEXT,
  UNIQUE(run_id, step_index),
  UNIQUE(run_id_per_step)
);

CREATE INDEX IF NOT EXISTS orchestration_steps_run_id_idx
  ON orchestration_steps(run_id);

-- Link invocations back to orchestration for human-review resume (no FK to runs — avoids truncate cycles).
ALTER TABLE invocations
  ADD COLUMN IF NOT EXISTS orchestration_run_id UUID,
  ADD COLUMN IF NOT EXISTS orchestration_step_index INT;

CREATE INDEX IF NOT EXISTS invocations_orchestration_run_id_idx
  ON invocations(orchestration_run_id)
  WHERE orchestration_run_id IS NOT NULL;
