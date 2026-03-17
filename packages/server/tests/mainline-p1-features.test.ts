import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("mainline P1 features", () => {
  describe("offline run queue (queue / cancel / cloud-degrade)", () => {
    it("POST queue, GET queued, POST cancel", async () => {
      const app = createApp();
      const userId = "user-p1-queue";
      const createRes = await app.request("/api/v1/user-task-instances", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: "P1 Queue Task",
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
      const queueRes = await app.request(`/api/v1/user-task-instances/${taskId}/queue`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      expect(queueRes.status).toBe(201);
      const queueBody = await queueRes.json();
      const queueId = queueBody.data.id as string;
      expect(queueBody.data.status).toBe("queued");

      const listRes = await app.request(
        `/api/v1/user-task-instances/queued?actor_id=${userId}&status=queued`,
      );
      expect(listRes.status).toBe(200);
      const list = (await listRes.json()).data as Array<{ id: string; status: string }>;
      expect(list.some((q) => q.id === queueId)).toBe(true);

      const cancelRes = await app.request(
        `/api/v1/user-task-instances/queued/${queueId}/cancel`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ actor_id: userId }),
        },
      );
      expect(cancelRes.status).toBe(200);
      expect((await cancelRes.json()).data.status).toBe("cancelled");
    });

    it("POST cloud-degrade runs task and marks queue cloud_degraded", async () => {
      const app = createApp();
      const userId = "user-p1-cloud";
      const createRes = await app.request("/api/v1/user-task-instances", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: "Cloud Degrade Task",
          schedule_cron: "0 * * * *",
        }),
      });
      const taskId = (await createRes.json()).data.id as string;
      await app.request(`/api/v1/user-task-instances/${taskId}/resume`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      const queueRes = await app.request(`/api/v1/user-task-instances/${taskId}/queue`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      const queueId = (await queueRes.json()).data.id as string;
      const degradeRes = await app.request(
        `/api/v1/user-task-instances/queued/${queueId}/cloud-degrade`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ actor_id: userId }),
        },
      );
      expect(degradeRes.status).toBe(200);
      const body = await degradeRes.json();
      expect(body.data.run).toBeDefined();
      expect(body.data.queue_status).toBe("cloud_degraded");
    });
  });

  describe("multi-device authorization", () => {
    it("create with device_id, list by device_id, revoke-by-device", async () => {
      const app = createApp();
      const userId = "user-p1-device";
      const deviceId = "device-abc";
      const createRes = await app.request("/api/v1/connectors/authorizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          device_id: deviceId,
          connector: "notion",
          scope_level: "application",
          scope_value: "app-1",
          expires_in_sec: 3600,
        }),
      });
      expect(createRes.status).toBe(201);
      expect((await createRes.json()).data.device_id).toBe(deviceId);

      const listRes = await app.request(
        `/api/v1/connectors/authorizations?user_id=${userId}&device_id=${deviceId}`,
      );
      expect(listRes.status).toBe(200);
      const list = (await listRes.json()).data as Array<{ device_id: string | null }>;
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0]?.device_id).toBe(deviceId);

      const revokeRes = await app.request("/api/v1/connectors/authorizations/revoke-by-device", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: userId, device_id: deviceId, actor_id: userId }),
      });
      expect(revokeRes.status).toBe(200);
      expect((await revokeRes.json()).data.revoked_count).toBeGreaterThanOrEqual(1);
    });
  });

  describe("privacy mode and minor gating", () => {
    it("POST /ask with privacy_mode returns meta.privacy_mode", async () => {
      const app = createApp();
      await app.request("/api/v1/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "P1 Agent",
          description: "p1",
          agent_type: "execution",
          source_url: "mock://p1",
          capabilities: [{ name: "p1", risk_level: "low" }],
        }),
      });
      const res = await app.request("/api/v1/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "secret query", privacy_mode: true }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.meta?.privacy_mode).toBe(true);
    });

    it("POST /ask with age_category minor returns minor_gating_applied", async () => {
      const app = createApp();
      await app.request("/api/v1/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "P1 Minor Agent",
          description: "p1",
          agent_type: "execution",
          source_url: "mock://p1-minor",
          capabilities: [{ name: "p1", risk_level: "low" }],
        }),
      });
      const res = await app.request("/api/v1/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "query", age_category: "minor" }),
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.meta?.minor_gating_applied).toBe(true);
      expect(body.meta?.minor_gating_disclaimer).toBeDefined();
    });
  });
});
