import type { Metadata } from "next";
import { getPricingPageCopy } from "@/content/pricing-page";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = getPricingPageCopy(locale);
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `/${locale}/pricing` },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const c = getPricingPageCopy((await params).locale);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
      <h1 className="text-center font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {c.headline}
      </h1>
    </div>
  );
}
