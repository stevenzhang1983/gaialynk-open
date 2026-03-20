"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getAuthFormsCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";
import { PanelLayout } from "@/components/product/panels/panel-layout";

type RoleChoice = "provider" | "consumer" | "";

/**
 * T-4.6 注册页：邮箱+密码+可选角色（Provider/Consumer），支持 return_url。
 * 注册成功后统一进入角色选择页（未选角色则必选），再进入 return_url 或 Onboarding。
 */
function RegisterPageContent() {
  const params = useParams();
  const rawLocale = typeof params?.locale === "string" ? params.locale : Array.isArray(params?.locale) ? params.locale[0] : "en";
  const locale: Locale = isSupportedLocale(String(rawLocale ?? "en")) ? (String(rawLocale ?? "en") as Locale) : "en";
  const forms = getAuthFormsCopy(locale);
  const R = forms.register;
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return_url") ?? `/${locale}/app`;
  const { refresh } = useIdentity();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleChoice>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password) return;
      if (password.length < 8) {
        setError(R.passwordTooShort);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const body: { email: string; password: string; role?: "provider" | "consumer" } = {
          email: email.trim(),
          password,
        };
        if (role === "provider" || role === "consumer") body.role = role;
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error?.message ?? R.registrationFailed);
          return;
        }
        await refresh();
        const roleSelectionUrl = `/${locale}/app/onboarding/role?return_url=${encodeURIComponent(returnUrl)}`;
        router.replace(roleSelectionUrl);
      } catch {
        setError(forms.login.genericError);
      } finally {
        setLoading(false);
      }
    },
    [email, password, role, refresh, router, locale, returnUrl, R, forms.login.genericError],
  );

  return (
    <PanelLayout locale={locale} backToChatLabel={forms.backToChat} title={R.title} description={R.description}>
      <div className="mx-auto max-w-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-foreground">
              {R.email}
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="mb-1 block text-sm font-medium text-foreground">
              {R.passwordHint}
            </label>
            <input
              id="reg-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">{R.roleOptional}</label>
            <p className="mb-2 text-xs text-muted-foreground">{R.roleHelp}</p>
            <select
              value={role}
              onChange={(e) => setRole((e.target.value || "") as RoleChoice)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={R.roleOptional}
            >
              <option value="">{R.roleLater}</option>
              <option value="provider">{R.roleProvider}</option>
              <option value="consumer">{R.roleConsumer}</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
            >
              {loading ? R.creating : R.submit}
            </button>
            <Link
              href={returnUrl}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              {R.cancel}
            </Link>
          </div>
        </form>
        <p className="text-sm text-muted-foreground">
          {R.hasAccount}{" "}
          <Link
            href={`/${locale}/app/login?return_url=${encodeURIComponent(returnUrl)}`}
            className="text-primary underline"
          >
            {R.signIn}
          </Link>
        </p>
      </div>
    </PanelLayout>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
