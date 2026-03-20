import type { Metadata } from "next";
import { LeadForm } from "@/components/lead-form";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).demo;
  return {
    title: copy.seoTitle,
    description: copy.seoDescription,
    alternates: { canonical: `/${locale}/demo` },
  };
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).demo;

  return (
    <section className="space-y-6">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="max-w-3xl text-base text-muted-foreground">{copy.description}</p>
      <LeadForm locale={locale} type="demo" submitLabel={copy.primaryCta} />
    </section>
  );
}
