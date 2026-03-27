-- E-2 V1.3: Space invitations, status, conversations.space_id
ALTER TABLE spaces
  ADD COLUMN IF NOT EXISTS status VARCHAR(16) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived'));

CREATE INDEX IF NOT EXISTS spaces_status_idx ON spaces(status);

CREATE TABLE IF NOT EXISTS space_invitations (
  id UUID PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  preset_role VARCHAR(16) NOT NULL
    CHECK (preset_role IN ('admin', 'member', 'guest')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS space_invitations_space_id_idx ON space_invitations(space_id);
CREATE INDEX IF NOT EXISTS space_invitations_expires_at_idx ON space_invitations(expires_at);

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES spaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS conversations_space_id_idx ON conversations(space_id);
