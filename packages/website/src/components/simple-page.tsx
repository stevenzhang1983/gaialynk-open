import { CtaLink } from "@/components/cta-link";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import type { Dictionary, PageCopy } from "@/content/types";

type PageKey = keyof Pick<Dictionary, "developers" | "trust" | "useCases" | "waitlist" | "demo" | "docs">;

type SimplePageProps = {
  locale: Locale;
  pageKey: PageKey;
  primaryHref: string;
};

function resolvePageCopy(dict: Dictionary, key: PageKey): PageCopy {
  return dict[key];
}

export function SimplePage({ locale, pageKey, primaryHref }: SimplePageProps) {
  const dict = getDictionary(locale);
  const copy = resolvePageCopy(dict, pageKey);

  return (
    <section className="space-y-6">
      <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="max-w-3xl text-base text-muted-foreground">{copy.description}</p>
      <CtaLink primary href={primaryHref}>
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
