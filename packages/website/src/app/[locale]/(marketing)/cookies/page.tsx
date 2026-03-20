import type { Locale } from "@/lib/i18n/locales";

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  await params;
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold">Cookie Notice</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">
        We use a locale preference cookie and minimal analytics cookies to understand conversion performance by page,
        locale, and CTA. You can clear cookie consent from browser storage at any time.
      </p>
    </section>
  );
}
