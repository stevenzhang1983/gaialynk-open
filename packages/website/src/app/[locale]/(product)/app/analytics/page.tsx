import type { Locale } from "@/lib/i18n/locales";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <AnalyticsDashboard initialLocale={locale} />;
}
