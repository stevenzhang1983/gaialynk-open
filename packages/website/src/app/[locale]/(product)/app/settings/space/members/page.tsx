import type { Locale } from "@/lib/i18n/locales";
import { getSpaceUiCopy } from "@/content/i18n/product-experience";
import { SpaceMembersPanel } from "@/components/product/settings/space-members-panel";
import { PanelLayout } from "@/components/product/panels/panel-layout";

/**
 * W-3：Space 成员与邀请链接管理。
 */
export default async function SpaceMembersSettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getSpaceUiCopy(locale);

  return (
    <PanelLayout locale={locale} title={copy.membersTitle} description={copy.membersDescription}>
      <SpaceMembersPanel locale={locale} />
    </PanelLayout>
  );
}
