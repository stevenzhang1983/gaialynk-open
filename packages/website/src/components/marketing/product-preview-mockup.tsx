"use client";

import { useRef, useState } from "react";

/**
 * T-3.2 首页产品界面预览 Mockup
 * 三栏：对话列表 | 用户↔Agent 对话 + 风险确认卡片 | Agent 身份与信誉 + 收据
 * 浮窗式展示；hover 时可选轻微动效（消息滚动）。
 */
export function ProductPreviewMockup() {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative mx-auto w-full min-w-0 max-w-5xl"
      style={{ perspective: "1200px" }}
    >
      {/* 浮窗容器：桌面轻微倾斜、阴影、光效；移动端无倾斜便于阅读 */}
      <div
        className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-elevated transition-all duration-500 ease-out md:[transform:rotateX(4deg)_rotateY(-6deg)]"
        style={{
          boxShadow: hovered
            ? "var(--shadow-brand-md), 0 32px 80px -24px rgb(0 0 0 / 0.5)"
            : "var(--shadow-elevated), 0 0 0 1px rgb(var(--color-border) / 0.5)",
        }}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between border-b border-border bg-surface-raised px-4 py-2.5">
          <span className="text-xs font-semibold text-foreground">GaiaLynk Agent IM</span>
          <span className="text-caption text-muted-foreground">Preview</span>
        </div>

        <div className="flex min-h-[320px] md:min-h-[380px]">
          {/* 左侧：对话列表 */}
          <aside className="hidden w-[28%] min-w-[120px] shrink-0 flex-col border-r border-border bg-surface md:flex">
            <div className="border-b border-border px-3 py-2">
              <span className="text-caption font-medium text-muted-foreground">Conversations</span>
            </div>
            <div className="flex-1 space-y-0.5 p-2">
              {["Summary request", "API docs lookup", "Code review"].map((title, i) => (
                <div
                  key={title}
                  className={`rounded-md px-3 py-2.5 text-caption ${
                    i === 1 ? "bg-surface-raised text-primary font-medium" : "text-muted-foreground"
                  }`}
                >
                  {title}
                </div>
              ))}
            </div>
          </aside>

          {/* 中间：对话 + 风险确认卡片 */}
          <main className="min-w-0 flex-1 flex flex-col">
            <div className="flex-1 space-y-3 overflow-hidden p-4">
              {/* 用户消息 */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-lg rounded-tr-none bg-primary/20 px-3 py-2 text-caption text-foreground">
                  Summarize the latest API changes and risks.
                </div>
              </div>
              {/* Agent 回复 */}
              <div className="flex justify-start gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/30 flex items-center justify-center text-caption font-semibold text-primary">
                  A
                </div>
                <div className="max-w-[85%] rounded-lg rounded-tl-none border border-border bg-card px-3 py-2 text-caption text-foreground">
                  I found 3 breaking changes. One action requires your approval before I proceed.
                </div>
              </div>
              {/* 风险确认卡片 */}
              <div
                className={`rounded-lg border-2 border-warning/60 bg-warning/10 px-3 py-2.5 transition-all duration-300 ${
                  hovered ? "opacity-100" : "opacity-95"
                }`}
              >
                <p className="text-caption font-semibold text-warning-foreground">
                  Risk confirmation required
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  Execute external API call? Approve or reject below.
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded bg-success/20 px-2 py-1 text-caption text-success">
                    Approve
                  </span>
                  <span className="rounded bg-destructive/20 px-2 py-1 text-caption text-destructive">
                    Reject
                  </span>
                </div>
              </div>
              {/* 第二条 Agent 消息（hover 时轻微上移，模拟滚动） */}
              <div
                className={`flex justify-start gap-2 transition-transform duration-500 ${
                  hovered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-90"
                }`}
              >
                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/30 flex items-center justify-center text-caption font-semibold text-primary">
                  A
                </div>
                <div className="max-w-[85%] rounded-lg rounded-tl-none border border-border bg-card px-3 py-2 text-caption text-foreground">
                  Summary ready. Receipt attached.
                </div>
              </div>
            </div>
          </main>

          {/* 右侧：Agent 身份与信誉 + 收据 */}
          <aside className="hidden w-[30%] min-w-[140px] shrink-0 flex-col border-l border-border bg-surface-overlay lg:flex">
            <div className="border-b border-border px-3 py-2">
              <span className="text-caption font-medium text-muted-foreground">Agent & Receipt</span>
            </div>
            <div className="flex-1 space-y-3 p-3">
              <div className="rounded-lg border border-border bg-surface p-2.5">
                <p className="text-caption font-semibold text-foreground">Agent Alpha</p>
                <p className="mt-1 text-caption text-success">Verified</p>
                <p className="mt-0.5 text-caption text-muted-foreground">Reputation: 4.8</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-2.5">
                <p className="text-caption font-semibold text-foreground">Call receipt</p>
                <p className="mt-1 text-caption text-muted-foreground">Signed · Verifiable</p>
                <p className="mt-0.5 text-caption text-primary">View details →</p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* 底部光效 */}
      <div
        className="pointer-events-none absolute -bottom-20 left-1/2 h-24 w-full max-w-md -translate-x-1/2 rounded-full bg-primary/15 blur-3xl transition-opacity duration-500"
        style={{ opacity: hovered ? 0.8 : 0.5 }}
        aria-hidden
      />
    </div>
  );
}
