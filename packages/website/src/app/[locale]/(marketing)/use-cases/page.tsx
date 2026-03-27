import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import { CompanyAJourneySection } from "@/components/marketing/company-a-journey-section";
import { RichLine } from "@/components/marketing/rich-line";
import { getCompanyAJourneyChapters } from "@/content/use-cases-company-a-journey";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

const ROADMAP_CROSS: Record<Locale, { before: string; link: string; after: string }> = {
  en: {
    before: "For what is available now and what we prioritize next, open the ",
    link: "roadmap",
    after: ". We update it as capabilities ship.",
  },
  "zh-Hant": {
    before: "若需了解目前可用範圍與後續優先事項，請開啟",
    link: "產品路線圖",
    after: "。隨能力上線持續更新。",
  },
  "zh-Hans": {
    before: "若需了解目前可用范围与后续优先事项，请开启",
    link: "产品路线图",
    after: "。随能力上线持续更新。",
  },
};

const JOURNEY_SECTION: Record<Locale, { title: string; intro: string; eyebrow: string }> = {
  en: {
    eyebrow: "How the story unfolds",
    title: "Choose the chapter that fits you",
    intro: "Each chapter reflects a different scale: solo work, team collaboration, or cross-organization coordination.",
  },
  "zh-Hant": {
    eyebrow: "故事如何展開",
    title: "選擇最貼近你的一章",
    intro: "各章對應不同工作尺度：個人作業、團隊協作或跨組織協調。",
  },
  "zh-Hans": {
    eyebrow: "故事如何展开",
    title: "选择最贴近你的一章",
    intro: "各章对应不同工作尺度：个人作业、团队协作或跨组织协调。",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).useCases;
  return buildEntryPageMetadata({ locale, routeSegment: "use-cases", copy });
}

export default async function UseCasesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const copy = dict.useCases;
  const chapters = getCompanyAJourneyChapters(locale);
  const roadmap = ROADMAP_CROSS[locale];
  const journey = JOURNEY_SECTION[locale];

  return (
    <div className="space-y-14">
      <header
        className="relative overflow-hidden rounded-2xl border border-border shadow-card"
        aria-labelledby="use-cases-hero-heading"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{ background: "var(--gradient-brand-subtle)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-accent/8 blur-3xl"
          aria-hidden
        />

        <div className="relative space-y-5 px-6 py-10 sm:px-8 sm:py-12 md:px-10 md:py-14">
          <h1
            id="use-cases-hero-heading"
            className="max-w-[min(100%,40ch)] font-display text-h1 font-bold leading-tight tracking-tight text-foreground md:text-[clamp(2rem,2.2vw+1.5rem,2.75rem)] md:leading-snug"
          >
            {copy.title}
          </h1>
          <p className="max-w-[65ch] text-body-lg leading-body-relaxed text-muted-foreground">
            <RichLine text={copy.description} />
          </p>
          <p className="max-w-[65ch] text-body leading-body-relaxed text-muted-foreground">
            {roadmap.before}
            <Link
              href={`/${locale}/roadmap`}
              className="font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
            >
              {roadmap.link}
            </Link>
            {roadmap.after}
          </p>
        </div>
      </header>

      <CompanyAJourneySection eyebrow={journey.eyebrow} title={journey.title} intro={journey.intro} chapters={chapters} />

      <CtaLink
        primary
        href={`/${locale}/app`}
        eventName="cta_click"
        eventPayload={{
          locale,
          page: "use_cases",
          referrer: "internal",
          cta_id: "open_app",
        }}
      >
        {copy.primaryCta}
      </CtaLink>
    </div>
  );
}
