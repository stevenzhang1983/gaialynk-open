import { ScheduledTaskManager } from "@/components/product/scheduled-task-manager";
import { getW20ScheduledTasksCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

export default async function ScheduledTasksSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isSupportedLocale(raw) ? raw : "en";
  const copy = getW20ScheduledTasksCopy(locale);
  const localePrefix = `/${locale}`;
  return <ScheduledTaskManager locale={locale} localePrefix={localePrefix} copy={copy} />;
}
