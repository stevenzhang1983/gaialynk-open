import type { ReactNode } from "react";
import { getDictionary } from "@/content/dictionaries";
import { Footer } from "@/components/marketing/footer";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { PageViewTracker } from "@/components/page-view-tracker";
import { ScrollDepthTracker } from "@/components/scroll-depth-tracker";
import type { Locale } from "@/lib/i18n/locales";
import { isSupportedLocale } from "@/lib/i18n/locales";

function cjkPrefer(locale: Locale): "tc" | "sc" | "latin" {
  if (locale === "zh-Hant") return "tc";
  if (locale === "zh-Hans") return "sc";
  return "latin";
}

/**
 * 官网区 Layout（T-2.1）
 * 顶部导航（T-2.2 MarketingNavbar）+ 内容区 + Footer；与产品区 Layout 完全独立，共享 design-tokens。
 */
export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return <>{children}</>;
  }
  const dict = getDictionary(locale);
  const nav = dict.nav;

  const skip = nav.skipToContent ?? "Skip to main content";

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-background font-sans text-foreground"
      data-cjk-prefer={cjkPrefer(locale)}
    >
      <a
        href="#marketing-main"
        className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-[200%] opacity-0 transition-none focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
      >
        {skip}
      </a>
      <PageViewTracker locale={locale} />
      <ScrollDepthTracker locale={locale} />
      <MarketingNavbar
        locale={locale}
        labels={{
          roadmap: nav.roadmap ?? "Roadmap",
          useCases: nav.useCases ?? "Stories",
          developers: nav.developers ?? "Developers",
          pricing: nav.pricing ?? "Pricing",
          openApp: nav.openApp ?? "Open app",
        }}
      />
      <main id="marketing-main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10" tabIndex={-1}>
        {children}
      </main>
      <Footer locale={locale} labels={dict.footer} />
    </div>
  );
}
