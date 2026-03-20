import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { HistoryPanel } from "@/components/product/panels/history-panel";

/**
 * T-4.5 历史记录：侧边栏「📊 历史记录」入口，主区域为历史列表 + 回放视图。
 */
export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = dict.nav.history ?? "History";

  return (
    <HistoryPanel
      locale={locale}
      title={title}
      description="Browse run history and replay past executions."
    />
  );
}

