"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * 全局 Framer Motion 配置：尊重系统 `prefers-reduced-motion`（`reducedMotion="user"`）。
 * 持续型 Hero 背景动效仍由 CSS / canvas 承担，不在此 Provider 范围内。
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
