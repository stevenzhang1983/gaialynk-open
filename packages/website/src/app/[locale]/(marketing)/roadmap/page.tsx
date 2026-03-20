import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { getRoadmapFull } from "@/content/roadmap-full";
import { MilestoneCard } from "@/components/marketing/milestone-card";
import { RoadmapTimeline } from "@/components/marketing/roadmap-timeline";
import { getDictionary } from "@/content/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const data = getRoadmapFull(locale);
  const title = dict.nav?.roadmap ?? "Roadmap";
  return {
    title: `${title} | GaiaLynk`,
    description: data.subtitle,
  };
}

/**
 * T-3.8 完整路线图页面：标题 + 副标题、交互式水平时间线（Phase 0–4+ 可展开）、七大里程碑卡片网格。
 */
export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const data = getRoadmapFull(locale);
  const { title, subtitle, phases, milestoneCards, capabilityLabel } = data;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-display text-h1 font-bold leading-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-body-lg text-muted-foreground">{subtitle}</p>
      </header>

      <section aria-label="Roadmap timeline">
        <RoadmapTimeline phases={phases} locale={locale} />
      </section>

      <section aria-label="Seven milestones">
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          {locale === "en" && "Milestones"}
          {locale === "zh-Hant" && "七大里程碑"}
          {locale === "zh-Hans" && "七大里程碑"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {milestoneCards.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              capabilityLabel={capabilityLabel}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
