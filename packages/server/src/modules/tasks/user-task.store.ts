import { randomUUID } from "node:crypto";
import { isPostgresEnabled, query } from "../../infra/db/client";

export type UserTaskStatus = "draft" | "active" | "paused" | "archived" | "deleted";

export interface UserTaskInstance {
  id: string;
  user_id: string;
  name: string;
  schedule_cron: string;
  status: UserTaskStatus;
  created_at: string;
  updated_at: string;
}

export interface UserTaskRun {
  id: string;
  task_instance_id: string;
  actor_id: string;
  status: "completed" | "failed";
  summary: string;
  created_at: string;
}

const tasks = new Map<string, UserTaskInstance>();
const runsByTask = new Map<string, UserTaskRun[]>();

const nowIso = (): string => new Date().toISOString();

export const createUserTaskInstanceAsync = async (input: {
  userId: string;
  name: string;
  scheduleCron: string;
}): Promise<UserTaskInstance> => {
  const now = nowIso();
  const task: UserTaskInstance = {
    id: randomUUID(),
    user_id: input.userId,
    name: input.name,
    schedule_cron: input.scheduleCron,
    status: "draft",
    created_at: now,
    updated_at: now,
  };
  if (isPostgresEnabled()) {
    await query(
      `INSERT INTO user_task_instances
       (id, user_id, name, schedule_cron, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [task.id, task.user_id, task.name, task.schedule_cron, task.status, task.created_at, task.updated_at],
    );
  } else {
    tasks.set(task.id, task);
    runsByTask.set(task.id, []);
  }
  return task;
};

export const getUserTaskInstanceByIdAsync = async (
  taskId: string,
): Promise<UserTaskInstance | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<UserTaskInstance>(
      `SELECT id, user_id, name, schedule_cron, status, created_at::text, updated_at::text
       FROM user_task_instances
       WHERE id = $1`,
      [taskId],
    );
    return rows[0] ?? null;
  }
  return tasks.get(taskId) ?? null;
};
export const updateUserTaskStatusAsync = async (
  taskId: string,
  status: UserTaskStatus,
): Promise<UserTaskInstance | null> => {
  if (isPostgresEnabled()) {
    const rows = await query<UserTaskInstance>(
      `UPDATE user_task_instances
       SET status = $2, updated_at = $3
       WHERE id = $1
       RETURNING id, user_id, name, schedule_cron, status, created_at::text, updated_at::text`,
      [taskId, status, nowIso()],
    );
    return rows[0] ?? null;
  }
  const task = tasks.get(taskId);
  if (!task) return null;
  const updated: UserTaskInstance = {
    ...task,
    status,
    updated_at: nowIso(),
  };
  tasks.set(taskId, updated);
  return updated;
};

export const updateUserTaskInstanceParamsAsync = async (
  taskId: string,
  params: { name?: string; schedule_cron?: string },
): Promise<UserTaskInstance | null> => {
  if (!params.name && !params.schedule_cron) {
    return getUserTaskInstanceByIdAsync(taskId);
  }
  if (isPostgresEnabled()) {
    const updates: string[] = ["updated_at = $2"];
    const values: unknown[] = [taskId, nowIso()];
    let idx = 3;
    if (params.name !== undefined) {
      updates.push(`name = $${idx}`);
      values.push(params.name);
      idx += 1;
    }
    if (params.schedule_cron !== undefined) {
      updates.push(`schedule_cron = $${idx}`);
      values.push(params.schedule_cron);
    }
    const rows = await query<UserTaskInstance>(
      `UPDATE user_task_instances SET ${updates.join(", ")} WHERE id = $1 RETURNING id, user_id, name, schedule_cron, status, created_at::text, updated_at::text`,
      values,
    );
    return rows[0] ?? null;
  }
  const task = tasks.get(taskId);
  if (!task) return null;
  const updated: UserTaskInstance = {
    ...task,
    ...(params.name !== undefined && { name: params.name }),
    ...(params.schedule_cron !== undefined && { schedule_cron: params.schedule_cron }),
    updated_at: nowIso(),
  };
  tasks.set(taskId, updated);
  return updated;
};

export const appendUserTaskRunAsync = async (input: {
  taskInstanceId: string;
  actorId: string;
  status: "completed" | "failed";
  summary: string;
}): Promise<UserTaskRun | null> => {
  const createdAt = nowIso();
  if (isPostgresEnabled()) {
    const taskRows = await query<{ id: string }>(`SELECT id FROM user_task_instances WHERE id = $1`, [
      input.taskInstanceId,
    ]);
    if (!taskRows[0]) {
      return null;
    }
    const run: UserTaskRun = {
      id: randomUUID(),
      task_instance_id: input.taskInstanceId,
      actor_id: input.actorId,
      status: input.status,
      summary: input.summary,
      created_at: createdAt,
    };
    await query(
      `INSERT INTO user_task_runs (id, task_instance_id, actor_id, status, summary, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [run.id, run.task_instance_id, run.actor_id, run.status, run.summary, run.created_at],
    );
    return run;
  }
  const task = tasks.get(input.taskInstanceId);
  if (!task) return null;
  const run: UserTaskRun = {
    id: randomUUID(),
    task_instance_id: input.taskInstanceId,
    actor_id: input.actorId,
    status: input.status,
    summary: input.summary,
    created_at: createdAt,
  };
  const runs = runsByTask.get(input.taskInstanceId) ?? [];
  runs.push(run);
  runsByTask.set(input.taskInstanceId, runs);
  return run;
};

export const listUserTaskRunsAsync = async (taskId: string): Promise<UserTaskRun[] | null> => {
  if (isPostgresEnabled()) {
    const taskRows = await query<{ id: string }>(`SELECT id FROM user_task_instances WHERE id = $1`, [taskId]);
    if (!taskRows[0]) {
      return null;
    }
    return query<UserTaskRun>(
      `SELECT id, task_instance_id, actor_id, status, summary, created_at::text
       FROM user_task_runs
       WHERE task_instance_id = $1
       ORDER BY created_at ASC`,
      [taskId],
    );
  }
  if (!tasks.has(taskId)) return null;
  return [...(runsByTask.get(taskId) ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
};

export const listUserTaskInstancesAsync = async (input: {
  userId?: string;
  status?: UserTaskStatus;
  limit?: number;
}): Promise<UserTaskInstance[]> => {
  const limit = Math.max(1, Math.min(100, input.limit ?? 20));
  if (isPostgresEnabled()) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (input.userId) {
      params.push(input.userId);
      clauses.push(`user_id = $${params.length}`);
    }
    if (input.status) {
      params.push(input.status);
      clauses.push(`status = $${params.length}`);
    }
    params.push(limit);
    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    return query<UserTaskInstance>(
      `SELECT id, user_id, name, schedule_cron, status, created_at::text, updated_at::text
       FROM user_task_instances
       ${whereSql}
       ORDER BY updated_at DESC
       LIMIT $${params.length}`,
      params,
    );
  }
  return [...tasks.values()]
    .filter((task) => (input.userId ? task.user_id === input.userId : true))
    .filter((task) => (input.status ? task.status === input.status : true))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, limit);
};

export const resetUserTaskStore = (): void => {
  if (isPostgresEnabled()) {
    return;
  }
  tasks.clear();
  runsByTask.clear();
};
