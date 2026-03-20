import { CtaLink } from "@/components/cta-link";
import type { Locale } from "@/lib/i18n/locales";

export type FinalCtaCopy = {
  heading: string;
  openApp: string;
  startBuilding: string;
  bookDemo: string;
};

type FinalCtaSectionProps = {
  copy: FinalCtaCopy;
  locale: Locale;
};

/**
 * T-3.7 首页收尾 CTA 区域：准备好了吗？+ Open App / Start Building / Book a Demo。
 * 不包含 Join Waitlist（按 CTO 指令）。
 */
export function FinalCtaSection({ copy, locale }: FinalCtaSectionProps) {
  return (
    <section
      className="flex flex-col items-center justify-center gap-8 rounded-2xl border border-border bg-card py-12 px-6 text-center"
      aria-labelledby="final-cta-heading"
    >
      <h2
        id="final-cta-heading"
        className="text-subheading font-semibold text-foreground md:text-h3"
      >
        {copy.heading}
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <CtaLink
          href={`/${locale}/app`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "home",
            referrer: "internal",
            cta_id: "open_app",
          }}
        >
          {copy.openApp}
        </CtaLink>
        <CtaLink
          primary
          href={`/${locale}/developers`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "home",
            referrer: "internal",
            cta_id: "start_building",
          }}
        >
          {copy.startBuilding}
        </CtaLink>
        <CtaLink
          href={`/${locale}/demo`}
          eventName="demo_click"
          eventPayload={{
            locale,
            page: "home",
            referrer: "internal",
            cta_id: "final_cta_book_demo",
          }}
        >
          {copy.bookDemo}
        </CtaLink>
      </div>
    </section>
  );
}
