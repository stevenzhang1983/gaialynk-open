-- P0-2 E: Publisher identity tier (anonymous | verified | certified)
CREATE TABLE IF NOT EXISTS publishers (
  id UUID PRIMARY KEY,
  identity_tier VARCHAR(32) NOT NULL CHECK (identity_tier IN ('anonymous', 'verified', 'certified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO publishers (id, identity_tier, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'anonymous', NOW())
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public_agent_templates
  ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES publishers(id);

CREATE INDEX IF NOT EXISTS public_agent_templates_publisher_id_idx
  ON public_agent_templates(publisher_id);

-- Backfill existing templates to default anonymous publisher
UPDATE public_agent_templates
SET publisher_id = '00000000-0000-0000-0000-000000000001'
WHERE publisher_id IS NULL;
