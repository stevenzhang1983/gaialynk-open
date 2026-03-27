"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { W10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

type SettingsSuiteShellProps = {
  locale: Locale;
  copy: W10SettingsSuiteCopy;
  children: React.ReactNode;
};

export function SettingsSuiteShell({ locale, copy, children }: SettingsSuiteShellProps) {
  const pathname = usePathname() ?? "";
  const base = `/${locale}/app/settings`;

  const items: { href: string; label: string; match: (p: string) => boolean }[] = [
    { href: `${base}/account`, label: copy.navAccount, match: (p) => p.startsWith(`${base}/account`) },
    { href: `${base}/notifications`, label: copy.navNotifications, match: (p) => p.startsWith(`${base}/notifications`) },
    { href: `${base}/connectors`, label: copy.navConnectors, match: (p) => p.startsWith(`${base}/connectors`) },
    {
      href: `${base}/scheduled-tasks`,
      label: copy.navScheduledTasks,
      match: (p) => p.startsWith(`${base}/scheduled-tasks`),
    },
    { href: `${base}/usage`, label: copy.navUsage, match: (p) => p.startsWith(`${base}/usage`) },
    { href: `${base}/data`, label: copy.navDataPrivacy, match: (p) => p.startsWith(`${base}/data`) },
    {
      href: `${base}/space/members`,
      label: copy.navSpaceMembers,
      match: (p) => p.includes("/settings/space/"),
    },
  ];

  return (
    <div className="flex min-h-0 min-h-[60vh] flex-1 flex-col gap-0 lg:flex-row">
      <aside
        className="shrink-0 border-b border-border bg-card/30 lg:w-56 lg:border-b-0 lg:border-r lg:bg-transparent"
        aria-label={copy.suiteTitle}
      >
        <div className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-0.5 lg:p-4 lg:pr-3">
          <p className="hidden px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:block">
            {copy.suiteTitle}
          </p>
          {items.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </aside>
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </div>
  );
}
