import { listAuditEventsAsync } from "../audit/audit.store";
import type { AuditEvent } from "../audit/audit.store";
import { countReceiptsAsync } from "../audit/receipt.store";
import {
  getConversationDetailAsync,
  listConversations,
} from "../conversation/conversation.store";
import { listNodesAsync } from "../node-hub/node.store";

interface InvocationBucket {
  total: number;
}

export interface Phase0Metrics {
  invocation_total: Record<string, InvocationBucket>;
  audit_events_total: Record<string, number>;
  conversations_active_total: number;
  weekly_trusted_invocations: number;
  multi_agent_conversation_ratio: number;
  high_risk_interception_ratio: number;
  key_receipt_coverage_ratio: number;
  audit_event_coverage_ratio: number;
  weekly_active_conversations: number;
  first_session_success_rate: number;
  connected_nodes_total: number;
  go_no_go: {
    decision: "go" | "hold";
    reasons: string[];
  };
}

const toRatio = (numerator: number, denominator: number): number => {
  if (denominator <= 0) {
    return 1;
  }
  return Number((numerator / denominator).toFixed(4));
};

const listAllAuditEvents = async () => {
  const all: AuditEvent[] = [];
  let cursor: string | undefined;

  for (;;) {
    const page = await listAuditEventsAsync({ cursor, limit: 200 });
    all.push(...page.data);
    if (!page.nextCursor) {
      break;
    }
    cursor = page.nextCursor;
  }

  return all;
};

export const getPhase0Metrics = async (): Promise<Phase0Metrics> => {
  const events = await listAllAuditEvents();
  const invocationTotal: Record<string, InvocationBucket> = {};
  const auditEventsTotal: Record<string, number> = {};

  for (const event of events) {
    auditEventsTotal[event.event_type] = (auditEventsTotal[event.event_type] ?? 0) + 1;
    if (event.event_type.startsWith("invocation.")) {
      const risk = event.trust_decision?.risk_level ?? "unknown";
      const decision = event.trust_decision?.decision ?? "unknown";
      const key = `${risk}:${decision}`;
      invocationTotal[key] = {
        total: (invocationTotal[key]?.total ?? 0) + 1,
      };
    }
  }

  const conversationsActiveTotal = (await listConversations()).filter(
    (conversation) => conversation.state === "active",
  ).length;

  const conversations = await listConversations();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyActiveConversations = conversations.filter(
    (conversation) => Date.parse(conversation.updated_at) >= sevenDaysAgo,
  ).length;

  let multiAgentConversations = 0;
  for (const conversation of conversations) {
    const detail = await getConversationDetailAsync(conversation.id);
    if (!detail) {
      continue;
    }
    const distinctAgents = new Set(
      detail.participants
        .filter((participant) => participant.participant_type === "agent")
        .map((participant) => participant.participant_id),
    );
    if (distinctAgents.size >= 2) {
      multiAgentConversations += 1;
    }
  }

  const highRiskDecisionEvents = events.filter(
    (event) =>
      event.trust_decision?.risk_level === "high" &&
      (event.event_type === "invocation.allowed" ||
        event.event_type === "invocation.need_confirmation" ||
        event.event_type === "invocation.denied"),
  );
  const highRiskIntercepted = highRiskDecisionEvents.filter(
    (event) => event.trust_decision?.decision !== "allow",
  ).length;

  const completedEvents = events.filter((event) => event.event_type === "invocation.completed");
  const receiptCount = await countReceiptsAsync();
  const weeklyTrustedInvocations = completedEvents.filter(
    (event) => Date.parse(event.created_at) >= sevenDaysAgo,
  ).length;
  const successfulConversationIds = new Set(
    completedEvents
      .map((event) => event.conversation_id)
      .filter((conversationId): conversationId is string => Boolean(conversationId)),
  );
  const firstSessionSuccessRate = toRatio(successfulConversationIds.size, conversations.length);
  const connectedNodesTotal = (await listNodesAsync()).length;

  const byCorrelation = new Map<string, Set<string>>();
  for (const event of events) {
    if (!event.correlation_id) {
      continue;
    }
    const set = byCorrelation.get(event.correlation_id) ?? new Set<string>();
    set.add(event.event_type);
    byCorrelation.set(event.correlation_id, set);
  }

  let coveredCompleted = 0;
  for (const completed of completedEvents) {
    const related = byCorrelation.get(completed.correlation_id) ?? new Set<string>();
    const hasDecision =
      related.has("invocation.allowed") || related.has("invocation.need_confirmation");
    const needConfirmation = related.has("invocation.need_confirmation");
    const hasConfirmation = related.has("invocation.confirmed");
    if (hasDecision && (!needConfirmation || hasConfirmation)) {
      coveredCompleted += 1;
    }
  }

  const highRiskInterceptionRatio = toRatio(
    highRiskIntercepted,
    highRiskDecisionEvents.length,
  );
  const keyReceiptCoverageRatio = toRatio(
    Math.min(receiptCount, completedEvents.length),
    completedEvents.length,
  );
  const auditEventCoverageRatio = toRatio(coveredCompleted, completedEvents.length);

  const goNoGoReasons: string[] = [];
  if (weeklyTrustedInvocations < 1) {
    goNoGoReasons.push("weekly_trusted_invocations_below_threshold");
  }
  if (highRiskInterceptionRatio < 0.9) {
    goNoGoReasons.push("high_risk_interception_ratio_below_threshold");
  }
  if (keyReceiptCoverageRatio < 0.95) {
    goNoGoReasons.push("key_receipt_coverage_ratio_below_threshold");
  }
  if (auditEventCoverageRatio < 0.95) {
    goNoGoReasons.push("audit_event_coverage_ratio_below_threshold");
  }

  return {
    invocation_total: invocationTotal,
    audit_events_total: auditEventsTotal,
    conversations_active_total: conversationsActiveTotal,
    weekly_trusted_invocations: weeklyTrustedInvocations,
    multi_agent_conversation_ratio: toRatio(multiAgentConversations, conversationsActiveTotal),
    high_risk_interception_ratio: highRiskInterceptionRatio,
    key_receipt_coverage_ratio: keyReceiptCoverageRatio,
    audit_event_coverage_ratio: auditEventCoverageRatio,
    weekly_active_conversations: weeklyActiveConversations,
    first_session_success_rate: firstSessionSuccessRate,
    connected_nodes_total: connectedNodesTotal,
    go_no_go: {
      decision: goNoGoReasons.length === 0 ? "go" : "hold",
      reasons: goNoGoReasons,
    },
  };
};
