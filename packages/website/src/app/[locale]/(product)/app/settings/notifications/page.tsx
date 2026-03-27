import { W10NotificationPreferencesCard } from "@/components/product/settings/w10-account-and-notifications";
import { PanelLayout } from "@/components/product/panels/panel-layout";
import { getW10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

export default async function SettingsNotificationsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getW10SettingsSuiteCopy(locale);

  return (
    <PanelLayout locale={locale} title={copy.notificationsTitle} description={copy.notificationsLead}>
      <W10NotificationPreferencesCard copy={copy} />
    </PanelLayout>
  );
}
