import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { listAuditEventsAsync } from "../src/modules/audit/audit.store";
import {
  recordT5PhaseSummaryAsync,
  interruptT5DelegationAsync,
} from "../src/modules/delegations/t5-summary.service";
import { listNotificationEventsAsync } from "../src/modules/notifications/notification.store";

describe("mainline topology T1-T5", () => {
  describe("conversation topology and session-level metadata", () => {
    it("creates conversation with default T1 topology and returns it on get/list", async () => {
      const app = createApp();

      const createRes = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Default topology chat" }),
      });
      expect(createRes.status).toBe(201);
      const createBody = await createRes.json();
      const conversationId = createBody.data.id as string;
      expect(createBody.data.conversation_topology).toBe("T1");
      expect(createBody.data.authorization_mode).toBe("user_explicit");
      expect(createBody.data.visibility_mode).toBe("full");
      expect(createBody.data.risk_level).toBe("low");

      const getRes = await app.request(`/api/v1/conversations/${conversationId}`);
      expect(getRes.status).toBe(200);
      const getBody = await getRes.json();
      expect(getBody.data.conversation.conversation_topology).toBe("T1");
      expect(getBody.data.conversation.authorization_mode).toBe("user_explicit");
      expect(getBody.data.conversation.visibility_mode).toBe("full");
      expect(getBody.data.conversation.risk_level).toBe("low");

      const listRes = await app.request("/api/v1/conversations");
      expect(listRes.status).toBe(200);
      const listBody = await listRes.json();
      const found = listBody.data.find((c: { id: string }) => c.id === conversationId);
      expect(found).toBeDefined();
      expect(found.conversation_topology).toBe("T1");
      expect(found.authorization_mode).toBe("user_explicit");
    });

    it("creates conversation with T5 topology and delegated authorization", async () => {
      const app = createApp();

      const createRes = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "T5 delegated chat",
          conversation_topology: "T5",
          authorization_mode: "delegated",
          visibility_mode: "summarized",
          risk_level: "medium",
        }),
      });
      expect(createRes.status).toBe(201);
      const body = await createRes.json();
      expect(body.data.conversation_topology).toBe("T5");
      expect(body.data.authorization_mode).toBe("delegated");
      expect(body.data.visibility_mode).toBe("summarized");
      expect(body.data.risk_level).toBe("medium");
    });
  });

  describe("delegation ticket (T5)", () => {
    it("create ticket requires actor_id to match granter_id", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const res = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "attacker",
          granter_id: "real-granter",
          grantee_id: "worker",
          expires_at: expiresAt,
        }),
      });
      expect(res.status).toBe(403);
      expect((await res.json()).error.code).toBe("forbidden");
    });

    it("creates ticket, gets by id (with actor_id), revokes (granter), then get returns revoked", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();

      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "user-alpha",
          granter_id: "user-alpha",
          grantee_id: "agent-beta",
          scope_capabilities: ["summarize", "search"],
          scope_objects: ["conversation:conv-1"],
          scope_data_domain: "internal",
          expires_at: expiresAt,
        }),
      });
      expect(createRes.status).toBe(201);
      const createBody = await createRes.json();
      const ticketId = createBody.data.id as string;

      const getRes = await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=user-alpha`);
      expect(getRes.status).toBe(200);
      const getBody = await getRes.json();
      expect(getBody.data.id).toBe(ticketId);
      expect(getBody.data.revoked).toBe(false);

      const revokeRes = await app.request(`/api/v1/delegations/tickets/${ticketId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "user-alpha" }),
      });
      expect(revokeRes.status).toBe(200);
      const revokeBody = await revokeRes.json();
      expect(revokeBody.data.revoked).toBe(true);
      expect(revokeBody.data.revoked_at).toBeTypeOf("string");

      const getAfterRes = await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=user-alpha`);
      expect(getAfterRes.status).toBe(200);
      expect((await getAfterRes.json()).data.revoked).toBe(true);
    });

    it("GET ticket without actor_id returns 400", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "g1",
          granter_id: "g1",
          grantee_id: "e1",
          expires_at: expiresAt,
        }),
      });
      const ticketId = (await createRes.json()).data.id;
      const res = await app.request(`/api/v1/delegations/tickets/${ticketId}`);
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe("actor_id_required");
    });

    it("owner (granter) read ok", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "granter-1", granter_id: "granter-1", grantee_id: "grantee-1", expires_at: expiresAt }),
      });
      const ticketId = (await createRes.json()).data.id;
      const getRes = await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=granter-1`);
      expect(getRes.status).toBe(200);
      expect((await getRes.json()).data.granter_id).toBe("granter-1");
    });

    it("owner (grantee) read ok", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "granter-2", granter_id: "granter-2", grantee_id: "grantee-2", expires_at: expiresAt }),
      });
      const ticketId = (await createRes.json()).data.id;
      const getRes = await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=grantee-2`);
      expect(getRes.status).toBe(200);
      expect((await getRes.json()).data.grantee_id).toBe("grantee-2");
    });

    it("non-owner read returns 403", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "g", granter_id: "g", grantee_id: "e", expires_at: expiresAt }),
      });
      const ticketId = (await createRes.json()).data.id;
      const getRes = await app.request(`/api/v1/delegations/tickets/${ticketId}?actor_id=other-user`);
      expect(getRes.status).toBe(403);
      expect((await getRes.json()).error.code).toBe("forbidden");
    });

    it("owner (granter) revoke ok", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "revoker", granter_id: "revoker", grantee_id: "e", expires_at: expiresAt }),
      });
      const ticketId = (await createRes.json()).data.id;
      const revokeRes = await app.request(`/api/v1/delegations/tickets/${ticketId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "revoker" }),
      });
      expect(revokeRes.status).toBe(200);
      expect((await revokeRes.json()).data.revoked).toBe(true);
    });

    it("non-owner revoke returns 403", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "granter-only",
          granter_id: "granter-only",
          grantee_id: "grantee-only",
          expires_at: expiresAt,
        }),
      });
      const ticketId = (await createRes.json()).data.id;
      const revokeRes = await app.request(`/api/v1/delegations/tickets/${ticketId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "grantee-only" }),
      });
      expect(revokeRes.status).toBe(403);
      expect((await revokeRes.json()).error.code).toBe("forbidden");
    });

    it("revoke without actor_id returns 400", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "g", granter_id: "g", grantee_id: "e", expires_at: expiresAt }),
      });
      const ticketId = (await createRes.json()).data.id;
      const revokeRes = await app.request(`/api/v1/delegations/tickets/${ticketId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(revokeRes.status).toBe(400);
    });

    it("idempotent revoke: second revoke returns 200 with same revoked ticket", async () => {
      const app = createApp();
      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const createRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "idem-g", granter_id: "idem-g", grantee_id: "e", expires_at: expiresAt }),
      });
      const ticketId = (await createRes.json()).data.id;
      const first = await app.request(`/api/v1/delegations/tickets/${ticketId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "idem-g" }),
      });
      expect(first.status).toBe(200);
      const second = await app.request(`/api/v1/delegations/tickets/${ticketId}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: "idem-g" }),
      });
      expect(second.status).toBe(200);
      const firstBody = await first.json();
      const secondBody = await second.json();
      expect(firstBody.data.revoked).toBe(true);
      expect(secondBody.data.revoked).toBe(true);
      expect(secondBody.data.id).toBe(firstBody.data.id);
    });

    it("returns 404 for non-existent ticket when actor_id provided", async () => {
      const app = createApp();
      const res = await app.request(
        "/api/v1/delegations/tickets/00000000-0000-0000-0000-000000000000?actor_id=someone",
      );
      expect(res.status).toBe(404);
    });
  });

  describe("T5 phase summary and interrupt (audit + notify)", () => {
    it("recordT5PhaseSummaryAsync emits audit and notification for granter", async () => {
      createApp(); // reset stores
      await recordT5PhaseSummaryAsync({
        conversation_id: "conv-t5-1",
        delegation_ticket_id: "ticket-1",
        granter_id: "granter-user",
        phase: "phase_1",
        summary: "Completed step A.",
      });

      const { data: auditEvents } = await listAuditEventsAsync({
        eventType: "delegation.phase_summary",
        limit: 10,
      });
      const match = auditEvents.find(
        (e) =>
          e.payload?.delegation_ticket_id === "ticket-1" &&
          (e.payload as { phase?: string }).phase === "phase_1",
      );
      expect(match).toBeDefined();
      expect((match!.payload as { summary?: string }).summary).toBe("Completed step A.");

      const notifications = await listNotificationEventsAsync("granter-user", 10);
      const notifMatch = notifications.find(
        (n) =>
          n.event_type === "delegation.phase_summary" &&
          (n.payload as { phase?: string }).phase === "phase_1",
      );
      expect(notifMatch).toBeDefined();
      expect((notifMatch!.payload as { summary?: string }).summary).toBe("Completed step A.");
    });

    it("interruptT5DelegationAsync emits audit and notifies granter on budget_exceeded", async () => {
      createApp(); // reset stores
      await interruptT5DelegationAsync({
        conversation_id: "conv-t5-2",
        delegation_ticket_id: "ticket-2",
        granter_id: "granter-user-2",
        reason: "budget_exceeded",
        detail: "Token limit 1000 exceeded.",
      });

      const { data: auditEvents } = await listAuditEventsAsync({
        eventType: "delegation.interrupted",
        limit: 10,
      });
      const match = auditEvents.find(
        (e) =>
          (e.payload as { delegation_ticket_id?: string }).delegation_ticket_id === "ticket-2" &&
          (e.payload as { reason?: string }).reason === "budget_exceeded",
      );
      expect(match).toBeDefined();
      expect((match!.payload as { detail?: string }).detail).toBe("Token limit 1000 exceeded.");

      const notifications = await listNotificationEventsAsync("granter-user-2", 10);
      const notifMatch = notifications.find(
        (n) =>
          n.event_type === "delegation.interrupted" &&
          (n.payload as { reason?: string }).reason === "budget_exceeded",
      );
      expect(notifMatch).toBeDefined();
    });

    it("interruptT5DelegationAsync notifies granter on policy_violation", async () => {
      createApp(); // reset stores
      await interruptT5DelegationAsync({
        conversation_id: "conv-t5-3",
        delegation_ticket_id: "ticket-3",
        granter_id: "granter-user-3",
        reason: "policy_violation",
        detail: "Sensitive domain access denied.",
      });

      const notifications = await listNotificationEventsAsync("granter-user-3", 10);
      const match = notifications.find(
        (n) =>
          n.event_type === "delegation.interrupted" &&
          (n.payload as { reason?: string }).reason === "policy_violation",
      );
      expect(match).toBeDefined();
    });
  });

  describe("T5 phase summary and interrupt via real API (E2E)", () => {
    it("POST conversation message with T5 delegation_ticket_id produces audit and notification events", async () => {
      const app = createApp();

      const convRes = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "T5 E2E",
          conversation_topology: "T5",
          authorization_mode: "delegated",
        }),
      });
      expect(convRes.status).toBe(201);
      const conversationId = (await convRes.json()).data.id as string;

      const expiresAt = new Date(Date.now() + 3600_000).toISOString();
      const ticketRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "granter-e2e",
          granter_id: "granter-e2e",
          grantee_id: "grantee-e2e",
          scope_capabilities: ["summarize"],
          scope_objects: [`conversation:${conversationId}`],
          expires_at: expiresAt,
        }),
      });
      expect(ticketRes.status).toBe(201);
      const ticketId = (await ticketRes.json()).data.id as string;

      const agentRes = await app.request("/api/v1/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "T5 Low Agent",
          description: "low risk for E2E",
          agent_type: "execution",
          source_url: "mock://t5-e2e-agent",
          capabilities: [{ name: "summarize", risk_level: "low" }],
        }),
      });
      expect(agentRes.status).toBe(201);
      const agentId = (await agentRes.json()).data.id as string;

      await app.request(`/api/v1/conversations/${conversationId}/agents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: agentId }),
      });

      const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_id: "grantee-e2e",
          text: "Summarize this.",
          delegation_ticket_id: ticketId,
        }),
      });
      expect(msgRes.status).toBe(201);

      const auditRes = await app.request(
        `/api/v1/audit-events?event_type=delegation.phase_summary&limit=20`,
      );
      expect(auditRes.status).toBe(200);
      const auditBody = await auditRes.json();
      const phaseEvent = auditBody.data.find(
        (e: { payload?: { delegation_ticket_id?: string; phase?: string } }) =>
          e.payload?.delegation_ticket_id === ticketId && e.payload?.phase === "message_round",
      );
      expect(phaseEvent).toBeDefined();
      expect((phaseEvent.payload as { summary?: string }).summary).toBeDefined();

      const notifRes = await app.request("/api/v1/users/granter-e2e/notifications?limit=20");
      expect(notifRes.status).toBe(200);
      const notifBody = await notifRes.json();
      const phaseNotif = notifBody.data.find(
        (n: { event_type: string; payload?: { delegation_ticket_id?: string } }) =>
          n.event_type === "delegation.phase_summary" && n.payload?.delegation_ticket_id === ticketId,
      );
      expect(phaseNotif).toBeDefined();
    });

    it("rejects expired delegation ticket on message execution", async () => {
      const app = createApp();
      const convRes = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "T5 expired ticket",
          conversation_topology: "T5",
          authorization_mode: "delegated",
        }),
      });
      const conversationId = (await convRes.json()).data.id as string;

      const ticketRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "g-expired",
          granter_id: "g-expired",
          grantee_id: "worker-expired",
          expires_at: new Date(Date.now() - 30_000).toISOString(),
        }),
      });
      const ticketId = (await ticketRes.json()).data.id as string;

      const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_id: "worker-expired",
          text: "hello",
          delegation_ticket_id: ticketId,
        }),
      });
      expect(msgRes.status).toBe(400);
      expect((await msgRes.json()).error.code).toBe("delegation_ticket_expired");
    });

    it("rejects scope violation and emits interruption notification", async () => {
      const app = createApp();
      const convRes = await app.request("/api/v1/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "T5 scope violation",
          conversation_topology: "T5",
          authorization_mode: "delegated",
        }),
      });
      const conversationId = (await convRes.json()).data.id as string;

      const ticketRes = await app.request("/api/v1/delegations/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actor_id: "scope-granter",
          granter_id: "scope-granter",
          grantee_id: "scope-worker",
          scope_capabilities: ["search"],
          scope_objects: [`conversation:${conversationId}`],
          expires_at: new Date(Date.now() + 3600_000).toISOString(),
        }),
      });
      const ticketId = (await ticketRes.json()).data.id as string;

      const agentRes = await app.request("/api/v1/agents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Scope Agent",
          description: "cap mismatch",
          agent_type: "execution",
          source_url: "mock://scope-agent",
          capabilities: [{ name: "summarize", risk_level: "low" }],
        }),
      });
      const agentId = (await agentRes.json()).data.id as string;
      await app.request(`/api/v1/conversations/${conversationId}/agents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: agentId }),
      });

      const msgRes = await app.request(`/api/v1/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sender_id: "scope-worker",
          text: "run summarize",
          delegation_ticket_id: ticketId,
        }),
      });
      expect(msgRes.status).toBe(403);
      expect((await msgRes.json()).error.code).toBe("delegation_scope_violation");

      const notifRes = await app.request("/api/v1/users/scope-granter/notifications?limit=20");
      const notifBody = await notifRes.json();
      const interrupted = notifBody.data.find(
        (n: { event_type: string; payload?: { delegation_ticket_id?: string; reason?: string } }) =>
          n.event_type === "delegation.interrupted" &&
          n.payload?.delegation_ticket_id === ticketId &&
          n.payload?.reason === "policy_violation",
      );
      expect(interrupted).toBeDefined();
    });
  });
});
