"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/locales";
import { withLocale } from "@/lib/i18n/paths";

type LangSwitcherProps = {
  currentLocale: Locale;
};

export function LangSwitcher({ currentLocale }: LangSwitcherProps) {
  const pathname = usePathname();
  const basePath = pathname || `/${currentLocale}`;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {SUPPORTED_LOCALES.map((locale) => {
        const active = locale === currentLocale;
        return (
          <Link
            key={locale}
            href={withLocale(basePath, locale)}
            className={active ? "text-primary" : "hover:text-foreground"}
            onClick={() => {
              if (!active) {
                trackEvent("lang_switch", {
                  locale: currentLocale,
                  page: basePath,
                  referrer: "internal",
                  timestamp: new Date().toISOString(),
                  source: locale,
                });
              }
            }}
          >
            {locale}
          </Link>
        );
      })}
    </div>
  );
}
