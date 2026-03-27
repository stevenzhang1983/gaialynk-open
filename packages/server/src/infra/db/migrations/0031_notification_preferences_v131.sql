-- E-16 V1.3.1: per-user email notification preferences on users + space_invitation in-app type.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  DEFAULT '{"email_enabled": true, "email_types": ["task_completed", "human_review_required", "quota_warning", "agent_status_changed", "connector_expired", "space_invitation"], "email_locale": "en"}'::jsonb;

ALTER TABLE notification_events DROP CONSTRAINT IF EXISTS notification_events_notification_type_check;

ALTER TABLE notification_events ADD CONSTRAINT notification_events_notification_type_check CHECK (notification_type IN (
  'task_completed',
  'review_required',
  'connector_expiring',
  'quota_warning',
  'agent_status_change',
  'space_invitation',
  'legacy_event'
));
