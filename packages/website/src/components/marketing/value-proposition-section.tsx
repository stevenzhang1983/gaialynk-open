"use client";

import { motion } from "framer-motion";

export type ValuePropositionCard = {
  title: string;
  description: string;
};

type ValuePropositionSectionProps = {
  title: string;
  cards: [ValuePropositionCard, ValuePropositionCard, ValuePropositionCard];
};

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
} as const;

const childVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

/** 通用 icon 占位：Verified / Shield / Receipt 风格，后续可替换为品牌 icon */
function CardIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className="h-8 w-8 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg className="h-8 w-8 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    );
  }
  return (
    <svg className="h-8 w-8 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

/**
 * T-3.3 / T-6.1 首页核心价值主张：scroll-triggered + stagger 入场（Framer Motion）。
 * hover 边框/阴影仍用 Tailwind，不与 motion 叠加入场动效。
 */
export function ValuePropositionSection({ title, cards }: ValuePropositionSectionProps) {
  return (
    <motion.section
      className="space-y-8"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
    >
      <motion.h2
        variants={childVariants}
        className="max-w-3xl text-subheading font-semibold leading-snug text-foreground md:text-h3"
      >
        {title}
      </motion.h2>
      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={childVariants}
            className="group rounded-xl border border-border bg-card p-5 shadow-card transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-card-hover"
          >
            <div className="flex items-start gap-4">
              <CardIcon index={index} />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-caption leading-relaxed text-muted-foreground">
                  <span className="line-clamp-2 block group-hover:line-clamp-[unset]">{card.description}</span>
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
