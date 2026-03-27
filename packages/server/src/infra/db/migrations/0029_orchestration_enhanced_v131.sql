-- E-14 V1.3.1: orchestration product semantics, B-class schedule, lease fields.

ALTER TABLE orchestration_steps
  ADD COLUMN IF NOT EXISTS output_schema JSONB,
  ADD COLUMN IF NOT EXISTS input_mapping JSONB,
  ADD COLUMN IF NOT EXISTS output_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;

ALTER TABLE orchestration_runs
  ADD COLUMN IF NOT EXISTS schedule_cron TEXT,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orchestration_runs_scheduled_due_idx
  ON orchestration_runs (next_run_at)
  WHERE schedule_cron IS NOT NULL AND next_run_at IS NOT NULL;
