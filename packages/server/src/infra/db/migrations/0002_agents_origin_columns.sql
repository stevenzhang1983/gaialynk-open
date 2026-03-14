ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS source_origin VARCHAR(32) NOT NULL DEFAULT 'official';

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS node_id UUID;

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS agents_node_id_source_url_idx
  ON agents(node_id, source_url);
