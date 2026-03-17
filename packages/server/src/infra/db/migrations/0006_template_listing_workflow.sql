CREATE TABLE IF NOT EXISTS template_listing_applications (
  id UUID PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public_agent_templates(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  reviewer_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS template_listing_applications_template_created_idx
  ON template_listing_applications(template_id, created_at DESC);
