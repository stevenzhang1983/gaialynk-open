import { CtaLink } from "@/components/cta-link";
import { DeveloperEcosystemSection } from "@/components/marketing/developer-ecosystem-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HeroBackgroundDeferred } from "@/components/marketing/hero-background-deferred";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeatureShowcaseSection } from "@/components/marketing/feature-showcase-section";
import { ProductPreviewMockup } from "@/components/marketing/product-preview-mockup";
import { RoadmapPreviewSection } from "@/components/marketing/roadmap-preview-section";
import { ValuePropositionSection } from "@/components/marketing/value-proposition-section";
import { getDictionary } from "@/content/dictionaries";
import { getDeveloperEcosystem } from "@/content/developer-ecosystem";
import { getFeatureShowcase } from "@/content/feature-showcase";
import { getProductMockupCopy } from "@/content/i18n/product-mockup-copy";
import { getRoadmapPreview } from "@/content/roadmap-preview";
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
  const roadmapPreview = getRoadmapPreview(locale);
  const developerEcosystem = getDeveloperEcosystem(locale);
  const featureShowcase = getFeatureShowcase(locale);
  const mockupCopy = getProductMockupCopy(locale);

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
        <ProductPreviewMockup copy={mockupCopy} />
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

      {/* T-3.7 首页收尾 CTA（第六屏）：准备好了吗？+ Open App / Start Building / Book a Demo；不包含 Join Waitlist */}
      {home.finalCta && (
        <FinalCtaSection copy={home.finalCta} locale={locale} />
      )}
    </div>
  );
}
