import { CtaLink } from "@/components/cta-link";
import { DeveloperEcosystemSection } from "@/components/marketing/developer-ecosystem-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroBackgroundDeferred } from "@/components/marketing/hero-background-deferred";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeatureShowcaseSection } from "@/components/marketing/feature-showcase-section";
import { ProductPreviewMockup } from "@/components/marketing/product-preview-mockup";
import { RoadmapPreviewSection } from "@/components/marketing/roadmap-preview-section";
import { ValuePropositionSection } from "@/components/marketing/value-proposition-section";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/content/dictionaries";
import { getDeveloperEcosystem } from "@/content/developer-ecosystem";
import { getFeatureShowcase } from "@/content/feature-showcase";
import { getRoadmapPreview } from "@/content/roadmap-preview";
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
  const hero = home.hero ?? {
    eyebrow: home.eyebrow,
    title: home.title,
    subtitle: home.description,
    ctaPrimary: home.primaryCta,
    ctaSecondary: "Open App →",
  };
  const visionTracks = getVisionTracks(locale);
  const roadmapPreview = getRoadmapPreview(locale);
  const developerEcosystem = getDeveloperEcosystem(locale);
  const featureShowcase = getFeatureShowcase(locale);
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
      {/* T-3.1 首页 Hero 第一屏 */}
      <section className="relative min-h-[min(80vh,680px)] overflow-hidden rounded-xl border border-border bg-background sm:min-h-[min(85vh,720px)] sm:rounded-2xl">
        <HeroBackgroundDeferred />
        <div className="relative mx-auto flex min-h-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 md:py-24">
          <p className="text-caption font-medium uppercase tracking-wide text-primary">
            {hero.eyebrow}
          </p>
          <h1 className="font-display mt-3 max-w-[min(100%,38rem)] text-h1 font-bold leading-tight text-foreground sm:mt-4 sm:leading-snug md:text-hero md:leading-hero">
            {hero.title}
          </h1>
          <p className="mt-4 max-w-3xl text-body leading-body-relaxed text-muted-foreground sm:mt-6 sm:text-body-lg">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
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
              {hero.ctaPrimary}
            </CtaLink>
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
              {hero.ctaSecondary}
            </CtaLink>
          </div>
        </div>
      </section>

      {/* T-3.2 首页产品界面预览区域（第 1.5 屏） */}
      <section className="relative py-8 md:py-12">
        <p className="mb-6 text-center text-caption font-medium uppercase tracking-wide text-muted-foreground">
          {home.previewSectionTitle ?? "Product in action"}
        </p>
        <ProductPreviewMockup />
      </section>

      {/* T-6.2 特性展示区域（alma.now 风格）：五区块 卡片 + 浮窗式 Mockup + 标题 + 描述 */}
      <FeatureShowcaseSection data={featureShowcase} />

      {/* T-3.3 首页核心价值主张区域（第二屏） */}
      {home.valueProposition ? (
        <ValuePropositionSection
          title={home.valueProposition.title}
          cards={home.valueProposition.cards}
        />
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {home.valuePoints.map((point, index) => (
            <div key={point} className="rounded-xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-primary">0{index + 1}</p>
              <p className="mt-3 text-sm text-foreground">{point}</p>
            </div>
          ))}
        </section>
      )}

      {/* T-3.4 首页 How It Works 区域（第三屏） */}
      {home.howItWorks && (
        <HowItWorksSection title={home.howItWorks.title} steps={home.howItWorks.steps} />
      )}

      {/* T-3.5 首页路线图预览区域（第四屏） */}
      <RoadmapPreviewSection data={roadmapPreview} locale={locale} />

      {/* T-3.6 首页开发者生态区域（第五屏） */}
      <DeveloperEcosystemSection data={developerEcosystem} locale={locale} />

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{uiText.panoramaTitle}</h2>
          <p className="text-sm text-muted-foreground">{uiText.panoramaDesc}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {visionTracks.map((item) => (
            <div key={item.track} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.track}</p>
                <StatusBadge status={item.status} locale={locale} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{item.pageModule}</p>
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
          <p className="text-sm text-muted-foreground">{uiText.entryDesc}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {uiText.entryCards.map((item) => (
            <div key={item.href} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{item.title}</p>
                <StatusBadge status={item.status} locale={locale} />
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
          <p className="max-w-3xl text-muted-foreground">{home.evidenceDescription}</p>
        </div>
        <div className="grid gap-3">
          {home.evidencePoints.map((point) => (
            <div key={point} className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
              {point}
            </div>
          ))}
        </div>
      </section>

      {/* T-3.7 首页收尾 CTA（第六屏）：准备好了吗？+ Open App / Start Building / Book a Demo；不包含 Join Waitlist */}
      {home.finalCta && (
        <FinalCtaSection copy={home.finalCta} locale={locale} />
      )}
    </div>
  );
}
