import type { Metadata } from "next";
import { ConnectorsGovernanceDemo } from "@/components/connectors-governance-demo";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";
import { ConnectorPanel } from "@/components/product/panels/connector-panel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).connectors;
  return buildEntryPageMetadata({ locale, routeSegment: "connectors-governance", copy });
}

/**
 * T-4.5 连接器：侧边栏「🔗 连接器」入口，主区域为连接器管理视图。
 */
export default async function ConnectorsGovernancePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).connectors;

  return (
    <ConnectorPanel
      locale={locale}
      title={copy.title}
      description={copy.description}
    >
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Demo — Authorizations & receipts</h2>
        <ConnectorsGovernanceDemo locale={locale} />
      </div>
    </ConnectorPanel>
  );
}
