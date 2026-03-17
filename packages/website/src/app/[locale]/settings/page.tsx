import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { SettingsPanel } from "@/components/settings-panel";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const title = dict.nav.settings ?? "Settings";

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted">Manage your session identity and notification preferences.</p>
      <SettingsPanel />
    </section>
  );
}
