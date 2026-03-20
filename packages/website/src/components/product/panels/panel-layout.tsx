import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

type PanelLayoutProps = {
  locale: Locale;
  title: string;
  description?: string;
  backToChatLabel?: string;
  children: React.ReactNode;
};

/**
 * T-4.5 功能面板统一布局：标题、描述、可选「返回 Chat」链接、内容区。
 */
export function PanelLayout({
  locale,
  title,
  description,
  backToChatLabel = "← Chat",
  children,
}: PanelLayoutProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link
            href={`/${locale}/app/chat`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {backToChatLabel}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
