-- E-9: directory ranking config (admin-editable thresholds) + new-listing impression cap
CREATE TABLE IF NOT EXISTS directory_ranking_config (
  id text PRIMARY KEY DEFAULT 'default',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO directory_ranking_config (id, config)
VALUES ('default', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS directory_new_listing_impressions (
  agent_id uuid PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  impression_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS directory_new_listing_impressions_updated_at_idx
  ON directory_new_listing_impressions (updated_at);
