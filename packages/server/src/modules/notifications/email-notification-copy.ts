import type { EmailNotificationTemplateId, UserEmailLocale } from "../auth/user.store";
import type { NotificationAppType } from "./notification.store";

export function appNotificationTypeToEmailTemplateId(
  type: NotificationAppType,
): EmailNotificationTemplateId | null {
  switch (type) {
    case "task_completed":
      return "task_completed";
    case "review_required":
      return "human_review_required";
    case "quota_warning":
      return "quota_warning";
    case "agent_status_change":
      return "agent_status_changed";
    case "connector_expiring":
      return "connector_expired";
    case "space_invitation":
      return "space_invitation";
    default:
      return null;
  }
}

function pickSummary(payload: Record<string, unknown>, locale: UserEmailLocale): string {
  const zh = typeof payload.summary_zh === "string" ? payload.summary_zh : "";
  const en = typeof payload.summary_en === "string" ? payload.summary_en : "";
  const ja = typeof payload.summary_ja === "string" ? payload.summary_ja : "";
  if (locale === "zh" && zh) return zh;
  if (locale === "ja" && ja) return ja;
  if (en) return en;
  if (zh) return zh;
  if (ja) return ja;
  return "";
}

export interface EmailCopyResult {
  subject: string;
  title: string;
  body: string;
  cta_label: string;
}

export function buildEmailCopyForTemplate(params: {
  templateId: EmailNotificationTemplateId;
  locale: UserEmailLocale;
  payload: Record<string, unknown>;
}): EmailCopyResult {
  const { templateId, locale, payload } = params;
  const summary = pickSummary(payload, locale);

  const L = <T extends Record<UserEmailLocale, { subject: string; title: string; body: string; cta: string }>>(
    row: T,
  ): EmailCopyResult => ({
    subject: row[locale].subject,
    title: row[locale].title,
    body: summary || row[locale].body,
    cta_label: row[locale].cta,
  });

  switch (templateId) {
    case "task_completed":
      return L({
        zh: {
          subject: "编排步骤已完成或失败",
          title: "任务状态更新",
          body: summary || "你的编排运行有新的步骤结果，请在应用中查看详情。",
          cta: "打开应用",
        },
        en: {
          subject: "Orchestration step finished",
          title: "Task update",
          body: summary || "A step in your orchestration run has completed or failed. Open the app for details.",
          cta: "Open app",
        },
        ja: {
          subject: "オーケストレーションのステップが完了しました",
          title: "タスクの更新",
          body: summary || "オーケストレーション実行のステップが完了または失敗しました。詳細はアプリで確認してください。",
          cta: "アプリを開く",
        },
      });
    case "human_review_required":
      return L({
        zh: {
          subject: "需要你确认一次 Agent 调用",
          title: "人审请求",
          body: summary || "有待确认的 Agent 调用，请在审核队列或会话中处理。",
          cta: "前往审核",
        },
        en: {
          subject: "Agent invocation needs your review",
          title: "Human review required",
          body: summary || "An agent invocation needs your confirmation.",
          cta: "Review now",
        },
        ja: {
          subject: "エージェント呼び出しの確認が必要です",
          title: "人による確認が必要です",
          body: summary || "エージェント呼び出しの確認が必要です。",
          cta: "確認する",
        },
      });
    case "quota_warning":
      return L({
        zh: {
          subject: "配额提醒",
          title: "用量接近或达到上限",
          body: summary || "你的配额使用已达到提醒阈值，请在设置中查看用量详情。",
          cta: "查看用量",
        },
        en: {
          subject: "Quota warning",
          title: "Usage threshold reached",
          body: summary || "Your usage crossed a quota warning threshold. Check usage in settings.",
          cta: "View usage",
        },
        ja: {
          subject: "クォータの警告",
          title: "使用量のしきい値",
          body: summary || "クォータの警告しきい値を超えました。設定で使用量を確認してください。",
          cta: "使用量を見る",
        },
      });
    case "agent_status_changed":
      return L({
        zh: {
          subject: "Agent 状态更新",
          title: "你使用过的 Agent 有变更",
          body: summary || "与你相关的 Agent 版本或上架状态已更新。",
          cta: "查看 Agent",
        },
        en: {
          subject: "Agent status update",
          title: "An agent you used has changed",
          body: summary || "Version or listing status changed for an agent you recently invoked.",
          cta: "View agent",
        },
        ja: {
          subject: "エージェントの状態が更新されました",
          title: "利用したエージェントに変更があります",
          body: summary || "最近利用したエージェントのバージョンまたは掲載状態が更新されました。",
          cta: "エージェントを見る",
        },
      });
    case "connector_expired": {
      const provider = typeof payload.provider === "string" ? payload.provider : "connector";
      return L({
        zh: {
          subject: "连接器授权即将过期",
          title: "请重新授权连接器",
          body: `${provider} 的访问令牌将在短期内过期，请尽快在设置中重新连接。`,
          cta: "管理连接器",
        },
        en: {
          subject: "Connector authorization expiring",
          title: "Reconnect your connector",
          body: `The access token for ${provider} will expire soon. Re-authorize in settings.`,
          cta: "Manage connectors",
        },
        ja: {
          subject: "コネクタの認証の有効期限",
          title: "コネクタを再接続してください",
          body: `${provider} のトークンがまもなく期限切れになります。設定から再認証してください。`,
          cta: "コネクタを管理",
        },
      });
    }
    case "space_invitation": {
      const spaceName =
        typeof payload.space_name === "string" && payload.space_name.trim()
          ? payload.space_name
          : "Space";
      const inviter =
        typeof payload.inviter_label === "string" && payload.inviter_label.trim()
          ? payload.inviter_label
          : "A teammate";
      return L({
        zh: {
          subject: `加入「${spaceName}」的邀请`,
          title: "Space 邀请",
          body: `${inviter} 邀请你加入「${spaceName}」。点击下方按钮接受邀请。`,
          cta: "加入 Space",
        },
        en: {
          subject: `Invitation to join ${spaceName}`,
          title: "Space invitation",
          body: `${inviter} invited you to join ${spaceName}. Use the button below to accept.`,
          cta: "Join space",
        },
        ja: {
          subject: `「${spaceName}」への招待`,
          title: "スペースへの招待",
          body: `${inviter} があなたを「${spaceName}」に招待しました。下のボタンから参加できます。`,
          cta: "スペースに参加",
        },
      });
    }
  }
}
