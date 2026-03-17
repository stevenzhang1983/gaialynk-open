-- P0-2 G: Notification preferences and events
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT PRIMARY KEY,
  channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
  strategy TEXT NOT NULL DEFAULT 'only_exceptions' CHECK (strategy IN ('only_exceptions', 'all_runs')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS notification_events_user_created_idx
  ON notification_events(user_id, created_at DESC);
