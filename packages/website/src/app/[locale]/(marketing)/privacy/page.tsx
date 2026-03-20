import type { Locale } from "@/lib/i18n/locales";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  await params;
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Privacy Policy</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">
        We only collect minimum lead form fields (name, email, company, and stated use case) and basic interaction
        events required for funnel analysis. Sensitive content is not sent via analytics payloads.
      </p>
    </section>
  );
}
