"use client";

import { useParams } from "next/navigation";
import { ProviderPortalConsole } from "@/components/product/provider-portal-console";
import { getW13ProviderPortalCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

export default function MyAgentsPage() {
  const params = useParams();
  const rawLocale = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(rawLocale) ? (rawLocale as Locale) : "en";
  const copy = getW13ProviderPortalCopy(locale);
  const { isAuthenticated } = useIdentity();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-base text-muted-foreground">{copy.signInRequired}</p>
        <a
          href={`/${locale}/app/login?return_url=${encodeURIComponent(`/${locale}/app/my-agents`)}`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {copy.signInButton}
        </a>
      </div>
    );
  }

  return <ProviderPortalConsole locale={locale} copy={copy} />;
}
