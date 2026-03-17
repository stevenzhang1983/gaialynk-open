-- P1: Offline run queue (queue / cancel / cloud-degrade)
CREATE TABLE IF NOT EXISTS offline_run_queues (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_instance_id UUID NOT NULL REFERENCES user_task_instances(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL CHECK (status IN ('queued', 'cancelled', 'cloud_degraded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS offline_run_queues_user_status_idx
  ON offline_run_queues(user_id, status);
