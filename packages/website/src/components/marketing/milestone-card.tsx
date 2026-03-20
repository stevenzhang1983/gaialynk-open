"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { MilestoneCardData } from "@/content/roadmap-full";

type MilestoneCardProps = {
  milestone: MilestoneCardData;
  capabilityLabel?: string;
};

/**
 * T-3.8 / T-6.1 七大里程碑卡片：展开详情用 Framer Motion；卡片 hover 仍用 Tailwind。
 */
export function MilestoneCard({ milestone, capabilityLabel = "Key capabilities" }: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { id, name, description, capabilities } = milestone;

  return (
    <motion.div
      className="rounded-xl border border-border bg-card shadow-card transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-card-hover"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full flex-col items-start gap-2 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-inset"
        aria-expanded={expanded}
        aria-controls={`milestone-card-${id}`}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-semibold text-foreground">{id}</span>
          <span className={`shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : "rotate-0"}`} aria-hidden>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </button>
      <motion.div
        id={`milestone-card-${id}`}
        initial={false}
        animate={{
          height: expanded ? "auto" : 0,
          opacity: expanded ? 1 : 0,
        }}
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div className="border-t border-border px-4 pb-4 pt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{capabilityLabel}</p>
          <ul className="mt-2 space-y-1">
            {capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
}
