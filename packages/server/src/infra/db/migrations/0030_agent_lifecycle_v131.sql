-- E-15 V1.3.1: Agent lifecycle (version/changelog, listing_status: listed | maintenance | delisted)

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS current_version TEXT NOT NULL DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS changelog JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS listing_status VARCHAR(24) NOT NULL DEFAULT 'listed'
    CHECK (listing_status IN ('listed', 'maintenance', 'delisted'));
