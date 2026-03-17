-- P0-2 F: Structured feedback for agent runs (bound to real run)
CREATE TABLE IF NOT EXISTS agent_run_feedback (
  id UUID PRIMARY KEY,
  ask_run_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  quality INTEGER NOT NULL CHECK (quality >= 1 AND quality <= 5),
  speed INTEGER NOT NULL CHECK (speed >= 1 AND speed <= 5),
  stability INTEGER NOT NULL CHECK (stability >= 1 AND stability <= 5),
  meets_expectation INTEGER NOT NULL CHECK (meets_expectation >= 1 AND meets_expectation <= 5),
  created_at TIMESTAMPTZ NOT NULL,
  valid_run BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS agent_run_feedback_agent_id_idx ON agent_run_feedback(agent_id);
CREATE INDEX IF NOT EXISTS agent_run_feedback_ask_run_id_idx ON agent_run_feedback(ask_run_id);
