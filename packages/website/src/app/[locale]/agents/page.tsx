import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { AgentsDemo } from "@/components/agents-demo";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold text-foreground">{dict.nav.agents ?? "Agents"}</h1>
      <p className="text-sm text-muted">Browse available agents, capabilities, and risk labels.</p>
      <AgentsDemo />
    </section>
  );
}

