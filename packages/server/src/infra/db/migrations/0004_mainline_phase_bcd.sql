CREATE TABLE IF NOT EXISTS public_agent_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(64) NOT NULL,
  major_version INTEGER NOT NULL,
  minor_version INTEGER NOT NULL,
  version VARCHAR(16) NOT NULL,
  source_url TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS public_agent_templates_created_idx
  ON public_agent_templates(created_at DESC);

CREATE TABLE IF NOT EXISTS template_quality_evaluations (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public_agent_templates(id) ON DELETE CASCADE,
  sample_count INTEGER NOT NULL,
  success_count INTEGER NOT NULL,
  timeout_count INTEGER NOT NULL,
  complaint_count INTEGER NOT NULL,
  withdrawal_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS template_quality_evaluations_template_created_idx
  ON template_quality_evaluations(template_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_task_instances (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name VARCHAR(120) NOT NULL,
  schedule_cron VARCHAR(120) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS user_task_instances_user_created_idx
  ON user_task_instances(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_task_runs (
  id UUID PRIMARY KEY,
  task_instance_id UUID NOT NULL REFERENCES user_task_instances(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS user_task_runs_task_created_idx
  ON user_task_runs(task_instance_id, created_at ASC);

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY,
  task_instance_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_refs JSONB NOT NULL,
  status VARCHAR(32) NOT NULL,
  decision VARCHAR(32),
  arbitration_note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS disputes_status_created_idx
  ON disputes(status, created_at DESC);

CREATE TABLE IF NOT EXISTS connector_authorizations (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  connector VARCHAR(64) NOT NULL,
  scope_level VARCHAR(32) NOT NULL,
  scope_value VARCHAR(120) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS connector_authorizations_user_status_idx
  ON connector_authorizations(user_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS local_action_receipts (
  id UUID PRIMARY KEY,
  authorization_id UUID NOT NULL REFERENCES connector_authorizations(id) ON DELETE CASCADE,
  action VARCHAR(120) NOT NULL,
  risk_level VARCHAR(32) NOT NULL,
  params_summary JSONB NOT NULL,
  result VARCHAR(32) NOT NULL,
  env_signature TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS local_action_receipts_authorization_created_idx
  ON local_action_receipts(authorization_id, created_at DESC);
