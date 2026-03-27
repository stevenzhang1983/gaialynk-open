-- W-6: per-user pin / star for conversations (lifecycle UI)
CREATE TABLE IF NOT EXISTS conversation_user_prefs (
  user_id TEXT NOT NULL,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  pinned_at TIMESTAMPTZ,
  starred BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS conversation_user_prefs_user_id_idx
  ON conversation_user_prefs (user_id);
