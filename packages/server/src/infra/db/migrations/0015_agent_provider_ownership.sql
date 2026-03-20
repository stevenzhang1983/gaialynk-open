-- T-5.4 Agent 接入 API: Provider 归属与健康检查结果
-- owner_id: Provider 用户 ID，仅由 /api/v1/agents/register 设置
-- health_check_*: 最近一次连通性检查结果（由 POST .../health-check 写入）
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS health_check_status VARCHAR(32);

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS health_check_at TIMESTAMPTZ;

ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS health_check_error TEXT;

CREATE INDEX IF NOT EXISTS agents_owner_id_idx ON agents(owner_id);
