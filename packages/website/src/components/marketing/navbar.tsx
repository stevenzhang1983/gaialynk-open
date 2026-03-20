"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";

const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁中",
  "zh-Hans": "简中",
};

export type MarketingNavLabels = {
  roadmap: string;
  useCases: string;
  developers: string;
  pricing: string;
  openApp: string;
};

type MarketingNavbarProps = {
  locale: Locale;
  labels: MarketingNavLabels;
};

const NAV_ITEMS: { key: "roadmap" | "useCases" | "developers" | "pricing"; path: string }[] = [
  { key: "roadmap", path: "/roadmap" },
  { key: "useCases", path: "/use-cases" },
  { key: "developers", path: "/developers" },
  { key: "pricing", path: "/pricing" },
];

function isPathActive(pathname: string, locale: Locale, itemPath: string): boolean {
  const prefix = `/${locale}${itemPath}`;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function MarketingNavbar({ locale, labels }: MarketingNavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const basePath = pathname ?? `/${locale}`;

  const toggleMobile = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {/* 左侧：Logo + 品牌名 */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-primary"
          aria-label="GaiaLynk Home"
        >
          <span className="font-display tracking-tight">GaiaLynk</span>
        </Link>

        {/* 桌面端：中间导航 + 右侧语言与 CTA */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV_ITEMS.map(({ key, path }) => {
            const href = `/${locale}${path}`;
            const active = isPathActive(pathname ?? "", locale, path);
            return (
              <Link
                key={key}
                href={href}
                className={`text-sm transition-colors ${
                  active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {labels[key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {/* 语言切换：EN / 繁中 / 简中 */}
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            {SUPPORTED_LOCALES.map((loc) => {
              const active = loc === locale;
              return (
                <Link
                  key={loc}
                  href={withLocale(basePath, loc)}
                  className={active ? "text-primary font-medium" : "hover:text-foreground"}
                  onClick={() => {
                    if (!active) {
                      trackEvent("lang_switch", {
                        locale,
                        page: basePath,
                        referrer: "navbar",
                        timestamp: new Date().toISOString(),
                        source: loc,
                      });
                    }
                  }}
                >
                  {LOCALE_LABELS[loc]}
                </Link>
              );
            })}
          </div>

          {/* Open App 主 CTA：所有视口下始终可见 */}
          <Link
            href={`/${locale}/app`}
            className="shrink-0 whitespace-nowrap rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 sm:px-4 sm:text-sm"
            onClick={() => {
              trackEvent(
                "cta_click",
                buildAnalyticsPayload({
                  locale,
                  page: basePath,
                  referrer: "navbar",
                  cta_id: "open_app",
                }),
              );
            }}
          >
            {labels.openApp} →
          </Link>

          {/* 移动端：汉堡菜单按钮 */}
          <button
            type="button"
            onClick={toggleMobile}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface hover:text-foreground md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="marketing-mobile-menu"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 移动端展开菜单 */}
      <div
        id="marketing-mobile-menu"
        className={`border-t border-border bg-background/95 backdrop-blur-md md:hidden ${
          mobileOpen ? "block" : "hidden"
        }`}
        role="dialog"
        aria-label="Navigation menu"
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4" aria-label="Mobile main">
          {NAV_ITEMS.map(({ key, path }) => {
            const href = `/${locale}${path}`;
            const active = isPathActive(pathname ?? "", locale, path);
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-4 py-3 text-sm ${
                  active ? "bg-surface-raised text-primary font-medium" : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                {labels[key]}
              </Link>
            );
          })}
          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">语言</span>
            {SUPPORTED_LOCALES.map((loc) => {
              const active = loc === locale;
              return (
                <Link
                  key={loc}
                  href={withLocale(basePath, loc)}
                  onClick={() => setMobileOpen(false)}
                  className={`text-xs ${active ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {LOCALE_LABELS[loc]}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
