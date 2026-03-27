-- E-11 V1.3.1: RBAC identity — display names, member invite actor attribution
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS display_name TEXT;

ALTER TABLE space_members
  ADD COLUMN IF NOT EXISTS invited_by_actor_type TEXT NOT NULL DEFAULT 'human';
