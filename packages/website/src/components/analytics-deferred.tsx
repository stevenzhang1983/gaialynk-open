"use client";

import dynamic from "next/dynamic";

/**
 * T-6.4：分析适配器与 posthog-js 拆到独立 chunk，仅在客户端 hydration 后加载，
 * 行为上等价于 next/script 的 lazyOnload，减轻首包与主线程占用。
 */
export const AnalyticsProviderDeferred = dynamic(
  () =>
    import("@/components/analytics-provider").then((m) => ({
      default: m.AnalyticsProvider,
    })),
  { ssr: false },
);
