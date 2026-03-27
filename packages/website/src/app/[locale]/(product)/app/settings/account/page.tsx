import { W10AccountSessionCard } from "@/components/product/settings/w10-account-and-notifications";
import { PanelLayout } from "@/components/product/panels/panel-layout";
import { getW10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

export default async function SettingsAccountPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getW10SettingsSuiteCopy(locale);

  return (
    <PanelLayout locale={locale} title={copy.accountTitle} description={copy.accountLead}>
      <W10AccountSessionCard copy={copy} />
    </PanelLayout>
  );
}
