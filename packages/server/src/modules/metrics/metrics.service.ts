import { listAuditEvents } from "../audit/audit.store";
import { listConversations } from "../conversation/conversation.store";

interface InvocationBucket {
  total: number;
}

export interface Phase0Metrics {
  invocation_total: Record<string, InvocationBucket>;
  audit_events_total: Record<string, number>;
  conversations_active_total: number;
}

export const getPhase0Metrics = (): Phase0Metrics => {
  const events = listAuditEvents().data;
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

  const conversationsActiveTotal = listConversations().filter(
    (conversation) => conversation.state === "active",
  ).length;

  return {
    invocation_total: invocationTotal,
    audit_events_total: auditEventsTotal,
    conversations_active_total: conversationsActiveTotal,
  };
};
