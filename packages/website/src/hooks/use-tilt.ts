"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * Alma.now-style mouse-tracking 3D tilt.
 * Attaches mousemove / mouseleave listeners to `ref.current`,
 * imperatively setting `transform` for zero-rerender perf.
 * Respects `prefers-reduced-motion`.
 */
export function useTilt(
  ref: RefObject<HTMLElement | null>,
  { max = 6, scale = 1.02, speed = 300 } = {},
) {
  const rafRef = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    const flat = `perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)`;
    const ease = `transform ${speed}ms cubic-bezier(.03,.98,.52,.99)`;
    const easeOut = `transform 600ms cubic-bezier(.03,.98,.52,.99)`;

    el.style.willChange = "transform";
    el.style.transform = flat;
    el.style.transition = ease;

    const onEnter = () => {
      el.style.transition = ease;
    };

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const ry = (nx - 0.5) * max * 2;
        const rx = (0.5 - ny) * max * 2;
        el.style.transform = `perspective(1200px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale3d(${scale},${scale},${scale})`;
      });
    };

    const onLeave = () => {
      cancelAnimationFrame(rafRef.current);
      el.style.transition = easeOut;
      el.style.transform = flat;
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, [max, scale, speed]);
}
