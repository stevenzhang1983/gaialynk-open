"use client";

import Link from "next/link";
import type { ProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
import type { Locale } from "@/lib/i18n/locales";

type Props = {
  copy: ProviderOnboardingCopy["complete"];
  locale: Locale;
  returnUrl: string;
};

/**
 * T-4.8 完成引导：进入主界面（侧边栏含 Provider 运维入口）。
 */
export function ProviderCompleteStep({ copy, locale, returnUrl }: Props) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={returnUrl}
          className="inline-flex rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          {copy.continueApp}
        </Link>
        <Link
          href={`/${locale}/app/agents`}
          className="inline-flex rounded-md border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
        >
          {copy.browseDirectory}
        </Link>
      </div>
    </div>
  );
}
