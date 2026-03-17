import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline notification policy (P0-2 G)", () => {
  it("GET/PATCH /api/v1/users/:id/notification-preferences support in_app, email and only_exceptions|all_runs", async () => {
    const app = createApp();
    const userId = "user-notif-1";
    const getRes = await app.request(`/api/v1/users/${userId}/notification-preferences`);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.data.user_id).toBe(userId);
    expect(Array.isArray(getBody.data.channels)).toBe(true);
    expect(["only_exceptions", "all_runs"]).toContain(getBody.data.strategy);

    const patchRes = await app.request(`/api/v1/users/${userId}/notification-preferences`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channels: ["in_app", "email"],
        strategy: "all_runs",
      }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.data.channels).toEqual(["in_app", "email"]);
    expect(patchBody.data.strategy).toBe("all_runs");
  });

  it("scheduler run failure produces notification event", async () => {
    const app = createApp();
    const userId = "user-scheduler-fail-1";
    const createRes = await app.request("/api/v1/user-task-instances", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        name: "Notify on fail",
        schedule_cron: "0 * * * *",
      }),
    });
    expect(createRes.status).toBe(201);
    const taskId = (await createRes.json()).data.id as string;
    await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor_id: userId }),
    });
    const tickRes = await app.request("/api/v1/user-task-instances/scheduler/tick", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        actor_id: userId,
        limit: 10,
        retry_max: 0,
        simulate_failure_task_ids: [taskId],
      }),
    });
    expect(tickRes.status).toBe(200);
    const tickBody = await tickRes.json();
    expect(tickBody.data.failed_count).toBeGreaterThanOrEqual(1);

    const notifRes = await app.request(`/api/v1/users/${userId}/notifications?limit=10`);
    expect(notifRes.status).toBe(200);
    const notifBody = await notifRes.json();
    expect(Array.isArray(notifBody.data)).toBe(true);
    const schedulerFailed = notifBody.data.find(
      (e: { event_type: string }) => e.event_type === "scheduler_run_failed",
    );
    expect(schedulerFailed).toBeDefined();
    expect(schedulerFailed.payload.task_instance_id).toBe(taskId);
  });
});
