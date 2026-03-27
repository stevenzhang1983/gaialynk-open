import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { AgentDirectory } from "@/components/product/agent-directory";
import { PanelLayout } from "@/components/product/panels/panel-layout";

/**
 * T-4.1 / T-4.5 智能体中心（Agent Hub）：侧边栏入口，主区域为浏览视图。未登录也可访问。
 */
export default async function AgentsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = dict.nav.agents ?? "Agents";

  return (
    <PanelLayout
      locale={locale}
      title={title}
      description="Browse verified agents, capabilities, and risk labels. Click a card to see details in the panel."
    >
      <AgentDirectory />
    </PanelLayout>
  );
}

