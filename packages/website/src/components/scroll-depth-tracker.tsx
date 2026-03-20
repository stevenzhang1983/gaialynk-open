"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { isSupportedLocale } from "@/lib/i18n/locales";
import { trackEvent } from "@/lib/analytics/track";
import { buildAnalyticsPayload } from "@/lib/analytics/events";

type ScrollDepthTrackerProps = {
  locale: Locale;
};

function getLocaleFromPath(pathname: string | null | undefined): Locale | null {
  if (!pathname) return null;
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg) return null;
  if (!isSupportedLocale(seg)) return null;
  return seg as Locale;
}

const BUCKETS = [25, 50, 75, 100] as const;

/**
 * T-7.1：首屏滚动深度追踪（以 viewport 高度为 100%）。
 * 仅在首页（"/{locale}"）上报，并对每个 bucket 做 once-per-session。
 */
export function ScrollDepthTracker({ locale }: ScrollDepthTrackerProps) {
  const pathname = usePathname();
  const reportedRef = useRef<Record<(typeof BUCKETS)[number], boolean>>({
    25: false,
    50: false,
    75: false,
    100: false,
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const resolvedLocale = getLocaleFromPath(pathname) ?? locale;
    if (!resolvedLocale) return;

    const homePathA = `/${resolvedLocale}`;
    const homePathB = `/${resolvedLocale}/`;
    if (pathname !== homePathA && pathname !== homePathB) {
      return;
    }

    let raf = 0;
    const onScroll = () => {
      // rAF-debounce to avoid flooding
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const vh = Math.max(1, window.innerHeight || 1);
        const depthPct = Math.max(0, Math.min(100, Math.round((window.scrollY / vh) * 100)));

        for (const bucket of BUCKETS) {
          if (depthPct >= bucket && !reportedRef.current[bucket]) {
            const storageKey = `gl_scroll_depth_${resolvedLocale}_${bucket}`;
            if (window.sessionStorage.getItem(storageKey) === "1") {
              reportedRef.current[bucket] = true;
              continue;
            }
            reportedRef.current[bucket] = true;
            window.sessionStorage.setItem(storageKey, "1");
            trackEvent(
              "scroll_depth",
              buildAnalyticsPayload({
                locale: resolvedLocale,
                page: "home",
                referrer: "hero_scroll_depth",
                action: `bucket_${bucket}`,
                outcome: "scrolled",
              }),
            );
          }
        }
      });
    };

    // run once on mount in case user refresh mid-scroll
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [locale, pathname, ready]);

  return null;
}

