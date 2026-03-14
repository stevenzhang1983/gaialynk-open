CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  state VARCHAR(16) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participant_type VARCHAR(16) NOT NULL,
  participant_id TEXT NOT NULL,
  role VARCHAR(16) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS participants_conversation_id_idx
  ON participants(conversation_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type VARCHAR(16) NOT NULL,
  sender_id TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
  ON messages(conversation_id);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  agent_type VARCHAR(16) NOT NULL,
  source_url TEXT NOT NULL,
  capabilities JSONB NOT NULL,
  source_origin VARCHAR(32) NOT NULL DEFAULT 'official',
  node_id UUID,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS agents_node_id_source_url_idx
  ON agents(node_id, source_url);

CREATE TABLE IF NOT EXISTS invocations (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  requester_id TEXT NOT NULL,
  user_text TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS invocations_conversation_id_idx
  ON invocations(conversation_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  conversation_id UUID,
  agent_id UUID,
  actor_type VARCHAR(16) NOT NULL,
  actor_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  trust_decision JSONB,
  correlation_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_events_event_type_idx
  ON audit_events(event_type);

CREATE INDEX IF NOT EXISTS audit_events_conversation_id_idx
  ON audit_events(conversation_id);

CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY,
  audit_event_id UUID NOT NULL REFERENCES audit_events(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  receipt_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature TEXT NOT NULL,
  signer TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  prev_receipt_hash TEXT,
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS receipts_conversation_id_idx
  ON receipts(conversation_id);

CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY,
  node_id UUID UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  endpoint TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  capabilities JSONB NOT NULL,
  last_heartbeat TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
