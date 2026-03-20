"use client";

import dynamic from "next/dynamic";

/** T-6.4：同意条非首屏关键，延迟加载减少 TBT/主线程工作。 */
export const CookieBannerDeferred = dynamic(
  () =>
    import("@/components/cookie-banner").then((m) => ({
      default: m.CookieBanner,
    })),
  { ssr: false },
);
