-- E-7: Invocation context support data model + logical Agent / endpoint pool (V1.3)

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS max_concurrent INTEGER NOT NULL DEFAULT 1
    CHECK (max_concurrent >= 1 AND max_concurrent <= 1000),
  ADD COLUMN IF NOT EXISTS queue_behavior VARCHAR(16) NOT NULL DEFAULT 'queue'
    CHECK (queue_behavior IN ('queue', 'fast_fail')),
  ADD COLUMN IF NOT EXISTS timeout_ms INTEGER NULL
    CHECK (timeout_ms IS NULL OR (timeout_ms >= 1000 AND timeout_ms <= 3600000)),
  ADD COLUMN IF NOT EXISTS supports_scheduled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS memory_tier VARCHAR(24) NOT NULL DEFAULT 'none'
    CHECK (memory_tier IN ('none', 'session', 'user_isolated'));

CREATE TABLE IF NOT EXISTS agent_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  endpoint_url TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'healthy'
    CHECK (status IN ('healthy', 'unhealthy')),
  last_health_check_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agent_endpoints_agent_url_unique UNIQUE (agent_id, endpoint_url)
);

CREATE INDEX IF NOT EXISTS agent_endpoints_agent_id_idx ON agent_endpoints (agent_id);
