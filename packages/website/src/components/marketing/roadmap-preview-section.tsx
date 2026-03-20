"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import type { RoadmapPreview } from "@/content/roadmap-preview";
import type { Locale } from "@/lib/i18n/locales";

type RoadmapPreviewSectionProps = {
  data: RoadmapPreview;
  locale: Locale;
};

const headerBlockVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

const timelineContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
} as const;

const phaseChipVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

const footerRowVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

/**
 * T-3.5 / T-6.1 首页路线图预览：scroll-triggered + Phase 节点 stagger；展开区高度由 Framer Motion 驱动。
 * Phase 按钮 hover 仍用 Tailwind。
 */
export function RoadmapPreviewSection({ data, locale }: RoadmapPreviewSectionProps) {
  const { title, subtitle, phases, milestones, ctaLabel } = data;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="space-y-8" aria-labelledby="roadmap-preview-heading">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
        variants={headerBlockVariants}
      >
        <h2 id="roadmap-preview-heading" className="max-w-3xl text-subheading font-semibold leading-snug text-foreground md:text-h3">
          {title}
        </h2>
        <p className="mt-2 text-body-lg text-muted-foreground">{subtitle}</p>
      </motion.div>

      {/* T-6.3 移动端：竖排时间线；md+：水平滑动 */}
      <motion.div
        className="md:hidden flex flex-col"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        variants={timelineContainerVariants}
      >
        {phases.map((phase, index) => (
          <motion.div key={`m-${phase.id}`} variants={phaseChipVariants} className="flex flex-col">
            <button
              type="button"
              onClick={() => setExpandedId((prev) => (prev === phase.id ? null : phase.id))}
              className={`flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                expandedId === phase.id
                  ? "border-primary/40 bg-card shadow-card-hover"
                  : "border-border bg-card shadow-card"
              }`}
              aria-expanded={expandedId === phase.id}
              aria-controls={`roadmap-phase-${phase.id}`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phase {index}</span>
              <span className="mt-1 text-sm font-semibold text-foreground">{phase.name}</span>
              <div className="mt-2">
                <StatusBadge status={phase.status} locale={locale} />
              </div>
            </button>
            {index < phases.length - 1 && (
              <div className="flex justify-center py-1" aria-hidden>
                <div className="h-6 w-px bg-gradient-to-b from-border via-border to-transparent" />
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <div className="hidden overflow-x-auto pb-2 md:block">
        <motion.div
          className="flex min-w-max items-start gap-0"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1, margin: "0px 0px -32px 0px" }}
          variants={timelineContainerVariants}
        >
          {phases.map((phase, index) => (
            <motion.div key={phase.id} variants={phaseChipVariants} className="flex items-start">
              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === phase.id ? null : phase.id))}
                className={`flex w-[min(200px,22vw)] flex-col rounded-xl border px-4 py-3 text-left transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                  expandedId === phase.id
                    ? "border-primary/40 bg-card shadow-card-hover"
                    : "border-border bg-card shadow-card"
                }`}
                aria-expanded={expandedId === phase.id}
                aria-controls={`roadmap-phase-${phase.id}`}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phase {index}</span>
                <span className="mt-1 line-clamp-2 text-sm font-semibold text-foreground">{phase.name}</span>
                <div className="mt-2">
                  <StatusBadge status={phase.status} locale={locale} />
                </div>
              </button>
              {index < phases.length - 1 && (
                <div className="flex h-10 w-4 shrink-0 items-center md:w-6" aria-hidden>
                  <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>

      {phases.map((phase) => (
        <motion.div
          key={phase.id}
          id={`roadmap-phase-${phase.id}`}
          role="region"
          aria-labelledby={`roadmap-phase-heading-${phase.id}`}
          initial={false}
          animate={{
            height: expandedId === phase.id ? "auto" : 0,
            opacity: expandedId === phase.id ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "hidden" }}
          className={
            expandedId === phase.id
              ? "rounded-xl border border-border bg-muted/20"
              : "rounded-xl border border-transparent"
          }
        >
          <div className="p-4">
            <h3 id={`roadmap-phase-heading-${phase.id}`} className="text-sm font-semibold text-foreground">
              {phase.name}
            </h3>
            <ul className="mt-3 space-y-2">
              {phase.deliverables.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      ))}

      <motion.div
        className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 px-1 text-center sm:gap-2"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={footerRowVariants}
      >
        {milestones.map((m, index) => (
          <span key={m.id} className="flex items-center gap-2">
            <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground">{m.id}</span>
            <span className="text-xs text-muted-foreground">{m.name}</span>
            {index < milestones.length - 1 && (
              <span className="text-muted-foreground/50" aria-hidden>
                →
              </span>
            )}
          </span>
        ))}
      </motion.div>

      <motion.div
        className="flex justify-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
        variants={footerRowVariants}
      >
        <CtaLink
          href={`/${locale}/roadmap`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "home",
            referrer: "internal",
            cta_id: "view_full_roadmap",
          }}
        >
          {ctaLabel}
        </CtaLink>
      </motion.div>
    </section>
  );
}
