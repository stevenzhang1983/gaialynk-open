import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { getDictionary } from "@/content/dictionaries";
import { LangSwitcher } from "./lang-switcher";
import { PageViewTracker } from "./page-view-tracker";

type PageShellProps = {
  locale: Locale;
  children: ReactNode;
};

function cjkPrefer(locale: Locale): "tc" | "sc" | "latin" {
  if (locale === "zh-Hant") {
    return "tc";
  }
  if (locale === "zh-Hans") {
    return "sc";
  }
  return "latin";
}

export function PageShell({ locale, children }: PageShellProps) {
  const dict = getDictionary(locale);

  return (
    <div
      className="min-h-screen bg-background font-sans"
      data-cjk-prefer={cjkPrefer(locale)}
    >
      <PageViewTracker locale={locale} />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href={`/${locale}`} className="text-sm font-semibold text-foreground">
            GaiaLynk Agent IM
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link href={`/${locale}/ask`} className="hover:text-foreground">
              {dict.nav.ask}
            </Link>
            {dict.nav.tasks && (
              <Link href={`/${locale}/subscriptions`} className="hover:text-foreground">
                {dict.nav.tasks}
              </Link>
            )}
            {dict.nav.agents && (
              <Link href={`/${locale}/agents`} className="hover:text-foreground">
                {dict.nav.agents}
              </Link>
            )}
            {dict.nav.approvals && (
              <Link href={`/${locale}/recovery-hitl`} className="hover:text-foreground">
                {dict.nav.approvals}
              </Link>
            )}
            {dict.nav.history && (
              <Link href={`/${locale}/history`} className="hover:text-foreground">
                {dict.nav.history}
              </Link>
            )}
            {dict.nav.connector && (
              <Link href={`/${locale}/connectors-governance`} className="hover:text-foreground">
                {dict.nav.connector}
              </Link>
            )}
            {dict.nav.settings && (
              <Link href={`/${locale}/settings`} className="hover:text-foreground">
                {dict.nav.settings}
              </Link>
            )}
            <Link href={`/${locale}/developers`} className="hover:text-foreground">
              {dict.nav.developers}
            </Link>
            <LangSwitcher currentLocale={locale} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>GaiaLynk Agent IM</span>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/privacy`} className="hover:text-foreground">
              Privacy
            </Link>
            <Link href={`/${locale}/cookies`} className="hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
