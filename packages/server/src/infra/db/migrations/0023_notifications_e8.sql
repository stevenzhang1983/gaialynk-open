-- E-8 V1.3: notification center types, deep links; preferences quiet hours.

ALTER TABLE notification_events
  ADD COLUMN IF NOT EXISTS notification_type TEXT NOT NULL DEFAULT 'legacy_event'
    CHECK (notification_type IN (
      'task_completed',
      'review_required',
      'connector_expiring',
      'quota_warning',
      'agent_status_change',
      'legacy_event'
    )),
  ADD COLUMN IF NOT EXISTS deep_link TEXT;

UPDATE notification_events
SET notification_type = CASE event_type
  WHEN 'trust.agent_report.upheld' THEN 'agent_status_change'
  WHEN 'scheduler_run_failed' THEN 'task_completed'
  ELSE 'legacy_event'
END
WHERE notification_type = 'legacy_event';

CREATE INDEX IF NOT EXISTS notification_events_user_unread_created_idx
  ON notification_events (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT,
  ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT,
  ADD COLUMN IF NOT EXISTS quiet_hours_timezone TEXT;
