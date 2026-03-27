"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "@/lib/identity/context";
import { getSpaceUiCopy } from "@/content/i18n/product-experience";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";
import Link from "next/link";

/**
 * W-3：通过邀请 token 加入 Space（需登录）。
 */
function JoinSpacePageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const rawLocale = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : "en";
  const copy = getSpaceUiCopy(locale);
  const { isAuthenticated, isLoading } = useIdentity();
  const [status, setStatus] = useState<"idle" | "working" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");
  const joinAttemptForToken = useRef<string | null>(null);

  const join = useCallback(async () => {
    if (!token) {
      setStatus("err");
      setMessage(copy.joinPageError);
      return;
    }
    setStatus("working");
    try {
      const res = await fetch("/api/mainline/spaces/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data?.space_id) {
        setStatus("ok");
        setMessage(copy.joinPageSuccess);
        router.replace(`/${locale}/app/chat`);
        return;
      }
      setStatus("err");
      setMessage(json?.error?.message ?? copy.joinPageError);
    } catch {
      setStatus("err");
      setMessage(copy.joinPageError);
    }
  }, [token, copy.joinPageError, copy.joinPageSuccess, locale, router]);

  useEffect(() => {
    joinAttemptForToken.current = null;
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setMessage(copy.joinPageSignIn);
      return;
    }
    if (!token) {
      setStatus("err");
      setMessage(copy.joinPageError);
      return;
    }
    if (joinAttemptForToken.current === token) return;
    joinAttemptForToken.current = token;
    void join();
  }, [isLoading, isAuthenticated, token, join, copy.joinPageSignIn, copy.joinPageError]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-lg font-semibold text-foreground">{copy.joinPageTitle}</h1>
        {!isAuthenticated && !isLoading && (
          <p className="text-sm text-muted-foreground">{copy.joinPageSignIn}</p>
        )}
        {isAuthenticated && status === "working" && (
          <p className="text-sm text-muted-foreground">{copy.joinPageWorking}</p>
        )}
        {message && status !== "working" && <p className="text-sm text-foreground">{message}</p>}
        <Link
          href={`/${locale}/app/login?return_url=${encodeURIComponent(`/${locale}/app/join-space${token ? `?token=${encodeURIComponent(token)}` : ""}`)}`}
          className="inline-block text-sm font-medium text-primary hover:underline"
        >
          {locale === "en" ? "Sign in" : locale === "zh-Hant" ? "登入" : "登录"}
        </Link>
      </div>
    </div>
  );
}

export default function JoinSpacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-0 flex-1 items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <JoinSpacePageInner />
    </Suspense>
  );
}
