-- E-12 V1.3.1: message read receipts for realtime sync
CREATE TABLE IF NOT EXISTS message_read_receipts (
  message_id UUID NOT NULL REFERENCES messages (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS message_read_receipts_conversation_lookup_idx
  ON message_read_receipts (user_id, message_id);
