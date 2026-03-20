"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import type { RoadmapPhaseFull } from "@/content/roadmap-full";
import type { Locale } from "@/lib/i18n/locales";

type RoadmapTimelineProps = {
  phases: RoadmapPhaseFull[];
  locale: Locale;
};

const rowVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

const timelineVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
} as const;

/**
 * T-3.8 / T-6.1 完整路线图时间线：入场 stagger + Phase 展开（Framer Motion 高度动画）。
 * Phase 按钮 hover 仍用 Tailwind。
 */
export function RoadmapTimeline({ phases, locale }: RoadmapTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* T-6.3 移动端竖排；md+ 水平时间线 */}
      <motion.div
        className="md:hidden flex flex-col"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.08 }}
        variants={timelineVariants}
      >
        {phases.map((phase, index) => (
          <motion.div key={`mv-${phase.id}`} variants={rowVariants} className="flex flex-col">
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
          viewport={{ once: true, amount: 0.12 }}
          variants={timelineVariants}
        >
          {phases.map((phase, index) => (
            <motion.div key={phase.id} variants={rowVariants} className="flex items-start">
              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === phase.id ? null : phase.id))}
                className={`flex w-[min(180px,20vw)] flex-col rounded-xl border px-4 py-3 text-left transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
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
          <div className="p-5">
            <h3 id={`roadmap-phase-heading-${phase.id}`} className="text-base font-semibold text-foreground">
              {phase.name}
            </h3>
            {phase.oneLiner && <p className="mt-1 text-sm text-muted-foreground">{phase.oneLiner}</p>}
            <div className="mt-4 space-y-4">
              {phase.milestones.map((milestone) => (
                <div key={milestone.id} className="rounded-lg border border-border bg-background/80 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{milestone.name}</span>
                    <StatusBadge status={milestone.status} locale={locale} />
                  </div>
                  <ul className="mt-2 space-y-1 pl-4">
                    {milestone.deliverables.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        <span className="mr-2 text-primary/70">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
