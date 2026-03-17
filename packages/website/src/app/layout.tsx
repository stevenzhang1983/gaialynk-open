import type { Metadata } from "next";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { CookieBanner } from "@/components/cookie-banner";
import { IdentityProvider } from "@/lib/identity/context";
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
  return (
    <html lang="en">
      <body>
        <IdentityProvider>
          <AnalyticsProvider />
          {children}
          <CookieBanner />
        </IdentityProvider>
      </body>
    </html>
  );
}
