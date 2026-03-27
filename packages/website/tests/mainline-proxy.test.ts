/**
 * Real entry-point tests for mainline proxy routes.
 * Covers: 502 + mainline_unreachable when mainline is unreachable;
 * success passthrough (status and body) when mainline returns 2xx.
 * Run with test:governance / release:gate.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as askPost } from "@/app/api/mainline/ask/route";
import { POST as askFallbackRetryPost } from "@/app/api/mainline/ask/[id]/fallback/retry/route";
import { POST as askFallbackAlternativePost } from "@/app/api/mainline/ask/[id]/fallback/alternative/route";
import { POST as askFallbackDegradedPost } from "@/app/api/mainline/ask/[id]/fallback/degraded/route";
import { GET as reviewQueueGet } from "@/app/api/mainline/review-queue/route";
import { POST as reviewApprovePost } from "@/app/api/mainline/review-queue/[invocationId]/approve/route";
import { POST as reviewDenyPost } from "@/app/api/mainline/review-queue/[invocationId]/deny/route";
import { POST as reviewAskMoreInfoPost } from "@/app/api/mainline/review-queue/[invocationId]/ask-more-info/route";
import { GET as userTaskInstancesGet, POST as userTaskInstancesPost } from "@/app/api/mainline/user-task-instances/route";
import { GET as userTaskHistoryGet } from "@/app/api/mainline/user-task-instances/[id]/history/route";
import { GET as userTaskExportGet } from "@/app/api/mainline/user-task-instances/[id]/export/route";
import {
  GET as connectorsAuthorizationsGet,
  POST as connectorsAuthorizationsPost,
} from "@/app/api/mainline/connectors/authorizations/route";
import { POST as connectorsAuthorizationsRevokePost } from "@/app/api/mainline/connectors/authorizations/[id]/revoke/route";
import { GET as localActionReceiptGet } from "@/app/api/mainline/connectors/local-action-receipts/[id]/route";
import { GET as notionCloudGet } from "@/app/api/mainline/connectors/notion/[...path]/route";
import { GET as desktopConnectorGet } from "@/app/api/mainline/connectors/desktop/[...path]/route";
import { GET as externalActionReceiptGet } from "@/app/api/mainline/connectors/external-action-receipts/[id]/route";
import { POST as connectorsFileUploadPost } from "@/app/api/mainline/connectors/file-upload/route";
import { GET as usageCountersGet } from "@/app/api/mainline/usage/counters/route";
import { GET as usageLimitsGet } from "@/app/api/mainline/usage/limits/route";
import { PATCH as agentGatewayListingPatch } from "@/app/api/mainline/agents/[id]/gateway-listing/route";
import { GET as notificationsGet } from "@/app/api/mainline/notifications/route";
import { POST as notificationsReadAllPost } from "@/app/api/mainline/notifications/read-all/route";
import { POST as notificationReadPost } from "@/app/api/mainline/notifications/[id]/read/route";
import { GET as spacePresenceGet } from "@/app/api/mainline/spaces/[id]/presence/route";
import {
  DELETE as spaceMemberDelete,
  PATCH as spaceMemberPatch,
} from "@/app/api/mainline/spaces/[id]/members/[userId]/route";
import { GET as auditEventsGet } from "@/app/api/mainline/audit-events/route";
import { GET as invocationByIdGet } from "@/app/api/mainline/invocations/[id]/route";
import { POST as orchestrationSchedulePost } from "@/app/api/mainline/orchestrations/schedule/route";
import { GET as orchestrationsScheduledGet } from "@/app/api/mainline/orchestrations/scheduled/route";
import { PATCH as orchestrationsScheduledPatch } from "@/app/api/mainline/orchestrations/scheduled/[id]/route";
import { POST as orchestrationResumePost } from "@/app/api/mainline/orchestrations/[id]/resume/route";
import { POST as messageReportPost } from "@/app/api/mainline/messages/[id]/report/route";
import { POST as messageHidePost } from "@/app/api/mainline/messages/[id]/hide/route";

function nextRequest(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as NextRequest;
}

const MAINLINE_UNREACHABLE_BODY = {
  error: { code: "mainline_unreachable", message: "Mainline API unreachable" },
};

describe("mainline proxy (real entry)", () => {
  let fetchStub: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("502 when mainline unreachable", () => {
    beforeEach(() => {
      fetchStub.mockRejectedValue(new Error("network"));
    });

    test("GET /api/mainline/invocations/:id returns 502 when mainline unreachable", async () => {
      const res = await invocationByIdGet(nextRequest("http://localhost/api/mainline/invocations/inv-1"), {
        params: Promise.resolve({ id: "inv-1" }),
      });
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("W-20 orchestration schedule / scheduled / resume proxies return 502 when unreachable", async () => {
      const schedPost = await orchestrationSchedulePost(
        nextRequest("http://localhost/api/mainline/orchestrations/schedule", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ conversation_id: "c1", user_message: "x", steps: [] }),
        }),
      );
      expect(schedPost.status).toBe(502);
      expect(await schedPost.json()).toEqual(MAINLINE_UNREACHABLE_BODY);

      const list = await orchestrationsScheduledGet(nextRequest("http://localhost/api/mainline/orchestrations/scheduled"));
      expect(list.status).toBe(502);
      expect(await list.json()).toEqual(MAINLINE_UNREACHABLE_BODY);

      const patch = await orchestrationsScheduledPatch(
        nextRequest("http://localhost/api/mainline/orchestrations/scheduled/r1", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "pause" }),
        }),
        { params: Promise.resolve({ id: "r1" }) },
      );
      expect(patch.status).toBe(502);
      expect(await patch.json()).toEqual(MAINLINE_UNREACHABLE_BODY);

      const resume = await orchestrationResumePost(
        nextRequest("http://localhost/api/mainline/orchestrations/r1/resume", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ actor_id: "u1", action: "abandon_run" }),
        }),
        { params: Promise.resolve({ id: "r1" }) },
      );
      expect(resume.status).toBe(502);
      expect(await resume.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("W-21 POST messages/:id/report and hide return 502 when unreachable", async () => {
      const rep = await messageReportPost(
        nextRequest("http://localhost/api/mainline/messages/m1/report", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "spam" }),
        }),
        { params: Promise.resolve({ id: "m1" }) },
      );
      expect(rep.status).toBe(502);
      expect(await rep.json()).toEqual(MAINLINE_UNREACHABLE_BODY);

      const hid = await messageHidePost(
        nextRequest("http://localhost/api/mainline/messages/m1/hide", { method: "POST" }),
        { params: Promise.resolve({ id: "m1" }) },
      );
      expect(hid.status).toBe(502);
      expect(await hid.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST /api/mainline/ask returns 502 and mainline_unreachable", async () => {
      const req = nextRequest("http://localhost/api/mainline/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello" }),
      });
      const res = await askPost(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST /api/mainline/ask/:id/fallback/* returns 502", async () => {
      const retryRes = await askFallbackRetryPost(
        nextRequest("http://localhost/api/mainline/ask/ask-1/fallback/retry", { method: "POST" }),
        { params: Promise.resolve({ id: "ask-1" }) },
      );
      const alternativeRes = await askFallbackAlternativePost(
        nextRequest("http://localhost/api/mainline/ask/ask-1/fallback/alternative", { method: "POST" }),
        { params: Promise.resolve({ id: "ask-1" }) },
      );
      const degradedRes = await askFallbackDegradedPost(
        nextRequest("http://localhost/api/mainline/ask/ask-1/fallback/degraded", { method: "POST" }),
        { params: Promise.resolve({ id: "ask-1" }) },
      );

      expect(retryRes.status).toBe(502);
      expect(await retryRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(alternativeRes.status).toBe(502);
      expect(await alternativeRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(degradedRes.status).toBe(502);
      expect(await degradedRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/review-queue returns 502 and mainline_unreachable", async () => {
      const req = nextRequest("http://localhost/api/mainline/review-queue");
      const res = await reviewQueueGet(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/notifications and POST read-all / :id/read return 502 when unreachable", async () => {
      const listReq = nextRequest("http://localhost/api/mainline/notifications?limit=5");
      const listRes = await notificationsGet(listReq);
      expect(listRes.status).toBe(502);
      expect(await listRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);

      const allRes = await notificationsReadAllPost(
        nextRequest("http://localhost/api/mainline/notifications/read-all", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
      );
      expect(allRes.status).toBe(502);
      expect(await allRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);

      const oneRes = await notificationReadPost(
        nextRequest("http://localhost/api/mainline/notifications/n1/read", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
        { params: Promise.resolve({ id: "n1" }) },
      );
      expect(oneRes.status).toBe(502);
      expect(await oneRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST /api/mainline/review-queue/:id/(approve|deny|ask-more-info) returns 502", async () => {
      const params = { params: Promise.resolve({ invocationId: "inv-1" }) };
      const approveRes = await reviewApprovePost(
        nextRequest("http://localhost/api/mainline/review-queue/inv-1/approve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }),
        params,
      );
      const denyRes = await reviewDenyPost(
        nextRequest("http://localhost/api/mainline/review-queue/inv-1/deny", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }),
        params,
      );
      const askMoreInfoRes = await reviewAskMoreInfoPost(
        nextRequest("http://localhost/api/mainline/review-queue/inv-1/ask-more-info", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        }),
        params,
      );

      expect(approveRes.status).toBe(502);
      expect(await approveRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(denyRes.status).toBe(502);
      expect(await denyRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(askMoreInfoRes.status).toBe(502);
      expect(await askMoreInfoRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/user-task-instances returns 502 and mainline_unreachable", async () => {
      const req = nextRequest("http://localhost/api/mainline/user-task-instances");
      const res = await userTaskInstancesGet(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST /api/mainline/user-task-instances returns 502 and mainline_unreachable", async () => {
      const req = nextRequest("http://localhost/api/mainline/user-task-instances", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await userTaskInstancesPost(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/user-task-instances/:id/history and /export return 502", async () => {
      const historyRes = await userTaskHistoryGet(
        nextRequest("http://localhost/api/mainline/user-task-instances/ut-1/history"),
        { params: Promise.resolve({ id: "ut-1" }) },
      );
      const exportRes = await userTaskExportGet(
        nextRequest("http://localhost/api/mainline/user-task-instances/ut-1/export"),
        { params: Promise.resolve({ id: "ut-1" }) },
      );
      expect(historyRes.status).toBe(502);
      expect(await historyRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(exportRes.status).toBe(502);
      expect(await exportRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/connectors/authorizations returns 502 and mainline_unreachable", async () => {
      const req = nextRequest("http://localhost/api/mainline/connectors/authorizations");
      const res = await connectorsAuthorizationsGet(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST /api/mainline/connectors/authorizations returns 502 and mainline_unreachable", async () => {
      const req = nextRequest("http://localhost/api/mainline/connectors/authorizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await connectorsAuthorizationsPost(req);
      expect(res.status).toBe(502);
      const data = await res.json();
      expect(data).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST /api/mainline/connectors/file-upload returns 502 and mainline_unreachable", async () => {
      const fd = new FormData();
      fd.append("file", new Blob(["x"], { type: "text/plain" }), "t.txt");
      const req = nextRequest("http://localhost/api/mainline/connectors/file-upload", {
        method: "POST",
        body: fd,
      });
      const res = await connectorsFileUploadPost(req);
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/usage/counters and /limits return 502", async () => {
      const countersRes = await usageCountersGet(
        nextRequest("http://localhost/api/mainline/usage/counters?actor_id=u1"),
      );
      const limitsRes = await usageLimitsGet(
        nextRequest("http://localhost/api/mainline/usage/limits?actor_id=u1&feature=agent_deployments"),
      );
      expect(countersRes.status).toBe(502);
      expect(await countersRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(limitsRes.status).toBe(502);
      expect(await limitsRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("PATCH /api/mainline/agents/:id/gateway-listing returns 502 when unreachable", async () => {
      const res = await agentGatewayListingPatch(
        nextRequest("http://localhost/api/mainline/agents/a1/gateway-listing", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ max_concurrent: 2 }),
        }),
        { params: Promise.resolve({ id: "a1" }) },
      );
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("POST revoke and GET local receipt return 502", async () => {
      const revokeRes = await connectorsAuthorizationsRevokePost(
        nextRequest("http://localhost/api/mainline/connectors/authorizations/auth-1/revoke", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ actor_id: "u-1" }),
        }),
        { params: Promise.resolve({ id: "auth-1" }) },
      );
      const receiptRes = await localActionReceiptGet(
        nextRequest("http://localhost/api/mainline/connectors/local-action-receipts/rcpt-1"),
        { params: Promise.resolve({ id: "rcpt-1" }) },
      );
      expect(revokeRes.status).toBe(502);
      expect(await revokeRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(receiptRes.status).toBe(502);
      expect(await receiptRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/connectors/desktop/devices returns 502 when mainline unreachable", async () => {
      const res = await desktopConnectorGet(
        nextRequest("http://localhost/api/mainline/connectors/desktop/devices"),
        { params: Promise.resolve({ path: ["devices"] }) },
      );
      expect(res.status).toBe(502);
      expect(await res.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });

    test("GET /api/mainline/connectors/notion/authorize and external-action-receipts return 502", async () => {
      const notionRes = await notionCloudGet(
        nextRequest("http://localhost/api/mainline/connectors/notion/authorize"),
        { params: Promise.resolve({ path: ["authorize"] }) },
      );
      const extRes = await externalActionReceiptGet(
        nextRequest("http://localhost/api/mainline/connectors/external-action-receipts/ext-1"),
        { params: Promise.resolve({ id: "ext-1" }) },
      );
      expect(notionRes.status).toBe(502);
      expect(await notionRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
      expect(extRes.status).toBe(502);
      expect(await extRes.json()).toEqual(MAINLINE_UNREACHABLE_BODY);
    });
  });

  describe("success passthrough", () => {
    test("POST /api/mainline/ask passthrough", async () => {
      const body = { id: "inv-1", status: "running" };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 201, headers: { "content-type": "application/json" } }),
      );
      const req = nextRequest("http://localhost/api/mainline/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello" }),
      });
      const res = await askPost(req);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(body);
    });

    test("GET /api/mainline/review-queue passthrough", async () => {
      const body = { items: [] };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const res = await reviewQueueGet(nextRequest("http://localhost/api/mainline/review-queue"));
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(body);
    });

    test("GET /api/mainline/invocations/:id passthrough (W-18)", async () => {
      const body = { data: { id: "inv-1", visibility_role: "user" } };
      fetchStub.mockResolvedValueOnce(
        new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const res = await invocationByIdGet(nextRequest("http://localhost/api/mainline/invocations/inv-1"), {
        params: Promise.resolve({ id: "inv-1" }),
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(body);
    });

    test("GET /api/mainline/user-task-instances passthrough", async () => {
      const body = { taskInstances: [] };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const req = nextRequest("http://localhost/api/mainline/user-task-instances");
      const res = await userTaskInstancesGet(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(body);
    });

    test("POST /api/mainline/user-task-instances passthrough", async () => {
      const body = { id: "ti-1" };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 201, headers: { "content-type": "application/json" } }),
      );
      const req = nextRequest("http://localhost/api/mainline/user-task-instances", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await userTaskInstancesPost(req);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(body);
    });

    test("GET /api/mainline/connectors/authorizations passthrough", async () => {
      const body = { authorizations: [] };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const req = nextRequest("http://localhost/api/mainline/connectors/authorizations");
      const res = await connectorsAuthorizationsGet(req);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(body);
    });

    test("POST /api/mainline/connectors/authorizations passthrough", async () => {
      const body = { id: "auth-1" };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 201, headers: { "content-type": "application/json" } }),
      );
      const req = nextRequest("http://localhost/api/mainline/connectors/authorizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const res = await connectorsAuthorizationsPost(req);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(body);
    });

    test("POST /api/mainline/connectors/file-upload passthrough", async () => {
      const body = { data: { file_ref_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", byte_size: 3 } };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 201, headers: { "content-type": "application/json" } }),
      );
      const fd = new FormData();
      fd.append("file", new Blob(["abc"], { type: "text/plain" }), "a.txt");
      const req = nextRequest("http://localhost/api/mainline/connectors/file-upload", {
        method: "POST",
        body: fd,
      });
      const res = await connectorsFileUploadPost(req);
      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(body);
      expect(fetchStub).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/connectors\/file-upload$/),
        expect.objectContaining({ method: "POST" }),
      );
    });

    test("PATCH /api/mainline/agents/:id/gateway-listing passthrough", async () => {
      const body = { data: { id: "a1", max_concurrent: 2 } };
      fetchStub.mockResolvedValue(
        new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const res = await agentGatewayListingPatch(
        nextRequest("http://localhost/api/mainline/agents/a1/gateway-listing", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ max_concurrent: 2 }),
        }),
        { params: Promise.resolve({ id: "a1" }) },
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual(body);
    });

    test("GET /api/mainline/usage/counters and limits passthrough", async () => {
      const cBody = { data: { audit_events_total: 1 } };
      const lBody = { data: { feature: "agent_deployments", used: 0, limit: 1 } };
      fetchStub.mockImplementation((input: RequestInfo | URL) => {
        const u = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        const json = u.includes("/usage/limits") ? lBody : cBody;
        return Promise.resolve(
          new Response(JSON.stringify(json), { status: 200, headers: { "content-type": "application/json" } }),
        );
      });
      const cRes = await usageCountersGet(
        nextRequest("http://localhost/api/mainline/usage/counters?actor_id=u1"),
      );
      expect(cRes.status).toBe(200);
      expect(await cRes.json()).toEqual(cBody);

      const lRes = await usageLimitsGet(
        nextRequest("http://localhost/api/mainline/usage/limits?actor_id=u1&feature=agent_deployments"),
      );
      expect(lRes.status).toBe(200);
      expect(await lRes.json()).toEqual(lBody);
    });

    test("fallback route and review action passthrough", async () => {
      const fallbackBody = { ok: true };
      fetchStub.mockResolvedValueOnce(
        new Response(JSON.stringify(fallbackBody), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const fallbackRes = await askFallbackRetryPost(
        nextRequest("http://localhost/api/mainline/ask/ask-1/fallback/retry", { method: "POST" }),
        { params: Promise.resolve({ id: "ask-1" }) },
      );
      expect(fallbackRes.status).toBe(200);
      expect(await fallbackRes.json()).toEqual(fallbackBody);

      const reviewBody = { status: "approved" };
      fetchStub.mockResolvedValueOnce(
        new Response(JSON.stringify(reviewBody), { status: 200, headers: { "content-type": "application/json" } }),
      );
      const reviewRes = await reviewApprovePost(
        nextRequest("http://localhost/api/mainline/review-queue/inv-1/approve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ approver_id: "u-1" }),
        }),
        { params: Promise.resolve({ invocationId: "inv-1" }) },
      );
      expect(reviewRes.status).toBe(200);
      expect(await reviewRes.json()).toEqual(reviewBody);
    });

    test("export csv passthrough keeps text/csv", async () => {
      fetchStub.mockResolvedValue(
        new Response("id,name\n1,alpha\n", { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } }),
      );
      const res = await userTaskExportGet(
        nextRequest("http://localhost/api/mainline/user-task-instances/ut-1/export"),
        { params: Promise.resolve({ id: "ut-1" }) },
      );
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/csv");
      expect(await res.text()).toContain("id,name");
    });

    test("W-15: GET spaces/:id/presence, PATCH/DELETE members/:userId, GET audit-events passthrough", async () => {
      const presBody = { data: { space_id: "s1", members: [] } };
      const patchBody = { data: { user_id: "u2", role: "member" } };
      const delBody = { data: { removed: true } };
      const auditBody = { data: [], meta: {} };
      fetchStub
        .mockResolvedValueOnce(
          new Response(JSON.stringify(presBody), { status: 200, headers: { "content-type": "application/json" } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(patchBody), { status: 200, headers: { "content-type": "application/json" } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(delBody), { status: 200, headers: { "content-type": "application/json" } }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify(auditBody), { status: 200, headers: { "content-type": "application/json" } }),
        );

      const presRes = await spacePresenceGet(nextRequest("http://localhost/api/mainline/spaces/s1/presence"), {
        params: Promise.resolve({ id: "s1" }),
      });
      expect(presRes.status).toBe(200);
      expect(await presRes.json()).toEqual(presBody);

      const patchRes = await spaceMemberPatch(
        nextRequest("http://localhost/api/mainline/spaces/s1/members/u2", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role: "member" }),
        }),
        { params: Promise.resolve({ id: "s1", userId: "u2" }) },
      );
      expect(patchRes.status).toBe(200);
      expect(await patchRes.json()).toEqual(patchBody);

      const delRes = await spaceMemberDelete(
        nextRequest("http://localhost/api/mainline/spaces/s1/members/u2", { method: "DELETE" }),
        { params: Promise.resolve({ id: "s1", userId: "u2" }) },
      );
      expect(delRes.status).toBe(200);
      expect(await delRes.json()).toEqual(delBody);

      const auditRes = await auditEventsGet(
        nextRequest("http://localhost/api/mainline/audit-events?space_id=s1&limit=5"),
      );
      expect(auditRes.status).toBe(200);
      expect(await auditRes.json()).toEqual(auditBody);
    });
  });
});
