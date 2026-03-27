"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

const OAUTH_MESSAGE_TYPE = "gaialynk_connector_oauth";

/**
 * W-17：连接器 OAuth 完成回跳页（弹窗内）。通过 postMessage 通知 opener 并关闭。
 * 配置主线 `CONNECTOR_OAUTH_SUCCESS_REDIRECT_URL` 为
 * `{origin}/{locale}/app/settings/connectors/oauth-complete`（可用 `{locale}` 占位符）。
 */
function OAuthCompleteInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawLocale = typeof params?.locale === "string" ? params.locale : "en";
  const locale: Locale = isSupportedLocale(rawLocale) ? rawLocale : "en";

  useEffect(() => {
    const connector = searchParams.get("connector")?.trim() ?? "";
    const authorizationId = searchParams.get("authorization_id")?.trim() ?? "";
    const err = searchParams.get("error")?.trim();
    if (typeof window === "undefined") return;
    const status =
      err || !authorizationId ? "error" : "connected";
    try {
      window.opener?.postMessage(
        { type: OAUTH_MESSAGE_TYPE, connector: connector || "unknown", status, authorization_id: authorizationId },
        window.location.origin,
      );
    } catch {
      /* ignore */
    }
    window.close();
  }, [searchParams]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
      <p>{locale === "en" ? "Finishing sign-in…" : locale === "zh-Hant" ? "正在完成登入…" : "正在完成登录…"}</p>
      <p className="text-xs">
        {locale === "en"
          ? "This window should close automatically."
          : locale === "zh-Hant"
            ? "此視窗將自動關閉。"
            : "此窗口将自动关闭。"}
      </p>
    </div>
  );
}

export default function ConnectorOAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <OAuthCompleteInner />
    </Suspense>
  );
}
