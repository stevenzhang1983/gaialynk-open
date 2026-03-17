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
  });
});
