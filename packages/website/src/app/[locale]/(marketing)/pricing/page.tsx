import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    freeTitle: string;
    freeDescription: string;
    contactTitle: string;
    contactDescription: string;
    ctaContact: string;
    ctaDemo: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "Pricing",
    subtitle: "Simple, transparent options. Pricing model is being finalized—contact us for Pro, Team, or Enterprise.",
    freeTitle: "Free tier",
    freeDescription: "Get started with verified Agent access, conversation runtime, and basic audit receipts. No credit card required.",
    contactTitle: "Pro / Team / Enterprise",
    contactDescription: "Managed orchestration, advanced governance, dedicated support, and custom SLAs. Tell us your use case and we’ll tailor a plan.",
    ctaContact: "Contact Us",
    ctaDemo: "Book a Demo",
    seoTitle: "Pricing - GaiaLynk",
    seoDescription: "Free tier and Pro/Team/Enterprise options. Contact us for custom plans.",
  },
  "zh-Hant": {
    title: "定價",
    subtitle: "定價方案仍在完善中，Pro / Team / Enterprise 請與我們聯絡。",
    freeTitle: "免費方案",
    freeDescription: "可驗證 Agent 准入、會話 Runtime 與基礎審計收據，無需信用卡。",
    contactTitle: "Pro / Team / Enterprise",
    contactDescription: "託管編排、進階治理、專屬支援與自訂 SLA。說明你的場景，我們為你規劃方案。",
    ctaContact: "聯絡我們",
    ctaDemo: "預約 Demo",
    seoTitle: "定價 - GaiaLynk",
    seoDescription: "免費方案與 Pro/Team/Enterprise，歡迎聯絡洽談。",
  },
  "zh-Hans": {
    title: "定价",
    subtitle: "定价方案仍在完善中，Pro / Team / Enterprise 请与我们联系。",
    freeTitle: "免费方案",
    freeDescription: "可验证 Agent 准入、会话 Runtime 与基础审计收据，无需信用卡。",
    contactTitle: "Pro / Team / Enterprise",
    contactDescription: "托管编排、进阶治理、专属支持与自定义 SLA。说明你的场景，我们为你规划方案。",
    ctaContact: "联系我们",
    ctaDemo: "预约 Demo",
    seoTitle: "定价 - GaiaLynk",
    seoDescription: "免费方案与 Pro/Team/Enterprise，欢迎联系洽谈。",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = COPY[locale];
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `/${locale}/pricing` },
  };
}

/**
 * T-3.11 定价页：免费额度 + Pro/Team/Enterprise 用 Contact Us 占位。
 */
export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = COPY[locale];

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {c.title}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{c.subtitle}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.freeTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.freeDescription}</p>
          <CtaLink
            primary
            href={`/${locale}/app`}
            eventName="cta_click"
            eventPayload={{
              locale,
              page: "pricing",
              referrer: "pricing_cta",
              cta_id: "open_app",
            }}
          >
            {c.ctaDemo}
          </CtaLink>
        </section>
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.contactTitle}</h2>
          <p className="mt-3 text-muted-foreground">{c.contactDescription}</p>
          <Link
            href={`/${locale}/demo`}
            className="mt-4 inline-flex rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            {c.ctaContact}
          </Link>
        </section>
      </div>
    </div>
  );
}
