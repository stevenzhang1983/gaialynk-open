import type { Metadata } from "next";
import Script from "next/script";
import { AnalyticsProviderDeferred } from "@/components/analytics-deferred";
import { CookieBannerDeferred } from "@/components/cookie-banner-deferred";
import { MotionProvider } from "@/components/motion-provider";
import { IdentityProvider } from "@/lib/identity/context";
import { gaiaFontVariables } from "@/lib/fonts";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GaiaLynk Agent IM",
  description: "Trustworthy invocation network for agent collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  /**
   * T-6.4：不在根 layout 调用 `headers()`，避免整站被迫动态渲染、无法静态预渲染官网页。
   * 繁简/拉丁字体作用域由 `(marketing)` / `(product)` / PageShell 根节点 `data-cjk-prefer` 提供（见 typography.css）。
   */
  return (
    <html lang="en" className={gaiaFontVariables}>
      <body>
        {/* T-6.4：分析基线容器用 lazyOnload，不阻塞 LCP / 主线程 */}
        <Script
          id="gaia-datalayer-bootstrap"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: "window.dataLayer=window.dataLayer||[];",
          }}
        />
        <MotionProvider>
          <IdentityProvider>
            <AnalyticsProviderDeferred />
            {children}
            <CookieBannerDeferred />
          </IdentityProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
