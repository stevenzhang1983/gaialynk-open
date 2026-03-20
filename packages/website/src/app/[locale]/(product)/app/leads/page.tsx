import type { Locale } from "@/lib/i18n/locales";
import { LeadsAdminPanel } from "@/components/leads-admin-panel";

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <LeadsAdminPanel locale={locale} />;
}
