import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";
import { TasksPanel } from "@/components/product/panels/tasks-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).subscriptions;
  return buildEntryPageMetadata({ locale, routeSegment: "subscriptions", copy });
}

/**
 * T-4.5 任务中心：侧边栏「📋 任务中心」入口，主区域为任务列表视图。
 */
export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = dict.nav.tasks ?? "Tasks";

  return (
    <TasksPanel
      locale={locale}
      title={title}
      description="View and manage your recurring tasks and subscriptions."
    />
  );
}
