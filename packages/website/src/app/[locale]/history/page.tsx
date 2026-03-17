import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { SubscriptionsDemo } from "@/components/subscriptions-demo";

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">{dict.nav.history ?? "History"}</h1>
      <p className="text-sm text-muted">Review run history and export evidence for your task executions.</p>
      <SubscriptionsDemo locale={locale} />
    </section>
  );
}

