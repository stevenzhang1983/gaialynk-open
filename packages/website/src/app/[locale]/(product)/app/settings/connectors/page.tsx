import { W10ConnectorsSettingsPanel } from "@/components/product/settings/w10-connectors-settings";
import { PanelLayout } from "@/components/product/panels/panel-layout";
import { getW10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

export default async function SettingsConnectorsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getW10SettingsSuiteCopy(locale);

  return (
    <PanelLayout locale={locale} title={copy.connectorsTitle} description={copy.connectorsLead}>
      <W10ConnectorsSettingsPanel locale={locale} copy={copy} />
    </PanelLayout>
  );
}
