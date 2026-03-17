import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { listAuditEventsAsync } from "../src/modules/audit/audit.store";

describe("mainline launch closure checklist", () => {
  describe("2.2 health check", () => {
    it("GET /api/v1/health returns 200 with status and checks", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/health");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveProperty("status");
      expect(["healthy", "degraded"]).toContain(body.data.status);
      expect(body.data).toHaveProperty("checks");
    });
  });

  describe("1.1 unified identity", () => {
    it("GET /api/v1/me without X-Actor-Id returns 401", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/me");
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error?.code).toBe("actor_required");
    });

    it("GET /api/v1/me with X-Actor-Id returns actor context", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/me", {
        headers: { "X-Actor-Id": "user-trusted", "X-Actor-Role": "user" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.actor.id).toBe("user-trusted");
      expect(body.data.actor.role).toBe("user");
    });

    it("delegation GET with X-Actor-Id uses header (no deprecated audit)", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "g-header",
          granter_id: "g-header",
          grantee_id: "e-header",
          expires_at: expiresAt,
        }),
      });
      expect(createRes.status).toBe(201);
      const ticketId = (await createRes.json()).data.id;
      const getRes = await app.request(`/api/v1/delegations/tickets/${ticketId}`, {
        headers: { "X-Actor-Id": "g-header" },
      });
      expect(getRes.status).toBe(200);
      const { data: auditData } = await listAuditEventsAsync({
        eventType: "identity.deprecated_actor_id_used",
        limit: 5,
      });
      const deprecatedForThis = auditData.filter(
        (e) => (e.payload as { endpoint?: string })?.endpoint === "GET /api/v1/delegations/tickets/:id",
      );
      expect(deprecatedForThis.length).toBe(0);
    });

    it("delegation GET with query actor_id emits deprecated audit", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "g-deprecated",
          granter_id: "g-deprecated",
          grantee_id: "e-deprecated",
          expires_at: expiresAt,
        }),
      });
      expect(createRes.status).toBe(201);
      const ticketId = (await createRes.json()).data.id;
      await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=g-deprecated`);
      const { data: auditData } = await listAuditEventsAsync({
        eventType: "identity.deprecated_actor_id_used",
        limit: 10,
      });
      const match = auditData.find(
        (e) => (e.payload as { endpoint?: string })?.endpoint === "GET /api/v1/delegations/tickets/:id",
      );
      expect(match).toBeDefined();
      expect((match!.payload as { source?: string }).source).toBe("query");
    });
  });

  describe("1.2 / 1.4 forbidden semantics", () => {
    it("delegation GET non-owner returns 403 with code forbidden", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "g",
          granter_id: "g",
          grantee_id: "e",
          expires_at: expiresAt,
        }),
      });
      expect(createRes.status).toBe(201);
      const ticketId = (await createRes.json()).data.id;
      const res = await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=other`);
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error?.code).toBe("forbidden");
      expect(body.error?.message).toContain("granter or grantee");
    });
  });

  describe("2.1 preflight", () => {
    it("GET /api/v1/preflight returns 200 when healthy", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/preflight");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("healthy");
      expect(body.meta?.preflight).toBe(true);
    });
  });

  describe("1.2 review-queue requires actor", () => {
    it("GET /api/v1/review-queue without actor_id returns 400", async () => {
      const app = createApp();
      const res = await app.request("/api/v1/review-queue");
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("actor_id_required");
    });
  });

  describe("1.2 user-task-instances 403 uses code forbidden", () => {
    it("PATCH task as non-owner returns 403 with code forbidden", async () => {
      const app = createApp();
      const createRes = await app.request("/api/v1/user-task-instances", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: "owner-1", name: "Task", schedule_cron: "0 * * * *" }),
      });
      const taskId = (await createRes.json()).data.id;
      const res = await app.request(`/api/v1/user-task-instances/${taskId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "other-user", name: "Hacked" }),
      });
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe("forbidden");
    });
  });

  describe("3.3 settings audit", () => {
    it("PATCH notification preferences emits settings.notification_preferences_updated audit", async () => {
      const app = createApp();
      await app.request("/api/v1/users/settings-user-1/notification-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channels: ["in_app"], strategy: "only_exceptions" }),
      });
      const { data: events } = await listAuditEventsAsync({
        eventType: "settings.notification_preferences_updated",
        limit: 5,
      });
      const match = events.find(
        (e) => (e.payload as { user_id?: string })?.user_id === "settings-user-1",
      );
      expect(match).toBeDefined();
    });
  });
});
