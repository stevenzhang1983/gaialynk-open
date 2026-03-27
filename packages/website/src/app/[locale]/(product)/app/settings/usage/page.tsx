import { W10UsageQuotaDashboard } from "@/components/product/settings/w10-usage-quota-dashboard";
import { PanelLayout } from "@/components/product/panels/panel-layout";
import { getW10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

export default async function SettingsUsagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ feature?: string | string[] }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const feature = typeof sp.feature === "string" ? sp.feature : undefined;
  const copy = getW10SettingsSuiteCopy(locale);

  return (
    <PanelLayout locale={locale} title={copy.usageTitle} description={copy.usageLead}>
      <W10UsageQuotaDashboard copy={copy} highlightFeature={feature} />
    </PanelLayout>
  );
}
