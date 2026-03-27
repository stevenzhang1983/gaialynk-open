import type { ReactNode } from "react";
import { SettingsSuiteShell } from "@/components/product/settings/settings-suite-shell";
import { getW10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

export default async function SettingsSuiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isSupportedLocale(raw)) {
    return <>{children}</>;
  }
  const locale = raw as Locale;
  const copy = getW10SettingsSuiteCopy(locale);
  return (
    <SettingsSuiteShell locale={locale} copy={copy}>
      {children}
    </SettingsSuiteShell>
  );
}
