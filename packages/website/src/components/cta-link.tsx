"use client";

import Link from "next/link";
import { buildAnalyticsPayload, type AnalyticsEventName, type AnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";

type CtaLinkProps = {
  href: string;
  children: string;
  primary?: boolean;
  eventName?: AnalyticsEventName;
  eventPayload?: Omit<AnalyticsPayload, "timestamp"> & { timestamp?: string };
};

export function CtaLink({ href, children, primary = false, eventName, eventPayload }: CtaLinkProps) {
  const className = primary
    ? "inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
    : "inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary";

  return (
    <Link
      className={className}
      href={href}
      onClick={() => {
        if (eventName && eventPayload) {
          trackEvent(eventName, buildAnalyticsPayload(eventPayload));
        }
      }}
    >
      {children}
    </Link>
  );
}
