"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export type HowItWorksStep = {
  summary: string;
  detail: string;
};

type HowItWorksSectionProps = {
  title: string;
  steps: [HowItWorksStep, HowItWorksStep, HowItWorksStep, HowItWorksStep, HowItWorksStep];
};

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
} as const;

const rowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

/**
 * T-3.4 / T-6.1 How It Works：scroll-triggered stagger + 展开详情（高度由 Framer Motion 驱动）。
 * 按钮 hover / 描边 / chevron 旋转仍用 Tailwind。
 */
export function HowItWorksSection({ title, steps }: HowItWorksSectionProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <motion.section
      className="space-y-10"
      aria-labelledby="how-it-works-heading"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -60px 0px" }}
    >
      <motion.h2
        id="how-it-works-heading"
        variants={rowVariants}
        className="max-w-3xl text-subheading font-semibold leading-snug text-foreground md:text-h3"
      >
        {title}
      </motion.h2>

      <div className="relative">
        <div
          className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-border to-transparent md:left-[19px]"
          aria-hidden
        />

        <ul className="space-y-4">
          {steps.map((step, index) => (
            <motion.li key={index} variants={rowVariants} className="relative flex gap-4">
              <div
                className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary shadow-card md:h-10 md:w-10 md:text-base"
                aria-hidden
              >
                {index + 1}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <button
                  type="button"
                  onClick={() => setExpandedIndex((prev) => (prev === index ? null : index))}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    expandedIndex === index ? "border-primary/40 shadow-card-hover" : "border-border"
                  }`}
                  aria-expanded={expandedIndex === index}
                  aria-controls={`how-it-works-detail-${index}`}
                  id={`how-it-works-step-${index}`}
                >
                  <span className="font-medium text-foreground">{step.summary}</span>
                  <span
                    className={`shrink-0 transition-transform duration-200 ${expandedIndex === index ? "rotate-180" : "rotate-0"}`}
                    aria-hidden
                  >
                    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                <motion.div
                  id={`how-it-works-detail-${index}`}
                  role="region"
                  aria-labelledby={`how-it-works-step-${index}`}
                  initial={false}
                  animate={{
                    height: expandedIndex === index ? "auto" : 0,
                    opacity: expandedIndex === index ? 1 : 0,
                  }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </div>
                </motion.div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}
