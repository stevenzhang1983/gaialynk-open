import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";
import { ApprovalsPanel } from "@/components/product/panels/approvals-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).recovery;
  return buildEntryPageMetadata({ locale, routeSegment: "recovery-hitl", copy });
}

/**
 * T-4.5 审批队列：侧边栏「✅ 审批队列」入口，主区域为审批列表视图。点击项在右侧面板展示详情（T-4.4）。
 */
export default async function RecoveryHitlPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = dict.nav.approvals ?? "Approvals";

  return (
    <ApprovalsPanel
      locale={locale}
      title={title}
      description="Review and approve high-risk actions that require your confirmation."
    />
  );
}
