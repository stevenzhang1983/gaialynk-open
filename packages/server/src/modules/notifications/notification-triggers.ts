import { listDistinctUserActorIdsForAgentAsync } from "../audit/audit.store";
import { getRedisCommandsClient } from "../realtime/redis-pubsub";
import { recordNotificationEventAsync } from "./notification.store";

const reviewDeepLink = (conversationId: string, invocationId: string): string =>
  `/conversations/${conversationId}/invocations/${invocationId}/review`;

const orchestrationDeepLink = (conversationId: string, runId: string): string =>
  `/conversations/${conversationId}/orchestrations/${runId}`;

const quotaDedupKey = (userId: string, feature: string, threshold: string): string =>
  `gaialynk:quota:notify:${userId}:${feature}:${threshold}`;

const agentDetailDeepLink = (agentId: string): string =>
  `/app/my-agents?agent_id=${encodeURIComponent(agentId)}`;

/**
 * E-15: Notify users who invoked this agent in the last 7 days about version / listing changes.
 * Maps to in-app type `agent_status_change` (email channel in E-16 uses `agent_status_changed`).
 */
export async function notifyAgentLifecycleChangeAsync(params: {
  agentId: string;
  agentName: string;
  changeKind: "version_updated" | "listing_maintenance" | "listing_listed" | "listing_delisted";
  version?: string;
  summary?: string;
}): Promise<void> {
  const userIds = await listDistinctUserActorIdsForAgentAsync(params.agentId, {
    lookbackDays: 7,
    limit: 5000,
  });
  const { changeKind, agentName, agentId, version, summary } = params;
  const summaries =
    changeKind === "version_updated"
      ? {
          summary_zh: `Agent「${agentName}」已发布新版本 ${version ?? ""}。${summary ? ` ${summary}` : ""}`,
          summary_en: `Agent "${agentName}" published version ${version ?? ""}.${summary ? ` ${summary}` : ""}`,
          summary_ja: `エージェント「${agentName}」がバージョン ${version ?? ""} を公開しました。${summary ? ` ${summary}` : ""}`,
        }
      : changeKind === "listing_maintenance"
        ? {
            summary_zh: `Agent「${agentName}」已进入维护模式，新调用将暂时不可用。`,
            summary_en: `Agent "${agentName}" is in maintenance; new invocations are paused.`,
            summary_ja: `エージェント「${agentName}」はメンテナンス中です。新規呼び出しは一時停止されています。`,
          }
        : changeKind === "listing_delisted"
          ? {
              summary_zh: `Agent「${agentName}」已下架。`,
              summary_en: `Agent "${agentName}" has been delisted.`,
              summary_ja: `エージェント「${agentName}」の掲載が終了しました。`,
            }
          : {
              summary_zh: `Agent「${agentName}」已恢复上架/可用。`,
              summary_en: `Agent "${agentName}" is listed again and accepting invocations.`,
              summary_ja: `エージェント「${agentName}」が再び利用可能になりました。`,
            };

  for (const userId of userIds) {
    await recordNotificationEventAsync({
      user_id: userId,
      event_type: `agent.lifecycle.${changeKind}`,
      notification_type: "agent_status_change",
      deep_link: agentDetailDeepLink(agentId),
      payload: {
        agent_id: agentId,
        agent_name: agentName,
        change_kind: changeKind,
        version: version ?? null,
        summary: summary ?? null,
        ...summaries,
      },
    });
  }
}

/**
 * E-12: 配额阈值通知 — 同一用户同一 feature 同一阈值 1 小时内只落库一次（Redis `SET NX` + TTL 3600）。
 * 无 Redis 时保持原行为：每次越阈都写入。
 */
export async function recordQuotaWarningWithHourlyDedupAsync(params: {
  userId: string;
  feature: string;
  threshold: "80" | "100";
  eventType: "quota.threshold_80" | "quota.threshold_100";
  deepLink: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const r = getRedisCommandsClient();
  if (!r) {
    await recordNotificationEventAsync({
      user_id: params.userId,
      event_type: params.eventType,
      notification_type: "quota_warning",
      deep_link: params.deepLink,
      payload: params.payload,
    });
    return;
  }
  const key = quotaDedupKey(params.userId, params.feature, params.threshold);
  const ok = await r.set(key, "1", "EX", 3600, "NX");
  if (ok !== "OK") {
    return;
  }
  await recordNotificationEventAsync({
    user_id: params.userId,
    event_type: params.eventType,
    notification_type: "quota_warning",
    deep_link: params.deepLink,
    payload: params.payload,
  });
}

/** E-8: Trust / invocation 待审批 → 通知请求人（产品内 deep link）。 */
export async function notifyReviewRequiredAsync(params: {
  userId: string;
  conversationId: string;
  invocationId: string;
}): Promise<void> {
  await recordNotificationEventAsync({
    user_id: params.userId,
    event_type: "invocation.review_required",
    notification_type: "review_required",
    deep_link: reviewDeepLink(params.conversationId, params.invocationId),
    payload: {
      conversation_id: params.conversationId,
      invocation_id: params.invocationId,
      summary_zh: "有待确认的 Agent 调用，请在审核队列或会话中处理。",
      summary_en: "An agent invocation needs your confirmation.",
      summary_ja: "エージェント呼び出しの確認が必要です。",
    },
  });
}

/** E-8: 编排步骤完成或失败 → 通知发起用户。 */
export async function notifyOrchestrationStepOutcomeAsync(params: {
  userId: string;
  conversationId: string;
  runId: string;
  stepIndex: number;
  outcome: "completed" | "failed";
  errorMessage?: string;
}): Promise<void> {
  await recordNotificationEventAsync({
    user_id: params.userId,
    event_type:
      params.outcome === "completed" ? "orchestration.step.done_notify" : "orchestration.step.failed_notify",
    notification_type: "task_completed",
    deep_link: orchestrationDeepLink(params.conversationId, params.runId),
    payload: {
      run_id: params.runId,
      step_index: params.stepIndex,
      outcome: params.outcome,
      error_message: params.errorMessage ?? null,
    },
  });
}

/** E-16: 定向邀请已有账号用户时发送应用内通知 + 邮件（`space_invitation`）。 */
export async function notifySpaceInvitationRecipientAsync(params: {
  inviteeUserId: string;
  spaceId: string;
  spaceName: string;
  invitationId: string;
  token: string;
  inviterLabel: string;
  presetRole: string;
  expiresAt: string;
}): Promise<void> {
  await recordNotificationEventAsync({
    user_id: params.inviteeUserId,
    event_type: "space.invitation_notification",
    notification_type: "space_invitation",
    deep_link: `/app/join-space?token=${encodeURIComponent(params.token)}`,
    payload: {
      space_id: params.spaceId,
      space_name: params.spaceName,
      invitation_id: params.invitationId,
      preset_role: params.presetRole,
      expires_at: params.expiresAt,
      inviter_label: params.inviterLabel,
      summary_zh: `${params.inviterLabel} 邀请你加入「${params.spaceName}」。`,
      summary_en: `${params.inviterLabel} invited you to join ${params.spaceName}.`,
      summary_ja: `「${params.spaceName}」への招待が届きました。`,
    },
  });
}

/** OAuth 回调落库后：访问令牌剩余有效期 ≤7 天时提醒重新授权（refresh 仍可用，但产品可提示）。 */
export async function notifyConnectorOAuthExpiringSoonAsync(params: {
  userId: string;
  authorizationId: string;
  provider: string;
  expiresAt: string | null;
}): Promise<void> {
  if (!params.expiresAt) return;
  const exp = Date.parse(params.expiresAt);
  if (Number.isNaN(exp)) return;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (exp - Date.now() > sevenDaysMs) return;
  await recordNotificationEventAsync({
    user_id: params.userId,
    event_type: "connector.oauth_expiring_soon",
    notification_type: "connector_expiring",
    deep_link: `/settings/connectors?authorization_id=${params.authorizationId}`,
    payload: {
      authorization_id: params.authorizationId,
      provider: params.provider,
      oauth_expires_at: params.expiresAt,
    },
  });
}
