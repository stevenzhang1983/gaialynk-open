import { emitAuditEventAsync, listDistinctUserActorIdsForAgentAsync } from "../audit/audit.store";
import { randomUUID } from "node:crypto";
import { setAgentStatusAsync } from "../directory/agent.store";
import { recordNotificationEventAsync } from "../notifications/notification.store";
import { countRecentNotHelpfulWithReasonAsync } from "./agent-run-feedback.store";
import {
  enqueueAgentRetestAsync,
  hasPendingRetestForAgentReasonAsync,
} from "./agent-retest-queue.store";
import type { AgentUserReport } from "./agent-user-report.store";

const retestThreshold = (): number => {
  const n = Number(process.env.AGENT_FEEDBACK_RETEST_THRESHOLD);
  return Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : 3;
};

const retestWindowDays = (): number => {
  const n = Number(process.env.AGENT_FEEDBACK_RETEST_WINDOW_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.min(365, Math.floor(n)) : 30;
};

export const countRecentNotHelpfulSameReasonAsync = async (
  agentId: string,
  reasonCode: string,
): Promise<number> => {
  const days = retestWindowDays();
  return countRecentNotHelpfulWithReasonAsync(agentId, reasonCode, days);
};

/**
 * After structured feedback: if enough recent "not_helpful" with same reason_code, enqueue automatic retest.
 */
export const maybeEnqueueRetestAfterFeedbackAsync = async (input: {
  agent_id: string;
  reason_code?: string | null;
  usefulness?: "helpful" | "not_helpful" | "neutral" | null;
}): Promise<{ enqueued: boolean; feedback_count?: number }> => {
  if (input.usefulness !== "not_helpful" || !input.reason_code?.trim()) {
    return { enqueued: false };
  }
  const reason = input.reason_code.trim();
  const count = await countRecentNotHelpfulSameReasonAsync(input.agent_id, reason);
  const threshold = retestThreshold();
  if (count < threshold) {
    return { enqueued: false, feedback_count: count };
  }
  if (await hasPendingRetestForAgentReasonAsync(input.agent_id, reason)) {
    return { enqueued: false, feedback_count: count };
  }
  await enqueueAgentRetestAsync({
    agent_id: input.agent_id,
    reason_code: reason,
    feedback_count: count,
  });
  await emitAuditEventAsync({
    eventType: "trust.reputation.retest_enqueued",
    agentId: input.agent_id,
    actorType: "system",
    actorId: "system",
    payload: {
      agent_id: input.agent_id,
      reason_code: reason,
      feedback_count: count,
      threshold,
    },
    correlationId: randomUUID(),
  });
  return { enqueued: true, feedback_count: count };
};

/**
 * 举报成立：目录状态降级 + 通知近期与该 Agent 有过调用关系的用户。
 */
export const applyAgentReportUpheldSideEffectsAsync = async (
  report: AgentUserReport,
  arbitratorId: string,
): Promise<{ notified_user_ids: string[] }> => {
  await setAgentStatusAsync(report.agent_id, "deprecated");
  await emitAuditEventAsync({
    eventType: "trust.agent_report.upheld",
    agentId: report.agent_id,
    actorType: "user",
    actorId: arbitratorId,
    payload: {
      report_id: report.id,
      reason_code: report.reason_code,
      agent_id: report.agent_id,
    },
    correlationId: randomUUID(),
  });

  const userIds = await listDistinctUserActorIdsForAgentAsync(report.agent_id, {
    lookbackDays: 90,
    limit: 500,
  });
  const notified: string[] = [];
  for (const uid of userIds) {
    await recordNotificationEventAsync({
      user_id: uid,
      event_type: "trust.agent_report.upheld",
      notification_type: "agent_status_change",
      deep_link: `/directory/agents/${report.agent_id}`,
      payload: {
        agent_id: report.agent_id,
        report_id: report.id,
        reason_code: report.reason_code,
        message_zh: "您曾使用过的 Agent 因举报成立已被标记为下线/弃用，请关注替代方案。",
        message_en: "An agent you used was deprecated after a report was upheld. Please consider alternatives.",
        message_ja: "ご利用されたエージェントは通報が認められディレクトリ上非推奨となりました。代替をご検討ください。",
      },
    });
    notified.push(uid);
  }
  return { notified_user_ids: notified };
};
