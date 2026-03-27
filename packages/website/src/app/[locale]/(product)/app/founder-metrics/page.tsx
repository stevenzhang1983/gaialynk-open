import type { Locale } from "@/lib/i18n/locales";
import { FounderMetricsDashboard } from "@/components/founder-metrics-dashboard";

export default async function FounderMetricsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <FounderMetricsDashboard initialLocale={locale} />;
}
