import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

const GITHUB_URL = "https://github.com/gaialynk";

export type FooterLabels = {
  privacy: string;
  cookies: string;
  github: string;
  contact: string;
};

const DEFAULT_LABELS: FooterLabels = {
  privacy: "Privacy",
  cookies: "Cookies",
  github: "GitHub",
  contact: "Contact",
};

type FooterProps = {
  locale: Locale;
  labels?: Partial<FooterLabels>;
};

/**
 * T-3.7 官网区 Footer：Logo | Privacy | Cookies | GitHub | Contact。
 * 全站复用（官网区所有页面），链接目标与 CTO 指令一致。
 */
export function Footer({ locale, labels: labelsProp }: FooterProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };

  return (
    <footer className="border-t border-border bg-background py-8" role="contentinfo">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-muted-foreground">
        <Link
          href={`/${locale}`}
          className="font-medium text-foreground hover:text-primary"
          aria-label="GaiaLynk home"
        >
          GaiaLynk
        </Link>
        <nav className="flex items-center gap-6" aria-label="Footer links">
          <Link href={`/${locale}/privacy`} className="hover:text-foreground">
            {labels.privacy}
          </Link>
          <Link href={`/${locale}/cookies`} className="hover:text-foreground">
            {labels.cookies}
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            {labels.github}
          </a>
          <Link href={`/${locale}/demo`} className="hover:text-foreground">
            {labels.contact}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
