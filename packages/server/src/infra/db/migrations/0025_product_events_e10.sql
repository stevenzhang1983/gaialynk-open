-- E-10 V1.3: 产品埋点事件表（Founder 看板 / 周报 / CSV 导出）
CREATE TABLE IF NOT EXISTS product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  space_id uuid,
  conversation_id uuid,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  correlation_id text
);

CREATE INDEX IF NOT EXISTS product_events_name_occurred_at_idx
  ON product_events (event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS product_events_user_name_idx
  ON product_events (user_id, event_name)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS product_events_occurred_at_idx
  ON product_events (occurred_at DESC);
