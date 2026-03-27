-- E-1 V1.3: Spaces + members; users.default_space_id for personal Space bootstrap
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(16) NOT NULL
    CHECK (type IN ('personal', 'team')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS spaces_created_by_idx ON spaces(created_by);
CREATE INDEX IF NOT EXISTS spaces_type_idx ON spaces(type);

CREATE TABLE IF NOT EXISTS space_members (
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL
    CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  joined_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (space_id, user_id)
);

CREATE INDEX IF NOT EXISTS space_members_user_id_idx ON space_members(user_id);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS default_space_id UUID REFERENCES spaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_default_space_id_idx ON users(default_space_id);
