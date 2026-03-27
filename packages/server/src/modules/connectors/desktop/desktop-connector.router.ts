import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Context, Hono } from "hono";
import { z } from "zod";
import { emitAuditEventAsync } from "../../audit/audit.store";
import { verifyAccessToken, verifyDesktopDeviceToken, signDesktopDeviceToken } from "../../auth/jwt";
import { getConversationSummaryAsync } from "../../conversation/conversation.store";
import { insertExternalActionReceiptAsync } from "../external-action-receipt.store";
import { fanoutDesktopUserPayload } from "../../realtime/redis-pubsub";
import { forbiddenUnlessSpaceRbac } from "../../spaces/rbac.middleware";
import { evaluateDesktopConnectorFileTrust } from "../../trust/trust.engine";
import {
  activateDeviceAfterConnectorPollAsync,
  assertDeviceActiveByIdAsync,
  assertDeviceActiveForUserAsync,
  getDeviceByPairingHashAsync,
  hashPairingCode,
  listDesktopDevicesForUserAsync,
  registerWebPairingAsync,
  revokeDeviceForUserAsync,
  touchDeviceLastSeenAsync,
} from "./desktop-connector.store";
import {
  confirmWriteChallenge,
  consumeWriteConfirmationToken,
  createDesktopExecuteJob,
  createWriteChallenge,
  getDesktopExecuteJob,
  settleDesktopExecuteJob,
} from "./desktop-execute.runtime";

function bearer(c: Context): string | null {
  const h = c.req.header("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const t = h.slice(7).trim();
  return t || null;
}

function corr(c: Context): string {
  return c.req.header("x-correlation-id")?.trim() || randomUUID();
}

const pairBodySchema = z.object({
  pairing_code: z.string().length(6).regex(/^\d{6}$/),
  device_name: z.string().max(128).optional(),
});

const executeBodySchema = z.object({
  action: z.enum(["file_list", "file_read", "file_write"]),
  path: z.string().default(""),
  device_id: z.string().uuid(),
  space_id: z.string().optional(),
  conversation_id: z.string().optional(),
  write_targets_new_path_prefix: z.boolean().optional(),
  write_confirmation_token: z.string().uuid().optional(),
});

const receiptBodySchema = z.object({
  device_id: z.string().uuid(),
  action: z.enum(["file_list", "file_read", "file_write"]),
  path_hash: z.string().min(1),
  status: z.enum(["ok", "error"]),
  error_code: z.string().optional(),
  ts: z.string().min(1),
  env_signature: z.string().min(1),
});

const executeResultSchema = z.object({
  request_id: z.string().uuid(),
  ok: z.boolean(),
  result: z.unknown().optional(),
  error: z.string().optional(),
});

function buildReceiptSignJson(p: {
  action: string;
  device_id: string;
  path_hash: string;
  status: string;
  ts: string;
  error_code?: string;
}): string {
  if (p.error_code != null && p.error_code !== "") {
    return JSON.stringify({
      action: p.action,
      device_id: p.device_id,
      error_code: p.error_code,
      path_hash: p.path_hash,
      status: p.status,
      ts: p.ts,
    });
  }
  return JSON.stringify({
    action: p.action,
    device_id: p.device_id,
    path_hash: p.path_hash,
    status: p.status,
    ts: p.ts,
  });
}

function verifyReceiptHmac(deviceSecret: string, body: z.infer<typeof receiptBodySchema>): boolean {
  const signJson = buildReceiptSignJson({
    action: body.action,
    device_id: body.device_id,
    path_hash: body.path_hash,
    status: body.status,
    ts: body.ts,
    error_code: body.error_code,
  });
  const expected = createHmac("sha256", Buffer.from(deviceSecret, "utf8"))
    .update(signJson, "utf8")
    .digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(body.env_signature, "hex");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function resolveSpaceIdForConnector(
  spaceId: string | undefined,
  conversationId: string | undefined,
): Promise<string | null> {
  if (spaceId?.trim()) {
    return spaceId.trim();
  }
  if (!conversationId?.trim()) {
    return null;
  }
  const s = await getConversationSummaryAsync(conversationId.trim());
  return s?.space_id ?? null;
}

export function registerDesktopConnectorRoutes(app: Hono): void {
  app.get("/api/v1/connectors/desktop/pair-status", async (c) => {
    const code = c.req.query("pairing_code")?.trim() ?? "";
    const correlationId = corr(c);
    if (!/^\d{6}$/.test(code)) {
      return c.json(
        { data: { status: "pending", device_token: null, device_secret: null, device_id: null } },
        200,
      );
    }
    const hash = hashPairingCode(code);
    const row = await getDeviceByPairingHashAsync(hash);
    if (!row) {
      return c.json(
        { data: { status: "pending", device_token: null, device_secret: null, device_id: null } },
        200,
      );
    }

    const activated = await activateDeviceAfterConnectorPollAsync(row.id);
    if (!activated || activated.status !== "active") {
      return c.json(
        { data: { status: "pending", device_token: null, device_secret: null, device_id: null } },
        200,
      );
    }

    await touchDeviceLastSeenAsync(activated.id);
    const device_token = signDesktopDeviceToken({
      sub: activated.user_id,
      device_id: activated.id,
    });

    return c.json({
      data: {
        status: "completed",
        device_token,
        device_secret: activated.device_secret,
        device_id: activated.id,
      },
    });
  });

  app.post("/api/v1/connectors/desktop/pair", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
    }

    let body: z.infer<typeof pairBodySchema>;
    try {
      body = pairBodySchema.parse(await c.req.json());
    } catch {
      return c.json({ error: { code: "invalid_body", message: "Invalid JSON body" } }, 400);
    }

    const correlationId = corr(c);
    try {
      const device = await registerWebPairingAsync({
        userId: user.sub,
        pairingCode: body.pairing_code,
        deviceName: body.device_name,
      });
      await emitAuditEventAsync({
        eventType: "connector.desktop.pairing_started",
        actorType: "user",
        actorId: user.sub,
        payload: { device_id: device.id, pairing_code_suffix: body.pairing_code.slice(-2) },
        correlationId,
      });
      return c.json({
        data: {
          device_id: device.id,
          status: "pending_connector",
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "pair_failed";
      if (msg === "invalid_pairing_code_format") {
        return c.json({ error: { code: "invalid_pairing_code", message: "配对码须为 6 位数字" } }, 400);
      }
      if (msg.includes("duplicate key") || msg.includes("unique")) {
        return c.json({ error: { code: "pairing_code_in_use", message: "该配对码已被使用或占用" } }, 409);
      }
      console.error("[desktop/pair]", e);
      return c.json({ error: { code: "pair_failed", message: "配对登记失败" } }, 500);
    }
  });

  app.get("/api/v1/connectors/desktop/devices", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
    }
    const rows = await listDesktopDevicesForUserAsync(user.sub);
    return c.json({
      data: {
        items: rows.map((r) => ({
          id: r.id,
          device_name: r.device_name,
          status: r.status,
          paired_at: r.paired_at,
          last_seen_at: r.last_seen_at,
        })),
      },
    });
  });

  app.delete("/api/v1/connectors/desktop/devices/:id", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
    }
    const id = c.req.param("id");
    const ok = await revokeDeviceForUserAsync(id, user.sub);
    if (!ok) {
      return c.json({ error: { code: "not_found", message: "设备不存在或已解绑" } }, 404);
    }
    await emitAuditEventAsync({
      eventType: "connector.desktop.device_revoked",
      actorType: "user",
      actorId: user.sub,
      payload: { device_id: id },
      correlationId: corr(c),
    });
    return c.json({ data: { revoked: true } });
  });

  app.post("/api/v1/connectors/desktop/receipts", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const dt = verifyDesktopDeviceToken(token);
    if (!dt) {
      return c.json({ error: { code: "unauthorized", message: "Invalid device token" } }, 401);
    }

    let body: z.infer<typeof receiptBodySchema>;
    try {
      body = receiptBodySchema.parse(await c.req.json());
    } catch {
      return c.json({ error: { code: "invalid_body", message: "Invalid receipt body" } }, 400);
    }

    const correlationId = corr(c);
    if (body.device_id !== dt.device_id) {
      await emitAuditEventAsync({
        eventType: "connector.desktop.receipt_rejected",
        actorType: "system",
        actorId: "system",
        payload: { reason: "device_id_mismatch" },
        correlationId,
      });
      return c.json({ error: { code: "device_mismatch", message: "device_id 与令牌不符" } }, 400);
    }

    const device = await assertDeviceActiveByIdAsync(body.device_id);
    if (!device || device.user_id !== dt.sub) {
      await emitAuditEventAsync({
        eventType: "connector.desktop.receipt_rejected",
        actorType: "system",
        actorId: "system",
        payload: { reason: "device_inactive" },
        correlationId,
      });
      return c.json({ error: { code: "device_revoked", message: "设备未激活或已解绑" } }, 403);
    }

    if (!verifyReceiptHmac(device.device_secret, body)) {
      await emitAuditEventAsync({
        eventType: "connector.desktop.receipt_rejected",
        actorType: "user",
        actorId: device.user_id,
        payload: { reason: "hmac_mismatch", device_id: device.id },
        correlationId,
      });
      return c.json({ error: { code: "invalid_receipt_signature", message: "收据签名校验失败" } }, 400);
    }

    await touchDeviceLastSeenAsync(device.id);

    const auditType =
      body.action === "file_list"
        ? "connector.desktop.file_list"
        : body.action === "file_read"
          ? "connector.desktop.file_read"
          : "connector.desktop.file_write";

    const audit = await emitAuditEventAsync({
      eventType: auditType,
      actorType: "user",
      actorId: device.user_id,
      payload: {
        device_id: device.id,
        path_hash: body.path_hash,
        status: body.status,
        error_code: body.error_code ?? null,
      },
      correlationId,
    });

    const requestHash = createHash("sha256")
      .update(`${body.action}|${body.path_hash}|${body.ts}`, "utf8")
      .digest("hex");

    const receipt = await insertExternalActionReceiptAsync({
      deviceId: device.id,
      action: `desktop.${body.action}`,
      requestHash,
      responseStatus: body.status === "ok" ? 200 : 500,
      auditCorrelationId: audit.id,
      responseSummary: {
        provider: "desktop_connector",
        device_id: device.id,
        path_hash: body.path_hash,
        status: body.status,
      },
    });

    return c.json({ data: { receipt_id: receipt.id, audit_event_id: audit.id } });
  });

  app.post("/api/v1/connectors/desktop/execute", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
    }

    let body: z.infer<typeof executeBodySchema>;
    try {
      body = executeBodySchema.parse(await c.req.json());
    } catch {
      return c.json({ error: { code: "invalid_body", message: "Invalid execute body" } }, 400);
    }

    const spaceId = await resolveSpaceIdForConnector(body.space_id, body.conversation_id);
    const rbac = await forbiddenUnlessSpaceRbac(c, spaceId, user.sub, "trigger_connector");
    if (rbac) {
      return rbac;
    }

    const dev = await assertDeviceActiveForUserAsync(body.device_id, user.sub);
    if (!dev) {
      return c.json({ error: { code: "device_not_found", message: "设备不存在或未激活" } }, 404);
    }

    const correlationId = corr(c);

    if (body.action === "file_write") {
      const trust = evaluateDesktopConnectorFileTrust({
        action: "file_write",
        write_targets_new_path_prefix: Boolean(body.write_targets_new_path_prefix),
      });

      if (trust.decision === "need_confirmation") {
        if (
          body.write_confirmation_token &&
          consumeWriteConfirmationToken(
            body.write_confirmation_token,
            user.sub,
            body.device_id,
            body.path,
          )
        ) {
          /* proceed */
        } else {
          const challengeId = createWriteChallenge(user.sub, body.device_id, body.path);
          await emitAuditEventAsync({
            eventType: "connector.desktop.write_confirmation_required",
            actorType: "user",
            actorId: user.sub,
            payload: { device_id: body.device_id, path: body.path },
            trustDecision: trust,
            correlationId,
          });
          return c.json(
            {
              error: {
                code: "desktop_write_confirmation_required",
                message: "文件写入需确认",
                details: {
                  challenge_id: challengeId,
                  trust_decision: trust,
                  device_id: body.device_id,
                  path: body.path,
                  action: body.action,
                  write_targets_new_path_prefix: Boolean(body.write_targets_new_path_prefix),
                },
              },
            },
            403,
          );
        }
      }
    }

    const requestId = createDesktopExecuteJob({
      userId: user.sub,
      deviceId: body.device_id,
      action: body.action,
      path: body.path,
    });

    await emitAuditEventAsync({
      eventType: "connector.desktop.execute_dispatched",
      actorType: "user",
      actorId: user.sub,
      payload: {
        request_id: requestId,
        device_id: body.device_id,
        action: body.action,
        path: body.path,
      },
      correlationId,
    });

    fanoutDesktopUserPayload(
      user.sub,
      JSON.stringify({
        type: "desktop_execute",
        request_id: requestId,
        device_id: body.device_id,
        action: body.action,
        path: body.path,
      }),
    );

    return c.json({ data: { request_id: requestId, status: "dispatched" } });
  });

  app.post("/api/v1/connectors/desktop/write-challenges/:challengeId/confirm", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
    }
    const challengeId = c.req.param("challengeId");
    const confirmation = confirmWriteChallenge(challengeId, user.sub);
    if (!confirmation) {
      return c.json({ error: { code: "invalid_challenge", message: "确认已失效或无效" } }, 400);
    }
    await emitAuditEventAsync({
      eventType: "connector.desktop.write_confirmed",
      actorType: "user",
      actorId: user.sub,
      payload: { challenge_id: challengeId },
      correlationId: corr(c),
    });
    return c.json({ data: { write_confirmation_token: confirmation } });
  });

  app.post("/api/v1/connectors/desktop/execute-result", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const dt = verifyDesktopDeviceToken(token);
    if (!dt) {
      return c.json({ error: { code: "unauthorized", message: "Invalid device token" } }, 401);
    }

    let body: z.infer<typeof executeResultSchema>;
    try {
      body = executeResultSchema.parse(await c.req.json());
    } catch {
      return c.json({ error: { code: "invalid_body", message: "Invalid body" } }, 400);
    }

    const job = getDesktopExecuteJob(body.request_id);
    if (!job || job.userId !== dt.sub || job.deviceId !== dt.device_id) {
      return c.json({ error: { code: "not_found", message: "任务不存在" } }, 404);
    }

    const ok = settleDesktopExecuteJob(body.request_id, body.ok, body.result, body.error);
    if (!ok) {
      return c.json({ error: { code: "already_settled", message: "任务已结束" } }, 409);
    }

    await touchDeviceLastSeenAsync(dt.device_id);
    await emitAuditEventAsync({
      eventType: body.ok ? "connector.desktop.execute_completed" : "connector.desktop.execute_failed",
      actorType: "user",
      actorId: dt.sub,
      payload: { request_id: body.request_id, device_id: dt.device_id },
      correlationId: corr(c),
    });

    return c.json({ data: { ok: true } });
  });

  app.get("/api/v1/connectors/desktop/execute/:requestId/result", async (c) => {
    const token = bearer(c);
    if (!token) {
      return c.json({ error: { code: "unauthorized", message: "Bearer token required" } }, 401);
    }
    const user = verifyAccessToken(token);
    if (!user) {
      return c.json({ error: { code: "unauthorized", message: "Invalid token" } }, 401);
    }
    const requestId = c.req.param("requestId");
    const job = getDesktopExecuteJob(requestId);
    if (!job || job.userId !== user.sub) {
      return c.json({ error: { code: "not_found", message: "任务不存在" } }, 404);
    }
    if (job.status === "pending") {
      return c.json({ data: { status: "pending", request_id: requestId } }, 202);
    }
    return c.json({
      data: {
        status: job.status,
        request_id: requestId,
        result: job.result ?? null,
        error: job.error ?? null,
      },
    });
  });
}
