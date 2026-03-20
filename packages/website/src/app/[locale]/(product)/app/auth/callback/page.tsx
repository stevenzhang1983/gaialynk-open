"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * T-4.6 OAuth 回调页：mainline 完成 OAuth 后应重定向到此页，并在 hash 中带上 access_token、refresh_token、return_url。
 * 本页读取 hash → 调用 POST /api/auth/set-tokens → 再跳转到 return_url。
 * 若 mainline 与网站同源且 mainline 回调返回 JSON，可改为由 mainline 重定向到本页并带上 fragment。
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? "en";
  const [status, setStatus] = useState<"reading" | "setting" | "done" | "error">("reading");

  const run = useCallback(async () => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.slice(1) || "";
    const search = new URLSearchParams(hash);
    const accessToken = search.get("access_token");
    const refreshToken = search.get("refresh_token");
    const returnUrl = search.get("return_url") || `/${locale}/app`;

    if (!accessToken || !refreshToken) {
      setStatus("error");
      return;
    }

    setStatus("setting");
    try {
      const res = await fetch("/api/auth/set-tokens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("done");
      router.replace(returnUrl);
    } catch {
      setStatus("error");
    }
  }, [locale, router]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      {status === "reading" && <p className="text-sm text-muted-foreground">Reading callback…</p>}
      {status === "setting" && <p className="text-sm text-muted-foreground">Signing you in…</p>}
      {status === "done" && <p className="text-sm text-muted-foreground">Redirecting…</p>}
      {status === "error" && (
        <>
          <p className="text-sm text-destructive">Sign-in failed or missing tokens.</p>
          <a href={`/${locale}/app/login`} className="text-sm text-primary underline">
            Back to sign in
          </a>
        </>
      )}
    </div>
  );
}
