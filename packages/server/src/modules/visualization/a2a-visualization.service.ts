import { listAuditEventsAsync } from "../audit/audit.store";
import type { AuditEvent } from "../audit/audit.store";
import { listReceiptsByAuditEventIdsAsync } from "../audit/receipt.store";

export type VisualizationMode = "mock" | "real";

export interface A2AL1Summary {
  total_invocations: number;
  completed_invocations: number;
  denied_invocations: number;
  need_confirmation_invocations: number;
  failed_invocations: number;
  success_rate: number;
  avg_duration_ms: number;
}

export interface A2AL1Result {
  summary: A2AL1Summary;
  replay_anchor_ts: string;
  window_start_ts: string;
}

export interface A2AL2TimelineItem {
  timestamp: string;
  event_type: string;
  status: "ok" | "warning" | "error";
  conversation_id?: string;
  agent_id?: string;
  correlation_id: string;
}

export interface A2AL2Query {
  mode: VisualizationMode;
  windowDays: number;
  replayAnchorTs?: string;
  cursor?: string;
  limit: number;
}

export interface A2AL2Page {
  items: A2AL2TimelineItem[];
  replay_anchor_ts: string;
  window_start_ts: string;
  has_more: boolean;
  page_size: number;
  returned_count: number;
  remaining_items: number;
  next_cursor?: string;
}

export type A2ACursorErrorCode =
  | "invalid_a2a_cursor"
  | "a2a_cursor_context_mismatch"
  | "a2a_cursor_anchor_mismatch";

export interface A2ACursorError {
  code: A2ACursorErrorCode;
  message: string;
  recovery_hint: string;
}

export type A2AL2PageResult =
  | {
      ok: true;
      page: A2AL2Page;
    }
  | {
      ok: false;
      error: A2ACursorError;
    };

export interface A2AL3EvidenceItem {
  audit_event_id: string;
  timestamp: string;
  event_type: string;
  policy_hit: string;
  reason_codes: string[];
  receipt_refs: string[];
  signature_digest?: string;
}

export interface A2AL3Page {
  items: A2AL3EvidenceItem[];
  replay_anchor_ts: string;
  window_start_ts: string;
  has_more: boolean;
  page_size: number;
  returned_count: number;
  remaining_items: number;
  next_cursor?: string;
}

export type A2AL3PageResult =
  | { ok: true; page: A2AL3Page }
  | { ok: false; error: A2ACursorError };

const round4 = (value: number): number => Math.round(value * 10000) / 10000;
const DAY_MS = 24 * 60 * 60 * 1000;

const statusFromEventType = (eventType: string): "ok" | "warning" | "error" => {
  if (eventType === "invocation.completed") return "ok";
  if (eventType === "invocation.failed" || eventType === "invocation.denied") return "error";
  return "warning";
};

const relevantEventType = (eventType: string): boolean =>
  eventType.startsWith("invocation.") || eventType.startsWith("ask.fallback.");

const mockNow = (): string => new Date("2026-03-16T00:00:00.000Z").toISOString();

interface WindowContext {
  replay_anchor_ts: string;
  window_start_ts: string;
}

interface CursorPayload {
  v: 1;
  offset: number;
  mode: VisualizationMode;
  window_days: number;
  replay_anchor_ts: string;
}

const toIsoOrUndefined = (value?: string): string | undefined => {
  if (!value) return undefined;
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return undefined;
  return new Date(ts).toISOString();
};

const resolveWindowContext = (input: {
  mode: VisualizationMode;
  windowDays: number;
  replayAnchorTs?: string;
}): WindowContext => {
  const normalizedAnchor = toIsoOrUndefined(input.replayAnchorTs);
  const replayAnchorTs =
    normalizedAnchor ??
    (input.mode === "mock" ? mockNow() : new Date(Date.now()).toISOString());
  const windowStartTs = new Date(Date.parse(replayAnchorTs) - input.windowDays * DAY_MS).toISOString();
  return {
    replay_anchor_ts: replayAnchorTs,
    window_start_ts: windowStartTs,
  };
};

const encodeCursor = (payload: CursorPayload): string =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const decodeCursor = (cursor: string): CursorPayload | undefined => {
  if (/^[0-9]+$/.test(cursor)) {
    return {
      v: 1,
      offset: Number.parseInt(cursor, 10),
      mode: "real",
      window_days: 7,
      replay_anchor_ts: new Date(Date.now()).toISOString(),
    };
  }
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<CursorPayload>;
    if (
      parsed.v !== 1 ||
      !Number.isFinite(parsed.offset) ||
      (parsed.mode !== "mock" && parsed.mode !== "real") ||
      !Number.isFinite(parsed.window_days) ||
      typeof parsed.replay_anchor_ts !== "string"
    ) {
      return undefined;
    }
    const offset = parsed.offset as number;
    const windowDays = parsed.window_days as number;
    return {
      v: 1,
      offset: Math.max(0, Math.floor(offset)),
      mode: parsed.mode,
      window_days: Math.max(1, Math.floor(windowDays)),
      replay_anchor_ts: parsed.replay_anchor_ts,
    };
  } catch {
    return undefined;
  }
};

export const getA2AVisualizationDataVersion = (input: {
  mode: VisualizationMode;
  windowDays: number;
}): string => `a2a-vis-v1-${input.mode}-w${input.windowDays}`;

export const getA2AVisualizationL1 = async (input: {
  mode: VisualizationMode;
  windowDays: number;
  replayAnchorTs?: string;
}): Promise<A2AL1Result> => {
  const context = resolveWindowContext({
    mode: input.mode,
    windowDays: input.windowDays,
    replayAnchorTs: input.replayAnchorTs,
  });
  if (input.mode === "mock") {
    return {
      replay_anchor_ts: context.replay_anchor_ts,
      window_start_ts: context.window_start_ts,
      summary: {
        total_invocations: 128,
        completed_invocations: 97,
        denied_invocations: 18,
        need_confirmation_invocations: 9,
        failed_invocations: 4,
        success_rate: 0.7578,
        avg_duration_ms: 842,
      },
    };
  }

  const events = (await listAuditEventsAsync({ from: context.window_start_ts, limit: 5000 })).data.filter(
    (event) =>
      relevantEventType(event.event_type) &&
      Date.parse(event.created_at) <= Date.parse(context.replay_anchor_ts),
  );
  const completed = events.filter((event) => event.event_type === "invocation.completed").length;
  const denied = events.filter((event) => event.event_type === "invocation.denied").length;
  const needConfirmation = events.filter(
    (event) => event.event_type === "invocation.need_confirmation",
  ).length;
  const failed = events.filter((event) => event.event_type === "invocation.failed").length;
  const total = completed + denied + needConfirmation + failed;
  const successRate = total === 0 ? 0 : round4(completed / total);

  const startedByCorrelation = new Map<string, number>();
  const durations: number[] = [];
  for (const event of events) {
    if (
      event.event_type === "invocation.allowed" ||
      event.event_type === "invocation.need_confirmation"
    ) {
      startedByCorrelation.set(event.correlation_id, Date.parse(event.created_at));
      continue;
    }
    if (event.event_type === "invocation.completed") {
      const startTs = startedByCorrelation.get(event.correlation_id);
      if (startTs === undefined) continue;
      const duration = Date.parse(event.created_at) - startTs;
      if (Number.isFinite(duration) && duration >= 0) durations.push(duration);
    }
  }
  const avgDurationMs =
    durations.length === 0
      ? 0
      : Math.round(durations.reduce((acc, value) => acc + value, 0) / durations.length);

  return {
    replay_anchor_ts: context.replay_anchor_ts,
    window_start_ts: context.window_start_ts,
    summary: {
      total_invocations: total,
      completed_invocations: completed,
      denied_invocations: denied,
      need_confirmation_invocations: needConfirmation,
      failed_invocations: failed,
      success_rate: successRate,
      avg_duration_ms: avgDurationMs,
    },
  };
};

export const getA2AVisualizationL2 = async (input: {
  mode: VisualizationMode;
  windowDays: number;
  replayAnchorTs?: string;
}): Promise<{ timeline: A2AL2TimelineItem[]; context: WindowContext }> => {
  const context = resolveWindowContext({
    mode: input.mode,
    windowDays: input.windowDays,
    replayAnchorTs: input.replayAnchorTs,
  });
  if (input.mode === "mock") {
    return {
      context,
      timeline: [
        {
          timestamp: mockNow(),
          event_type: "invocation.allowed",
          status: "warning",
          conversation_id: "00000000-0000-4000-8000-000000000001",
          agent_id: "00000000-0000-4000-8000-000000000010",
          correlation_id: "mock-correlation-1",
        },
        {
          timestamp: mockNow(),
          event_type: "invocation.completed",
          status: "ok",
          conversation_id: "00000000-0000-4000-8000-000000000001",
          agent_id: "00000000-0000-4000-8000-000000000010",
          correlation_id: "mock-correlation-1",
        },
        {
          timestamp: mockNow(),
          event_type: "ask.fallback.completed",
          status: "warning",
          correlation_id: "mock-correlation-2",
        },
      ],
    };
  }

  const events = (await listAuditEventsAsync({ from: context.window_start_ts, limit: 5000 })).data
    .filter(
      (event) =>
        relevantEventType(event.event_type) &&
        Date.parse(event.created_at) <= Date.parse(context.replay_anchor_ts),
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  return {
    context,
    timeline: events.slice(-100).map((event) => ({
      timestamp: event.created_at,
      event_type: event.event_type,
      status: statusFromEventType(event.event_type),
      conversation_id: event.conversation_id ?? undefined,
      agent_id: event.agent_id ?? undefined,
      correlation_id: event.correlation_id,
    })),
  };
};

export const getA2AVisualizationL2Page = async (input: A2AL2Query): Promise<A2AL2PageResult> => {
  let replayAnchorTs = input.replayAnchorTs;
  let safeOffset = 0;
  if (input.cursor) {
    if (/^[0-9]+$/.test(input.cursor)) {
      safeOffset = Number.parseInt(input.cursor, 10);
    } else {
      const decodedCursor = decodeCursor(input.cursor);
      if (!decodedCursor) {
        return {
          ok: false,
          error: {
            code: "invalid_a2a_cursor",
            message: "Invalid a2a cursor",
            recovery_hint: "Drop cursor and request first page again",
          },
        };
      }
      if (decodedCursor.mode !== input.mode || decodedCursor.window_days !== input.windowDays) {
        return {
          ok: false,
          error: {
            code: "a2a_cursor_context_mismatch",
            message: "Cursor does not match mode/window",
            recovery_hint: "Use cursor with original mode/window or reset pagination",
          },
        };
      }
      const normalizedCursorAnchor = toIsoOrUndefined(decodedCursor.replay_anchor_ts);
      if (!normalizedCursorAnchor) {
        return {
          ok: false,
          error: {
            code: "invalid_a2a_cursor",
            message: "Invalid a2a cursor anchor",
            recovery_hint: "Drop cursor and request first page again",
          },
        };
      }
      if (
        replayAnchorTs &&
        toIsoOrUndefined(replayAnchorTs) &&
        toIsoOrUndefined(replayAnchorTs) !== normalizedCursorAnchor
      ) {
        return {
          ok: false,
          error: {
            code: "a2a_cursor_anchor_mismatch",
            message: "Cursor anchor does not match replay anchor",
            recovery_hint: "Use either cursor-only replay or explicit replay_anchor_ts-only replay",
          },
        };
      }
      replayAnchorTs = normalizedCursorAnchor;
      safeOffset = decodedCursor.offset;
    }
  }
  const l2Data = await getA2AVisualizationL2({
    mode: input.mode,
    windowDays: input.windowDays,
    replayAnchorTs,
  });
  const timeline = l2Data.timeline;
  const safeLimit = Math.max(1, Math.min(100, input.limit));
  const items = timeline.slice(safeOffset, safeOffset + safeLimit);
  const nextOffset = safeOffset + safeLimit;
  const hasMore = nextOffset < timeline.length;
  const remainingItems = Math.max(0, timeline.length - nextOffset);
  return {
    ok: true,
    page: {
      items,
      replay_anchor_ts: l2Data.context.replay_anchor_ts,
      window_start_ts: l2Data.context.window_start_ts,
      has_more: hasMore,
      page_size: safeLimit,
      returned_count: items.length,
      remaining_items: remainingItems,
      next_cursor:
        hasMore
          ? encodeCursor({
              v: 1,
              offset: nextOffset,
              mode: input.mode,
              window_days: input.windowDays,
              replay_anchor_ts: l2Data.context.replay_anchor_ts,
            })
          : undefined,
    },
  };
};

export const getA2AVisualizationL3Page = async (input: A2AL2Query): Promise<A2AL3PageResult> => {
  let replayAnchorTs = input.replayAnchorTs;
  let safeOffset = 0;
  if (input.cursor) {
    if (/^[0-9]+$/.test(input.cursor)) {
      safeOffset = Number.parseInt(input.cursor, 10);
    } else {
      const decodedCursor = decodeCursor(input.cursor);
      if (!decodedCursor) {
        return {
          ok: false,
          error: {
            code: "invalid_a2a_cursor",
            message: "Invalid a2a cursor",
            recovery_hint: "Drop cursor and request first page again",
          },
        };
      }
      if (decodedCursor.mode !== input.mode || decodedCursor.window_days !== input.windowDays) {
        return {
          ok: false,
          error: {
            code: "a2a_cursor_context_mismatch",
            message: "Cursor does not match mode/window",
            recovery_hint: "Use cursor with original mode/window or reset pagination",
          },
        };
      }
      const normalizedCursorAnchor = toIsoOrUndefined(decodedCursor.replay_anchor_ts);
      if (!normalizedCursorAnchor) {
        return {
          ok: false,
          error: {
            code: "invalid_a2a_cursor",
            message: "Invalid a2a cursor anchor",
            recovery_hint: "Drop cursor and request first page again",
          },
        };
      }
      if (
        replayAnchorTs &&
        toIsoOrUndefined(replayAnchorTs) &&
        toIsoOrUndefined(replayAnchorTs) !== normalizedCursorAnchor
      ) {
        return {
          ok: false,
          error: {
            code: "a2a_cursor_anchor_mismatch",
            message: "Cursor anchor does not match replay anchor",
            recovery_hint: "Use either cursor-only replay or explicit replay_anchor_ts-only replay",
          },
        };
      }
      replayAnchorTs = normalizedCursorAnchor;
      safeOffset = decodedCursor.offset;
    }
  }
  const context = resolveWindowContext({
    mode: input.mode,
    windowDays: input.windowDays,
    replayAnchorTs,
  });
  if (input.mode === "mock") {
    const mockItems: A2AL3EvidenceItem[] = [
      {
        audit_event_id: "mock-audit-1",
        timestamp: context.replay_anchor_ts,
        event_type: "invocation.allowed",
        policy_hit: "policy-rule-1",
        reason_codes: ["capability_allowed"],
        receipt_refs: ["mock-receipt-1"],
        signature_digest: "mock-sha256-digest",
      },
    ];
    const safeLimit = Math.max(1, Math.min(100, input.limit));
    const items = mockItems.slice(safeOffset, safeOffset + safeLimit);
    const nextOffset = safeOffset + safeLimit;
    const hasMore = nextOffset < mockItems.length;
    return {
      ok: true,
      page: {
        items,
        replay_anchor_ts: context.replay_anchor_ts,
        window_start_ts: context.window_start_ts,
        has_more: hasMore,
        page_size: safeLimit,
        returned_count: items.length,
        remaining_items: Math.max(0, mockItems.length - nextOffset),
        next_cursor: hasMore
          ? encodeCursor({
              v: 1,
              offset: nextOffset,
              mode: input.mode,
              window_days: input.windowDays,
              replay_anchor_ts: context.replay_anchor_ts,
            })
          : undefined,
      },
    };
  }
  const eventsResult = await listAuditEventsAsync({
    from: context.window_start_ts,
    limit: 5000,
  });
  const events = (eventsResult.data as AuditEvent[])
    .filter(
      (e) =>
        relevantEventType(e.event_type) &&
        Date.parse(e.created_at) <= Date.parse(context.replay_anchor_ts),
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const auditEventIds = events.map((e) => e.id);
  const receipts = await listReceiptsByAuditEventIdsAsync(auditEventIds);
  const receiptsByAuditId = new Map<string, typeof receipts>();
  for (const r of receipts) {
    const list = receiptsByAuditId.get(r.audit_event_id) ?? [];
    list.push(r);
    receiptsByAuditId.set(r.audit_event_id, list);
  }
  const l3Items: A2AL3EvidenceItem[] = events.map((e) => {
    const eventReceipts = receiptsByAuditId.get(e.id) ?? [];
    const receiptRefs = eventReceipts.map((r) => r.id);
    const signatureDigest = eventReceipts[0]?.payload_hash;
    return {
      audit_event_id: e.id,
      timestamp: e.created_at,
      event_type: e.event_type,
      policy_hit: e.trust_decision?.policy_rule_id ?? "",
      reason_codes: e.trust_decision?.reason_codes ?? [],
      receipt_refs: receiptRefs,
      ...(signatureDigest ? { signature_digest: signatureDigest } : {}),
    };
  });
  const safeLimit = Math.max(1, Math.min(100, input.limit));
  const items = l3Items.slice(safeOffset, safeOffset + safeLimit);
  const nextOffset = safeOffset + safeLimit;
  const hasMore = nextOffset < l3Items.length;
  return {
    ok: true,
    page: {
      items,
      replay_anchor_ts: context.replay_anchor_ts,
      window_start_ts: context.window_start_ts,
      has_more: hasMore,
      page_size: safeLimit,
      returned_count: items.length,
      remaining_items: Math.max(0, l3Items.length - nextOffset),
      next_cursor: hasMore
        ? encodeCursor({
            v: 1,
            offset: nextOffset,
            mode: input.mode,
            window_days: input.windowDays,
            replay_anchor_ts: context.replay_anchor_ts,
          })
        : undefined,
    },
  };
};

export const getA2AVisualizationL3Export = async (input: {
  mode: VisualizationMode;
  windowDays: number;
  replayAnchorTs?: string;
}): Promise<{ replay_anchor_ts: string; window_start_ts: string; items: A2AL3EvidenceItem[] }> => {
  const context = resolveWindowContext({
    mode: input.mode,
    windowDays: input.windowDays,
    replayAnchorTs: input.replayAnchorTs,
  });
  if (input.mode === "mock") {
    return {
      replay_anchor_ts: context.replay_anchor_ts,
      window_start_ts: context.window_start_ts,
      items: [
        {
          audit_event_id: "mock-audit-1",
          timestamp: context.replay_anchor_ts,
          event_type: "invocation.allowed",
          policy_hit: "policy-rule-1",
          reason_codes: ["capability_allowed"],
          receipt_refs: ["mock-receipt-1"],
          signature_digest: "mock-sha256-digest",
        },
      ],
    };
  }
  const eventsResult = await listAuditEventsAsync({
    from: context.window_start_ts,
    limit: 5000,
  });
  const events = (eventsResult.data as AuditEvent[])
    .filter(
      (e) =>
        relevantEventType(e.event_type) &&
        Date.parse(e.created_at) <= Date.parse(context.replay_anchor_ts),
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const auditEventIds = events.map((e) => e.id);
  const receipts = await listReceiptsByAuditEventIdsAsync(auditEventIds);
  const receiptsByAuditId = new Map<string, typeof receipts>();
  for (const r of receipts) {
    const list = receiptsByAuditId.get(r.audit_event_id) ?? [];
    list.push(r);
    receiptsByAuditId.set(r.audit_event_id, list);
  }
  const items: A2AL3EvidenceItem[] = events.map((e) => {
    const eventReceipts = receiptsByAuditId.get(e.id) ?? [];
    const signatureDigest = eventReceipts[0]?.payload_hash;
    return {
      audit_event_id: e.id,
      timestamp: e.created_at,
      event_type: e.event_type,
      policy_hit: e.trust_decision?.policy_rule_id ?? "",
      reason_codes: e.trust_decision?.reason_codes ?? [],
      receipt_refs: eventReceipts.map((r) => r.id),
      ...(signatureDigest ? { signature_digest: signatureDigest } : {}),
    };
  });
  return {
    replay_anchor_ts: context.replay_anchor_ts,
    window_start_ts: context.window_start_ts,
    items,
  };
};
