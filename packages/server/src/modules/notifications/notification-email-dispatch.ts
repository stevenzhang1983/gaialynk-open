import { getUserByIdAsync, getUserNotificationPreferencesJsonAsync } from "../auth/user.store";
import {
  appNotificationTypeToEmailTemplateId,
  buildEmailCopyForTemplate,
} from "./email-notification-copy";
import { isResendConfigured, sendTemplateEmailAsync } from "./email.service";
import type { NotificationEvent } from "./notification.store";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appBaseUrl(): string {
  return (process.env.GAIALYNK_APP_BASE_URL ?? "https://app.example.com").replace(/\/$/, "");
}

function absoluteDeepLink(locale: string, deepLink: string | null): string {
  const base = appBaseUrl();
  if (!deepLink?.trim()) return `${base}/${locale}/app/chat`;
  const path = deepLink.startsWith("/") ? deepLink : `/${deepLink}`;
  return `${base}/${locale}${path}`;
}

/** Fire-and-forget from notification.store after a row is persisted. */
export function scheduleNotificationEmailAsync(event: NotificationEvent): void {
  queueMicrotask(() => {
    void dispatchNotificationEmailAsync(event).catch((err: unknown) => {
      console.error("[notification-email]", err);
    });
  });
}

export async function dispatchNotificationEmailAsync(event: NotificationEvent): Promise<void> {
  if (!isResendConfigured()) return;
  const templateId = appNotificationTypeToEmailTemplateId(event.type);
  if (!templateId) return;

  const prefs = await getUserNotificationPreferencesJsonAsync(event.user_id);
  if (!prefs.email_enabled) return;
  if (!prefs.email_types.includes(templateId)) return;

  const user = await getUserByIdAsync(event.user_id);
  if (!user?.email) return;

  const copy = buildEmailCopyForTemplate({
    templateId,
    locale: prefs.email_locale,
    payload: event.payload,
  });
  const ctaUrl = absoluteDeepLink(prefs.email_locale, event.deep_link);
  await sendTemplateEmailAsync({
    to: user.email,
    templateId,
    subject: copy.subject,
    variables: {
      title: escapeHtml(copy.title),
      body: escapeHtml(copy.body),
      cta_label: escapeHtml(copy.cta_label),
      cta_url: escapeHtml(ctaUrl),
    },
  });
}
