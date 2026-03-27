import type { Metadata } from "next";
import { RichLine } from "@/components/marketing/rich-line";
import { getCookiesPageCopy } from "@/content/cookies-page";
import type { Locale } from "@/lib/i18n/locales";
import { isSupportedLocale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: loc } = await params;
  if (!isSupportedLocale(loc)) {
    return {};
  }
  const locale = loc as Locale;
  const c = getCookiesPageCopy(locale);
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `/${locale}/cookies` },
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = getCookiesPageCopy(locale);

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">{c.title}</h1>
      <div className="max-w-3xl space-y-3 text-base leading-relaxed text-muted-foreground">
        {c.body.map((p, i) => (
          <p key={i}>
            <RichLine text={p} />
          </p>
        ))}
      </div>
    </section>
  );
}
