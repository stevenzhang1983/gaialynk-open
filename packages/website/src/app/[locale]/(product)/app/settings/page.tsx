import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { SettingsPanel } from "@/components/settings-panel";
import { PanelLayout } from "@/components/product/panels/panel-layout";

/**
 * T-4.5 设置：侧边栏「⚙️ 设置」入口，主区域为设置面板。
 */
export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = dict.nav.settings ?? "Settings";

  return (
    <PanelLayout
      locale={locale}
      title={title}
      description="Manage your session identity and notification preferences."
    >
      <SettingsPanel />
    </PanelLayout>
  );
}
