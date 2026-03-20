"use client";

import styles from "./hero-background.module.css";

/**
 * T-3.1 Hero 背景动效：渐变网格 + 中心光晕 + 节点连接线呼吸。
 * 纯 CSS 动画；尊重 prefers-reduced-motion。
 * T-6.4：请通过 `HeroBackgroundDeferred` 挂载，避免首帧与 LCP 争抢。
 */
export function HeroBackground() {
  return (
    <div className={styles.wrapper} aria-hidden>
      <div className={styles.glow} />
      <div className={styles.grid} />
      <div className={styles.lines} />
    </div>
  );
}
