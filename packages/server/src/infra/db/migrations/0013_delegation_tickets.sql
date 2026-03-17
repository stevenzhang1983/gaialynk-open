-- T5: Delegation ticket (scope, revoke state)
CREATE TABLE IF NOT EXISTS delegation_tickets (
  id UUID PRIMARY KEY,
  granter_id TEXT NOT NULL,
  grantee_id TEXT NOT NULL,
  scope_capabilities JSONB NOT NULL DEFAULT '[]',
  scope_objects JSONB NOT NULL DEFAULT '[]',
  scope_data_domain TEXT NOT NULL DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delegation_tickets_granter_idx ON delegation_tickets(granter_id);
CREATE INDEX IF NOT EXISTS delegation_tickets_grantee_idx ON delegation_tickets(grantee_id);
CREATE INDEX IF NOT EXISTS delegation_tickets_revoked_idx ON delegation_tickets(revoked);
