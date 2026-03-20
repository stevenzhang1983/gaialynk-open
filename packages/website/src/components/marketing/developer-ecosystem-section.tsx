"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import { trackEvent } from "@/lib/analytics/track";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import type { DeveloperEcosystemContent } from "@/content/developer-ecosystem";
import type { Locale } from "@/lib/i18n/locales";

type DeveloperEcosystemSectionProps = {
  data: DeveloperEcosystemContent;
  locale: Locale;
};

const sectionVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.4, 0, 0.2, 1] as const },
  },
} as const;

const MotionLink = motion.create(Link);

/** Icon: rocket/start (quickstart), code (SDK), GitHub star */
function CardIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg className="h-8 w-8 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg className="h-8 w-8 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }
  return (
    <svg className="h-8 w-8 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

const cardInteractiveClass =
  "group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-[border-color,box-shadow] duration-300 hover:border-primary/40 hover:shadow-card-hover focus-within:ring-2 focus-within:ring-primary/50";

/**
 * T-3.6 / T-6.1 首页开发者生态区域：scroll-triggered + stagger（Framer Motion）。
 */
export function DeveloperEcosystemSection({ data, locale }: DeveloperEcosystemSectionProps) {
  const { title, cards, ctaLabel } = data;

  return (
    <motion.section
      className="space-y-8"
      aria-labelledby="developer-ecosystem-heading"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -40px 0px" }}
    >
      <motion.h2
        id="developer-ecosystem-heading"
        variants={childVariants}
        className="max-w-3xl text-subheading font-semibold leading-snug text-foreground md:text-h3"
      >
        {title}
      </motion.h2>

      <div className="grid gap-6 md:grid-cols-3">
        {cards.map((card, index) => {
          const href = card.external ? card.href : `/${locale}${card.href}`;
          const content = (
            <>
              <div className="flex items-start gap-4">
                <CardIcon index={index} />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary">{card.title}</h3>
                  <p className="mt-2 text-caption leading-relaxed text-muted-foreground">{card.description}</p>
                </div>
              </div>
              <span className="mt-4 inline-flex text-sm font-medium text-primary">
                {card.external ? "Open GitHub →" : "Learn more →"}
              </span>
            </>
          );

          if (card.external) {
            return (
              <motion.a
                key={card.title}
                variants={childVariants}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardInteractiveClass}
                onClick={() => {
                  trackEvent("cta_click", buildAnalyticsPayload({ locale, page: "home", referrer: "internal", cta_id: "developer_ecosystem_github" }));
                }}
              >
                {content}
              </motion.a>
            );
          }

          return (
            <MotionLink
              key={card.title}
              variants={childVariants}
              href={href}
              className={cardInteractiveClass}
              onClick={() => {
                trackEvent(
                  "cta_click",
                  buildAnalyticsPayload({
                    locale,
                    page: "home",
                    referrer: "internal",
                    cta_id: index === 0 ? "developer_ecosystem_quickstart" : "developer_ecosystem_sdk",
                  })
                );
              }}
            >
              {content}
            </MotionLink>
          );
        })}
      </div>

      <motion.div variants={childVariants}>
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
          {ctaLabel}
        </CtaLink>
      </motion.div>
    </motion.section>
  );
}
