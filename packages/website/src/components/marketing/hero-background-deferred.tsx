"use client";

import { useEffect, useState } from "react";
import { HeroBackground } from "./hero-background";

/**
 * T-6.4：Hero 背景动效在首帧之后再挂载，避免与 LCP（通常为 H1）争抢主线程与合成。
 * 使用 requestIdleCallback（无则回退 setTimeout），并设 timeout 上限以免久不触发。
 */
export function HeroBackgroundDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = () => setReady(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 2200 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) {
    return null;
  }

  return <HeroBackground />;
}
