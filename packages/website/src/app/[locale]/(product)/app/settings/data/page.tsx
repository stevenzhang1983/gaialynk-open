import { W10DataPrivacyPanel } from "@/components/product/settings/w10-data-privacy-panel";
import { PanelLayout } from "@/components/product/panels/panel-layout";
import { getW10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

export default async function SettingsDataPrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getW10SettingsSuiteCopy(locale);

  return (
    <PanelLayout locale={locale} title={copy.dataTitle} description={copy.dataLead}>
      <W10DataPrivacyPanel copy={copy} />
    </PanelLayout>
  );
}
