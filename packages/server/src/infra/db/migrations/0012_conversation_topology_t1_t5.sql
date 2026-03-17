-- T1-T5: Conversation topology and session-level metadata
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_topology VARCHAR(8) NOT NULL DEFAULT 'T1'
    CHECK (conversation_topology IN ('T1', 'T2', 'T3', 'T4', 'T5'));

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS authorization_mode VARCHAR(32) NOT NULL DEFAULT 'user_explicit'
    CHECK (authorization_mode IN ('user_explicit', 'policy_based', 'delegated'));

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS visibility_mode VARCHAR(32) NOT NULL DEFAULT 'full'
    CHECK (visibility_mode IN ('full', 'summarized', 'restricted'));

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(16) NOT NULL DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));

CREATE INDEX IF NOT EXISTS conversations_topology_idx ON conversations(conversation_topology);
