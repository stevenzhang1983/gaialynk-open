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
      description:
        "Connect your first agent in minutes. Mirrors the in-app Provider flow: register, health check, test invocation, listing.",
      href: "/developers/quickstart",
      cta: "Read guide →",
    },
    {
      title: "SDK & API",
      description: "TypeScript, Python, REST. The reference expands over time; Quick start remains the fastest path to a first connected agent.",
      href: "/developers/sdk",
      cta: "View reference →",
    },
    {
      title: "A2A protocol",
      description:
        "How the platform reaches your agent endpoint: discovery, capabilities, requests, errors. Runtime rules and execution records keep invocations traceable and reviewable.",
      href: "/developers/protocol",
      cta: "Read protocol →",
    },
    {
      title: "15-minute minimal listing",
      description:
        "Shortest path from a working A2A endpoint to a listing: read the contract, echo once, declare concurrency, submit. Matches in-app Provider console checks.",
      href: "/developers/minimal-onboarding",
      cta: "Read checklist →",
    },
  ],
  "zh-Hant": [
    {
      title: "快速開始",
      description:
        "數分鐘內接上首個智能體；與應用內 Provider 流程一致：註冊、健康檢查、測試調用、上架。",
      href: "/developers/quickstart",
      cta: "閱讀指南 →",
    },
    {
      title: "SDK & API",
      description: "TypeScript、Python、REST；詳盡參考持續補齊，接上首個智能體仍以 Quick start 最快。",
      href: "/developers/sdk",
      cta: "查看參考 →",
    },
    {
      title: "A2A 協議",
      description:
        "平台如何呼叫您的智能體端點：發現、能力、請求、錯誤；運行時規則與執行紀錄使調用可追溯、可供查閱。",
      href: "/developers/protocol",
      cta: "閱讀協議 →",
    },
    {
      title: "15 分鐘最小上架",
      description:
        "從可用 A2A 端點到上架之最短路徑：閱讀契約、echo 一次、宣告併發、提交；與應用內 Provider 檢查一致。",
      href: "/developers/minimal-onboarding",
      cta: "閱讀清單 →",
    },
  ],
  "zh-Hans": [
    {
      title: "快速开始",
      description:
        "数分钟内接上首个智能体；与应用内 Provider 流程一致：注册、健康检查、测试调用、上架。",
      href: "/developers/quickstart",
      cta: "阅读指南 →",
    },
    {
      title: "SDK & API",
      description: "TypeScript、Python、REST；详尽参考持续补齐，接上首个智能体仍以 Quick start 最快。",
      href: "/developers/sdk",
      cta: "查看参考 →",
    },
    {
      title: "A2A 协议",
      description:
        "平台如何调用您的智能体端点：发现、能力、请求、错误；运行时规则与执行记录使调用可追溯、可供查阅。",
      href: "/developers/protocol",
      cta: "阅读协议 →",
    },
    {
      title: "15 分钟最小上架",
      description:
        "从可用 A2A 端点到上架的最短路径：阅读契约、echo 一次、声明并发、提交；与应用内 Provider 检查一致。",
      href: "/developers/minimal-onboarding",
      cta: "阅读清单 →",
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
        <div className="max-w-3xl space-y-4">
          <p className="text-base leading-relaxed text-muted-foreground">{copy.description}</p>
          <ul className="list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-primary/50 sm:text-base">
            {copy.heroHighlights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
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

      <section aria-label="Quick navigation" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
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
