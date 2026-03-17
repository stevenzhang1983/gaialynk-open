import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type OfflineQueueStatus = "queued" | "cancelled" | "cloud_degraded";

export interface OfflineQueueItem {
  id: string;
  user_id: string;
  task_instance_id: string;
  status: OfflineQueueStatus;
  created_at: string;
  updated_at: string;
}

const queue = new Map<string, OfflineQueueItem>();
const nowIso = (): string => new Date().toISOString();

export const enqueueOfflineRunAsync = async (input: {
  userId: string;
  taskInstanceId: string;
}): Promise<OfflineQueueItem | null> => {
  const item: OfflineQueueItem = {
    id: randomUUID(),
    user_id: input.userId,
    task_instance_id: input.taskInstanceId,
    status: "queued",
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO offline_run_queues (id, user_id, task_instance_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [item.id, item.user_id, item.task_instance_id, item.status, item.created_at, item.updated_at],
    );
    return item;
  }
  queue.set(item.id, item);
  return item;
};

export const getOfflineQueueItemAsync = async (
  queueId: string,
): Promise<OfflineQueueItem | null> => {
  if (!isPostgresEnabled()) {
    return queue.get(queueId) ?? null;
  }
  const rows = await query<OfflineQueueItem>(
    `SELECT id, user_id, task_instance_id, status, created_at::text, updated_at::text
     FROM offline_run_queues WHERE id = $1`,
    [queueId],
  );
  return rows[0] ?? null;
};

export const cancelQueuedRunAsync = async (
  queueId: string,
  userId: string,
): Promise<OfflineQueueItem | null> => {
  return updateOfflineQueueStatusAsync(queueId, userId, "cancelled");
};

export const cloudDegradeQueuedRunAsync = async (
  queueId: string,
  userId: string,
): Promise<OfflineQueueItem | null> => {
  return updateOfflineQueueStatusAsync(queueId, userId, "cloud_degraded");
};

function updateOfflineQueueStatusAsync(
  queueId: string,
  userId: string,
  status: OfflineQueueStatus,
): Promise<OfflineQueueItem | null> {
  const now = nowIso();
  if (isPostgresEnabled()) {
    return query<OfflineQueueItem>(
      `UPDATE offline_run_queues SET status = $2, updated_at = $3
       WHERE id = $1 AND user_id = $4
       RETURNING id, user_id, task_instance_id, status, created_at::text, updated_at::text`,
      [queueId, status, now, userId],
    ).then((rows) => rows[0] ?? null);
  }
  const item = queue.get(queueId);
  if (!item || item.user_id !== userId || item.status !== "queued") {
    return Promise.resolve(null);
  }
  const updated = { ...item, status, updated_at: now };
  queue.set(queueId, updated);
  return Promise.resolve(updated);
}

export const listOfflineQueueByUserAsync = async (
  userId: string,
  status?: OfflineQueueStatus,
): Promise<OfflineQueueItem[]> => {
  if (isPostgresEnabled()) {
    const rows = status
      ? await query<OfflineQueueItem>(
          `SELECT id, user_id, task_instance_id, status, created_at::text, updated_at::text
           FROM offline_run_queues WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC`,
          [userId, status],
        )
      : await query<OfflineQueueItem>(
          `SELECT id, user_id, task_instance_id, status, created_at::text, updated_at::text
           FROM offline_run_queues WHERE user_id = $1 ORDER BY created_at DESC`,
          [userId],
        );
    return rows;
  }
  return [...queue.values()]
    .filter((q) => q.user_id === userId && (status ? q.status === status : true))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
};

export const resetOfflineQueueStore = (): void => {
  if (isPostgresEnabled()) return;
  queue.clear();
};
