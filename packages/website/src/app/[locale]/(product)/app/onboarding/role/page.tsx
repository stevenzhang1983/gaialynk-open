"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getAuthFormsCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { PanelLayout } from "@/components/product/panels/panel-layout";

/**
 * T-4.6 角色选择页：新用户注册后或未设角色时选择 Provider / Consumer，调用 PUT /api/auth/me/role 后重定向到 return_url 或 /app。
 */
function OnboardingRolePageContent() {
  const params = useParams();
  const rawLocale = typeof params?.locale === "string" ? params.locale : Array.isArray(params?.locale) ? params.locale[0] : "en";
  const locale: Locale = isSupportedLocale(String(rawLocale ?? "en")) ? (String(rawLocale ?? "en") as Locale) : "en";
  const forms = getAuthFormsCopy(locale);
  const R = forms.role;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return_url") ?? `/${locale}/app`;
  const { refresh, isAuthenticated, isLoading } = useIdentity();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setRole = useCallback(
    async (role: "provider" | "consumer") => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/auth/me/role", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ role }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error?.message ?? R.failedSetRole);
          return;
        }
        await refresh();
        if (role === "consumer") {
          const tour = `/${locale}/app/onboarding/consumer?return_url=${encodeURIComponent(returnUrl)}`;
          router.replace(tour);
        } else if (role === "provider") {
          const tour = `/${locale}/app/onboarding/provider?return_url=${encodeURIComponent(returnUrl)}`;
          router.replace(tour);
        } else {
          router.replace(returnUrl);
        }
      } catch {
        setError(R.genericError);
      } finally {
        setLoading(false);
      }
    },
    [refresh, router, returnUrl, locale, R.failedSetRole, R.genericError],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{R.loading}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
        <p className="text-sm text-muted-foreground">{R.pleaseSignIn}</p>
        <Link
          href={`/${locale}/app/login?return_url=${encodeURIComponent(`/${locale}/app/onboarding/role?return_url=${encodeURIComponent(returnUrl)}`)}`}
          className="text-sm text-primary underline"
        >
          {R.signIn}
        </Link>
      </div>
    );
  }

  return (
    <PanelLayout locale={locale} backToChatLabel={forms.backToChat} title={R.title} description={R.description}>
      <div className="mx-auto max-w-md space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("provider")}
            disabled={loading}
            className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary hover:bg-surface-raised disabled:opacity-50"
          >
            <span className="block font-semibold text-foreground">{R.providerTitle}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{R.providerDesc}</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("consumer")}
            disabled={loading}
            className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary hover:bg-surface-raised disabled:opacity-50"
          >
            <span className="block font-semibold text-foreground">{R.consumerTitle}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{R.consumerDesc}</span>
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-sm text-muted-foreground">
          <Link href={returnUrl} className="text-primary underline">
            {R.skipLink}
          </Link>{" "}
          {R.skipRest}
        </p>
      </div>
    </PanelLayout>
  );
}

export default function OnboardingRolePage() {
  const loadingFallback = getAuthFormsCopy("en").role.loading;
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">{loadingFallback}</p>
        </div>
      }
    >
      <OnboardingRolePageContent />
    </Suspense>
  );
}
