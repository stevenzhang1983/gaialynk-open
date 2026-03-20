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
 * T-4.6 登录页：邮箱+密码、OAuth（GitHub / Google）、支持 return_url，登录成功后重定向回原页。
 */
function LoginPageContent() {
  const params = useParams();
  const rawLocale = typeof params?.locale === "string" ? params.locale : Array.isArray(params?.locale) ? params.locale[0] : "en";
  const locale: Locale = isSupportedLocale(String(rawLocale ?? "en")) ? (String(rawLocale ?? "en") as Locale) : "en";
  const forms = getAuthFormsCopy(locale);
  const L = forms.login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return_url") ?? `/${locale}/app`;
  const { signInWithPassword, isAuthenticated } = useIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password) return;
      setLoading(true);
      setError("");
      try {
        const ok = await signInWithPassword(email.trim(), password);
        if (ok) {
          router.replace(returnUrl);
        } else {
          setError(L.invalidCredentials);
        }
      } catch {
        setError(L.genericError);
      } finally {
        setLoading(false);
      }
    },
    [email, password, signInWithPassword, router, returnUrl, L.invalidCredentials, L.genericError],
  );

  const oauthCallbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/app/auth/callback#return_url=${encodeURIComponent(returnUrl)}`
      : "";

  if (isAuthenticated) {
    router.replace(returnUrl);
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">{L.redirecting}</p>
      </div>
    );
  }

  return (
    <PanelLayout locale={locale} backToChatLabel={forms.backToChat} title={L.title} description={L.description}>
      <div className="mx-auto max-w-md space-y-6">
        {/* OAuth */}
        <div className="flex flex-col gap-2">
          <a
            href={`/api/auth/oauth/github?return_url=${encodeURIComponent(returnUrl)}`}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-raised"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            {L.signInGitHub}
          </a>
          <a
            href={`/api/auth/oauth/google?return_url=${encodeURIComponent(returnUrl)}`}
            className="flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-raised"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {L.signInGoogle}
          </a>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">{L.orEmail}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-foreground">
              {L.email}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-foreground">
              {L.password}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {loading ? L.signingIn : L.signIn}
            </button>
            <Link
              href={returnUrl}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {L.cancel}
            </Link>
          </div>
        </form>

        <p className="text-sm text-muted-foreground">
          {L.noAccount}{" "}
          <Link
            href={`/${locale}/app/register?return_url=${encodeURIComponent(returnUrl)}`}
            className="text-primary underline"
          >
            {L.register}
          </Link>
        </p>
      </div>
    </PanelLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
