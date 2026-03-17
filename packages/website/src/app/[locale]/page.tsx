import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/content/dictionaries";
import { getVisionTracks } from "@/content/vision-coverage";
import type { Locale } from "@/lib/i18n/locales";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const home = dict.home;
  const visionTracks = getVisionTracks(locale);
  const uiText = {
    en: {
      panoramaTitle: "Vision Coverage Panorama",
      panoramaDesc: "Track-by-track coverage from public narrative to real product path.",
      ctaPrefix: "CTA",
      helper: "Need a guided onboarding path? Choose a secondary route.",
      entryTitle: "Product Entry by User Intent",
      entryDesc: "Two lanes for immediate asks and recurring automation, with governance visible at every step.",
      entryCards: [
        { href: "/ask", title: "Ask Path Demo", status: "In Progress", cta: "Explore Ask" },
        { href: "/recovery-hitl", title: "Recovery + HITL", status: "In Progress", cta: "Review Fallbacks" },
        { href: "/subscriptions", title: "Recurring Tasks", status: "Coming Soon", cta: "See Lifecycle" },
        { href: "/connectors-governance", title: "Connector Governance", status: "Coming Soon", cta: "View Controls" },
      ] as const,
    },
    "zh-Hant": {
      panoramaTitle: "願景覆蓋全景",
      panoramaDesc: "逐賽道對齊：從對外敘事到可用產品路徑。",
      ctaPrefix: "CTA",
      helper: "需要引導式啟動路徑？可選擇次要入口。",
      entryTitle: "按使用意圖進入產品",
      entryDesc: "同時承接一次性 Ask 與日常自動化，且每一步都有治理可見性。",
      entryCards: [
        { href: "/ask", title: "Ask 主路徑演示", status: "In Progress", cta: "查看 Ask" },
        { href: "/recovery-hitl", title: "回退 + HITL", status: "In Progress", cta: "查看回退" },
        { href: "/subscriptions", title: "訂閱任務", status: "Coming Soon", cta: "查看生命週期" },
        { href: "/connectors-governance", title: "連接器治理", status: "Coming Soon", cta: "查看控制面" },
      ] as const,
    },
    "zh-Hans": {
      panoramaTitle: "愿景覆盖全景",
      panoramaDesc: "逐赛道对齐：从对外叙事到可用产品路径。",
      ctaPrefix: "CTA",
      helper: "需要引导式启动路径？可选择次要入口。",
      entryTitle: "按用户意图进入产品",
      entryDesc: "同时承接一次性 Ask 与日常自动化，并让治理可见可验证。",
      entryCards: [
        { href: "/ask", title: "Ask 主路径演示", status: "In Progress", cta: "查看 Ask" },
        { href: "/recovery-hitl", title: "回退 + HITL", status: "In Progress", cta: "查看回退" },
        { href: "/subscriptions", title: "订阅任务", status: "Coming Soon", cta: "查看生命周期" },
        { href: "/connectors-governance", title: "连接器治理", status: "Coming Soon", cta: "查看控制面" },
      ] as const,
    },
  }[locale];

  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="relative space-y-7">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{home.eyebrow}</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">{home.title}</h1>
          <p className="max-w-3xl text-base text-muted md:text-lg">{home.description}</p>
          <div className="flex flex-wrap gap-3">
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
              {home.primaryCta}
            </CtaLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {home.valuePoints.map((point, index) => (
          <div key={point} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-primary">0{index + 1}</p>
            <p className="mt-3 text-sm text-foreground">{point}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{uiText.panoramaTitle}</h2>
          <p className="text-sm text-muted">{uiText.panoramaDesc}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {visionTracks.map((item) => (
            <div key={item.track} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.track}</p>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-xs text-muted">{item.pageModule}</p>
              <p className="mt-2 text-xs text-primary">
                {uiText.ctaPrefix}: {item.cta}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{uiText.entryTitle}</h2>
          <p className="text-sm text-muted">{uiText.entryDesc}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {uiText.entryCards.map((item) => (
            <div key={item.href} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <StatusBadge status={item.status} />
              </div>
              <CtaLink
                href={`/${locale}${item.href}`}
                eventName="cta_click"
                eventPayload={{
                  locale,
                  page: "home",
                  referrer: "internal",
                  cta_id: item.href.replace("/", "").replace("-", "_"),
                }}
              >
                {item.cta}
              </CtaLink>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-border bg-gradient-to-b from-card to-background p-7 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">{home.evidenceTitle}</h2>
          <p className="max-w-3xl text-muted">{home.evidenceDescription}</p>
        </div>
        <div className="grid gap-3">
          {home.evidencePoints.map((point) => (
            <div key={point} className="rounded-lg border border-border p-4 text-sm text-muted">
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
        <p className="text-sm text-muted">{uiText.helper}</p>
        <div className="flex flex-wrap gap-3">
          <CtaLink
            href={`/${locale}/demo`}
            eventName="demo_click"
            eventPayload={{
              locale,
              page: "home",
              referrer: "internal",
              cta_id: "book_demo",
            }}
          >
            {home.secondaryCtas.demo}
          </CtaLink>
          <CtaLink
            href={`/${locale}/waitlist`}
            eventName="cta_click"
            eventPayload={{
              locale,
              page: "home",
              referrer: "internal",
              cta_id: "join_waitlist",
            }}
          >
            {home.secondaryCtas.waitlist}
          </CtaLink>
        </div>
      </section>
    </div>
  );
}
