"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { RichLine, RichParagraphs } from "@/components/marketing/rich-line";
import type { JourneyChapterCopy } from "@/content/use-cases-company-a-journey";

type CompanyAJourneySectionProps = {
  /** Optional kicker above the section title (e.g. “How the story unfolds”). */
  eyebrow?: string;
  title: string;
  intro: string;
  chapters: JourneyChapterCopy[];
};

const sectionVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
} as const;

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="9" className="stroke-primary/35" strokeWidth="1.25" />
      <path
        className="stroke-primary"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 10.2 8.55 12.75 14 7.3"
      />
    </svg>
  );
}

export function CompanyAJourneySection({ eyebrow, title, intro, chapters }: CompanyAJourneySectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
    if (!hash) return;
    const idx = chapters.findIndex((c) => c.id === hash);
    if (idx >= 0) setExpandedIndex(idx);
  }, [chapters]);

  return (
    <motion.section
      className="space-y-8"
      aria-labelledby="company-a-journey-heading"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08, margin: "0px 0px -48px 0px" }}
    >
      <motion.div variants={rowVariants} className="space-y-3">
        {eyebrow ? (
          <p className="text-caption font-semibold uppercase tracking-wide text-primary">{eyebrow}</p>
        ) : null}
        <h2
          id="company-a-journey-heading"
          className="max-w-[40ch] font-display text-h2 font-semibold leading-snug tracking-tight text-foreground md:text-h1"
        >
          {title}
        </h2>
        <p className="max-w-[65ch] text-body leading-body-relaxed text-muted-foreground">
          <RichLine text={intro} />
        </p>
      </motion.div>

      <div className="relative">
        <div
          className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/55 via-border to-primary/15 md:left-[22px]"
          aria-hidden
        />

        <ul className="space-y-5">
          {chapters.map((ch, index) => {
            const isOpen = expandedIndex !== null && expandedIndex === index;
            const isOutlook = ch.isOutlookChapter;

            return (
              <motion.li key={ch.id} id={ch.id} variants={rowVariants} className="relative scroll-mt-28">
                <div className="flex gap-4 md:gap-5">
                  <div className="relative z-10 flex shrink-0 justify-center pt-1 md:pt-1.5">
                    <div
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background text-sm font-bold shadow-card md:h-11 md:w-11 md:text-base",
                        isOutlook
                          ? "border-warning/60 text-warning shadow-[0_0_0_3px_rgb(var(--color-warning)/0.12)]"
                          : "border-primary text-primary",
                        isOpen && !isOutlook ? "ring-2 ring-primary/30 ring-offset-2 ring-offset-background" : "",
                        isOpen && isOutlook ? "ring-2 ring-warning/35 ring-offset-2 ring-offset-background" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-hidden
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 pb-1">
                    <button
                      type="button"
                      onClick={() => setExpandedIndex((prev) => (prev === index ? null : index))}
                      className={[
                        "flex w-full items-start justify-between gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition-[border-color,box-shadow] duration-200 md:p-5",
                        isOpen
                          ? "border-primary/40 shadow-card-hover"
                          : "border-border hover:border-primary/25 hover:shadow-card-hover",
                        isOutlook && isOpen ? "border-warning/35" : "",
                      ].join(" ")}
                      aria-expanded={isOpen}
                      aria-controls={`journey-panel-${ch.id}`}
                      id={`journey-trigger-${ch.id}`}
                    >
                      <span className="min-w-0 space-y-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-caption font-medium uppercase tracking-wide text-primary">
                            {ch.label}
                          </span>
                          {isOutlook ? (
                            <span className="rounded-md border border-warning/40 bg-warning/10 px-2 py-0.5 text-caption font-semibold text-warning">
                              {ch.outlookBadge}
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-subheading font-semibold leading-snug text-foreground md:text-h3">
                          {ch.title}
                        </span>
                      </span>
                      <span
                        className={`mt-1 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>

                    <motion.div
                      id={`journey-panel-${ch.id}`}
                      role="region"
                      aria-labelledby={`journey-trigger-${ch.id}`}
                      initial={false}
                      animate={{
                        height: isOpen ? "auto" : 0,
                        opacity: isOpen ? 1 : 0,
                      }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="mt-3 space-y-6 rounded-2xl border border-border-subtle bg-background-subtle/80 p-4 shadow-brand-sm backdrop-blur-sm md:p-6">
                        {ch.outlookNotice ? (
                          <aside className="rounded-xl border border-warning/35 bg-warning/8 px-4 py-3.5 text-body leading-body-relaxed text-foreground">
                            <RichParagraphs text={ch.outlookNotice} paragraphClassName="mb-2 last:mb-0" />
                          </aside>
                        ) : null}

                        <div className="max-w-[65ch] space-y-3 text-body leading-body-relaxed text-muted-foreground">
                          <RichParagraphs text={ch.narrative} paragraphClassName="mb-3 last:mb-0" />
                        </div>

                        <div>
                          <h3 className="text-caption font-semibold uppercase tracking-wide text-foreground-secondary">
                            {ch.journeyHeading}
                          </h3>
                          <ul className="mt-4 list-none space-y-3 p-0" role="list">
                            {ch.storyMoments.map((moment, mi) => (
                              <li
                                key={mi}
                                className="rounded-xl border border-border-subtle bg-card/70 px-4 py-3.5 shadow-sm md:px-5 md:py-4"
                              >
                                <p className="text-sm font-semibold text-primary">{moment.headline}</p>
                                <p className="mt-2 text-body leading-body-relaxed text-muted-foreground">
                                  <RichLine text={moment.body} />
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h3 className="text-caption font-semibold uppercase tracking-wide text-foreground-secondary">
                            {ch.capabilitiesHeading}
                          </h3>
                          <ul className="mt-4 space-y-3">
                            {ch.capabilities.map((item) => (
                              <li key={item} className="flex gap-3 text-body leading-body-relaxed text-muted-foreground">
                                <CheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                                <RichLine text={item} />
                              </li>
                            ))}
                          </ul>
                        </div>

                        {ch.closure ? (
                          <p className="border-t border-border-subtle pt-5 font-medium leading-snug text-foreground">
                            <RichLine text={ch.closure} />
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>
    </motion.section>
  );
}
