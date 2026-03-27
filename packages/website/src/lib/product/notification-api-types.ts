export type NotificationAppType =
  | "task_completed"
  | "review_required"
  | "connector_expiring"
  | "quota_warning"
  | "agent_status_change"
  | "legacy_event";

export type NotificationListItem = {
  id: string;
  user_id: string;
  event_type: string;
  type: NotificationAppType;
  deep_link: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};

export type NotificationListResponse = {
  data?: {
    items: NotificationListItem[];
    next_cursor: string | null;
  };
  meta?: { unread_count: number };
  error?: { code?: string; message?: string };
};
