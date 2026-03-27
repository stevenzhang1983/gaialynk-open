import type { Metadata } from "next";
import { RichLine } from "@/components/marketing/rich-line";
import { getPrivacyPageCopy } from "@/content/privacy-page";
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
  const c = getPrivacyPageCopy(locale);
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: {
      canonical: `/${locale}/privacy`,
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = getPrivacyPageCopy(locale);

  return (
    <section className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{c.title}</h1>
        <div className="mt-4 max-w-3xl space-y-3 text-base leading-relaxed text-muted-foreground">
          {c.intro.map((p, i) => (
            <p key={`intro-${i}`}>
              <RichLine text={p} />
            </p>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{c.cookiesSectionTitle}</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 text-base leading-relaxed text-muted-foreground">
          {c.cookiesSection.map((p, i) => (
            <li key={`cookie-${i}`}>
              <RichLine text={p} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{c.retentionSectionTitle}</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 text-base leading-relaxed text-muted-foreground">
          {c.retentionSection.map((p, i) => (
            <li key={`retention-${i}`}>
              <RichLine text={p} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{c.ugcSectionTitle}</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 text-base leading-relaxed text-muted-foreground">
          {c.ugcSection.map((p, i) => (
            <li key={`ugc-${i}`}>
              <RichLine text={p} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
