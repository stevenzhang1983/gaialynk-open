"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { FeatureShowcaseContent } from "@/content/feature-showcase";
import { useTilt } from "@/hooks/use-tilt";

/* ----- 五个高保真 Mockup（T-6.2 验收：每个区块有真实截图/高保真 Mockup）----- */

function MockupChat() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border bg-surface-raised px-2.5 py-1.5">
        <span className="text-[10px] font-semibold text-foreground">Chat</span>
      </div>
      <div className="space-y-2 p-2">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-md rounded-tr-none bg-primary/20 px-2 py-1.5 text-[10px] text-foreground">
            Summarize API changes
          </div>
        </div>
        <div className="flex justify-start gap-1.5">
          <div className="h-5 w-5 shrink-0 rounded-full bg-primary/30 flex items-center justify-center text-[9px] font-semibold text-primary">A</div>
          <div className="max-w-[80%] rounded-md rounded-tl-none border border-border bg-card px-2 py-1.5 text-[10px] text-foreground">
            3 breaking changes. One needs your approval.
          </div>
        </div>
        <div className="rounded border border-warning/50 bg-warning/10 px-2 py-1 text-[9px] text-amber-800">
          Risk confirmation · Approve / Reject
        </div>
      </div>
    </div>
  );
}

function MockupTrust() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="border-b border-border bg-surface-raised px-2.5 py-1.5">
        <span className="text-[10px] font-semibold text-foreground">Agent & approval</span>
      </div>
      <div className="space-y-2 p-2">
        <div className="rounded border border-border bg-surface p-2">
          <p className="text-[10px] font-semibold text-foreground">Agent Alpha</p>
          <p className="text-[9px] text-success">Verified · 4.8</p>
        </div>
        <div className="rounded border-2 border-warning/60 bg-warning/10 px-2 py-1.5">
          <p className="text-[9px] font-semibold text-amber-800">Needs approval</p>
          <p className="text-[9px] text-muted-foreground">External API call</p>
          <div className="mt-1 flex gap-1">
            <span className="rounded bg-success/20 px-1.5 py-0.5 text-[8px] text-success">Approve</span>
            <span className="rounded bg-destructive/20 px-1.5 py-0.5 text-[8px] text-destructive">Reject</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockupMarketplace() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="border-b border-border bg-surface-raised px-2.5 py-1.5">
        <span className="text-[10px] font-semibold text-foreground">Agent directory</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 p-2">
        {["Alpha", "Beta", "Gamma", "Delta"].map((name, i) => (
          <div key={name} className="rounded border border-border bg-card p-1.5">
            <p className="text-[10px] font-medium text-foreground">{name}</p>
            <p className="text-[8px] text-success">Verified</p>
            <p className="text-[8px] text-muted-foreground">★ 4.{8 - i}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupAutomation() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="border-b border-border bg-surface-raised px-2.5 py-1.5">
        <span className="text-[10px] font-semibold text-foreground">Recurring tasks</span>
      </div>
      <ul className="space-y-0.5 p-2">
        {["Daily digest", "Weekly report", "API sync"].map((label, i) => (
          <li key={label} className="flex items-center justify-between rounded border border-border bg-card px-2 py-1.5">
            <span className="text-[10px] text-foreground">{label}</span>
            <span className="text-[8px] text-muted-foreground">{["Daily", "Weekly", "On demand"][i]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockupEvidence() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      <div className="border-b border-border bg-surface-raised px-2.5 py-1.5">
        <span className="text-[10px] font-semibold text-foreground">Audit & receipt</span>
      </div>
      <div className="space-y-2 p-2">
        <div className="space-y-1">
          {["Invocation · allowed", "Review · approved", "Receipt · signed"].map((line, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-primary/60" />
              {line}
            </div>
          ))}
        </div>
        <div className="rounded border border-border bg-surface p-2">
          <p className="text-[9px] font-semibold text-foreground">Call receipt #a1b2</p>
          <p className="text-[8px] text-primary">Signed · Verifiable</p>
        </div>
      </div>
    </div>
  );
}

const MOCKUP_MAP = {
  chat: MockupChat,
  trust: MockupTrust,
  marketplace: MockupMarketplace,
  automation: MockupAutomation,
  evidence: MockupEvidence,
} as const;

function TiltMockup({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref, { max: 8, scale: 1.03, speed: 250 });
  return (
    <div ref={ref} className="w-full max-w-[280px] md:max-w-[320px]">
      {children}
    </div>
  );
}

/* ----- Section variants (T-6.1: Framer Motion only for entrance) ----- */

const blockVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

type FeatureShowcaseSectionProps = {
  data: FeatureShowcaseContent;
};

/**
 * T-6.2 特性展示区域（alma.now 风格）：卡片 + 浮窗式 Mockup + 短标题 + 描述。
 * 五个区块：智能对话 / Agent 准入 / Agent 市场 / 自动化任务 / 执行链路。
 * 入场动效由 Framer Motion 驱动；hover 仍用 Tailwind。
 */
export function FeatureShowcaseSection({ data }: FeatureShowcaseSectionProps) {
  const { sectionTitle, sectionSubtitle, blocks } = data;

  return (
    <section className="space-y-12 overflow-x-hidden md:space-y-16" aria-labelledby="feature-showcase-heading">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <h2
          id="feature-showcase-heading"
          className="mx-auto max-w-2xl text-subheading font-semibold leading-snug text-foreground md:text-h3"
        >
          {sectionTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-body-lg text-muted-foreground">{sectionSubtitle}</p>
      </motion.header>

      <div className="space-y-12 md:space-y-20">
        {blocks.map((block, index) => {
          const Mockup = MOCKUP_MAP[block.id as keyof typeof MOCKUP_MAP] ?? MockupChat;
          const isEven = index % 2 === 0;

          return (
            <motion.article
              key={block.id}
              variants={blockVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
              className={`flex flex-col gap-6 md:gap-10 md:items-center ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              <div className="min-w-0 flex-1 space-y-3">
                <h3 className="text-xl font-semibold text-foreground md:text-2xl">{block.title}</h3>
                <p className="text-body-lg leading-relaxed text-muted-foreground">{block.description}</p>
              </div>
              <div
                className={`relative flex shrink-0 justify-center md:w-[min(360px,45%)] ${
                  isEven ? "md:justify-end" : "md:justify-start"
                }`}
              >
                <TiltMockup>
                  <Mockup />
                </TiltMockup>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
