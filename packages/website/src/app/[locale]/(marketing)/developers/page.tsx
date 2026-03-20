import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).developers;
  return buildEntryPageMetadata({ locale, routeSegment: "developers", copy });
}

/** T-3.9 开发者社区主页面：概览 + 快速导航（Quick Start / SDK & API / A2A Protocol）。无独立 /docs 入口。 */
const NAV_CARDS: Record<
  Locale,
  Array<{ title: string; description: string; href: string; cta: string }>
> = {
  en: [
    {
      title: "Quick start",
      description: "Connect your first Agent in 5 minutes—Provider onboarding, health check, and first test call.",
      href: "/developers/quickstart",
      cta: "Read guide →",
    },
    {
      title: "SDK & API",
      description: "TypeScript, Python, and REST—integrate your Agent with the platform and get verified.",
      href: "/developers/sdk",
      cta: "View reference →",
    },
    {
      title: "A2A protocol",
      description: "Agent-to-Agent protocol, trust policies, and evidence chain for audit and receipts.",
      href: "/developers/protocol",
      cta: "Read protocol →",
    },
  ],
  "zh-Hant": [
    {
      title: "快速開始",
      description: "5 分鐘接入首個 Agent—Provider 入門、健康檢查與首次測試調用。",
      href: "/developers/quickstart",
      cta: "閱讀指南 →",
    },
    {
      title: "SDK & API",
      description: "TypeScript、Python、REST—讓你的 Agent 與平台對接並通過驗證。",
      href: "/developers/sdk",
      cta: "查看參考 →",
    },
    {
      title: "A2A 協議",
      description: "Agent 間協議、信任策略與審計與收據的證據鏈。",
      href: "/developers/protocol",
      cta: "閱讀協議 →",
    },
  ],
  "zh-Hans": [
    {
      title: "快速开始",
      description: "5 分钟接入首个 Agent—Provider 入门、健康检查与首次测试调用。",
      href: "/developers/quickstart",
      cta: "阅读指南 →",
    },
    {
      title: "SDK & API",
      description: "TypeScript、Python、REST—让你的 Agent 与平台对接并通过验证。",
      href: "/developers/sdk",
      cta: "查看参考 →",
    },
    {
      title: "A2A 协议",
      description: "Agent 间协议、信任策略与审计与收据的证据链。",
      href: "/developers/protocol",
      cta: "阅读协议 →",
    },
  ],
};

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).developers;
  const cards = NAV_CARDS[locale];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight text-foreground">
          {copy.title}
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">{copy.description}</p>
        <CtaLink
          primary
          href={`/${locale}/developers/quickstart`}
          eventName="docs_click"
          eventPayload={{
            locale,
            page: "developers",
            referrer: "internal",
            cta_id: "read_quickstart",
          }}
        >
          {copy.primaryCta}
        </CtaLink>
      </section>

      <section aria-label="Quick navigation" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={`/${locale}${card.href}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-card transition hover:border-primary/30 hover:shadow-card-hover"
          >
            <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{card.description}</p>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-primary group-hover:underline">
              {card.cta}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
