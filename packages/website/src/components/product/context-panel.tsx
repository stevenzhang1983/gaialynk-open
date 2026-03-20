"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const PANEL_WIDTH = "w-[300px] xl:w-[320px]";

type ContextPanelProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** 移动端以 overlay 形式展示（从右侧滑出） */
  mobileOverlay?: boolean;
  children?: ReactNode;
};

/**
 * 产品区右侧上下文面板（T-2.3 / T-6.1）
 * 桌面可折叠；移动端 overlay 滑入/滑出由 Framer Motion 驱动。
 */
export function ContextPanel({ collapsed, onToggleCollapse, mobileOverlay, children }: ContextPanelProps) {
  if (collapsed) {
    if (mobileOverlay) return null;
    return (
      <aside className="hidden w-10 shrink-0 flex-col border-l border-border bg-surface-overlay lg:flex">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-10 flex-shrink-0 items-center justify-center border-b border-border text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          aria-label="展开上下文面板"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-1 items-center justify-center py-4 text-muted-foreground">
          <span className="text-caption">已收起</span>
        </div>
      </aside>
    );
  }

  const panelContent = (
    <>
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">上下文</span>
        <button
          type="button"
          onClick={onToggleCollapse}
          className="rounded p-1 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          aria-label="收起上下文面板"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {children ?? (
          <p className="text-caption text-muted-foreground">根据当前焦点（对话 / Agent / 审批 / 收据）动态切换内容。</p>
        )}
      </div>
    </>
  );

  if (mobileOverlay) {
    return (
      <AnimatePresence>
        <motion.div
          key="context-panel-backdrop"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          role="button"
          tabIndex={-1}
          aria-label="关闭面板"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onToggleCollapse}
          onKeyDown={(e) => e.key === "Escape" && onToggleCollapse()}
        />
        <motion.aside
          key="context-panel-sheet"
          className={`fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-surface-overlay shadow-elevated lg:hidden ${PANEL_WIDTH}`}
          aria-label="上下文面板"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        >
          {panelContent}
        </motion.aside>
      </AnimatePresence>
    );
  }

  return (
    <aside
      className={`hidden shrink-0 flex-col border-l border-border bg-surface-overlay lg:flex ${PANEL_WIDTH}`}
      aria-label="上下文面板"
    >
      {panelContent}
    </aside>
  );
}
