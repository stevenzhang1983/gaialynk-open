-- E-3 V1.3: message delivery status + Space user presence
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'delivered';

CREATE TABLE IF NOT EXISTS space_presence (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL
    CHECK (status IN ('online', 'away')),
  last_seen_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, space_id)
);

CREATE INDEX IF NOT EXISTS space_presence_space_id_idx ON space_presence(space_id);
