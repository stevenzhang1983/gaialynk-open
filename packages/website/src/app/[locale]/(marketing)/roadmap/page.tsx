import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import { getRoadmapFull, milestonesInOrder } from "@/content/roadmap-full";
import { MilestoneCard } from "@/components/marketing/milestone-card";
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

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const data = getRoadmapFull(locale);
  const { title, subtitle, milestoneCards, capabilityLabel, journeySections, milestonesHeading } = data;

  return (
    <div className="space-y-14">
      <header className="space-y-3">
        <h1 className="font-display text-h1 font-bold leading-tight tracking-tight text-foreground md:text-[clamp(2rem,2.2vw+1.5rem,2.75rem)] md:leading-snug">
          {title}
        </h1>
        <p className="max-w-[65ch] text-body-lg leading-body-relaxed text-muted-foreground">{subtitle}</p>
      </header>

      <div className="space-y-12">
        <h2 className="text-subheading font-semibold leading-snug text-foreground md:text-h3">{milestonesHeading}</h2>

        {journeySections.map((section, sectionIndex) => (
          <section
            key={section.title}
            className="space-y-5"
            aria-labelledby={`roadmap-milestone-group-${sectionIndex}`}
          >
            <div className="max-w-[65ch] space-y-2 border-l-2 border-primary/35 pl-4">
              <h3
                id={`roadmap-milestone-group-${sectionIndex}`}
                className="text-lg font-semibold leading-snug text-foreground md:text-xl"
              >
                {section.title}
              </h3>
              <p className="text-body leading-body-relaxed text-muted-foreground">{section.tagline}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {milestonesInOrder(milestoneCards, section.milestoneIds).map((milestone) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  capabilityLabel={capabilityLabel}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
