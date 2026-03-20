"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

type NewConversationProps = {
  locale: Locale;
  /** 折叠时只显示图标按钮 */
  collapsed: boolean;
  /** 新建对话按钮文案 */
  label?: string;
  /** 移动端点击后关闭抽屉 */
  onMobileClose?: () => void;
};

/**
 * T-4.3 新建对话：顶部按钮，跳转到 /app/chat（由平台创建或取最近会话）。
 * 新建时可选择 Agent 或直接开始——当前实现为直接开始；后续可在此增加 Agent 选择入口。
 */
export function NewConversation({
  locale,
  collapsed,
  label = "New chat",
  onMobileClose,
}: NewConversationProps) {
  const href = `/${locale}/app/chat`;

  if (collapsed) {
    return (
      <Link
        href={href}
        onClick={onMobileClose}
        className="flex items-center justify-center rounded-md p-2.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
        aria-label={label}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onMobileClose}
      className="flex items-center gap-3 rounded-md border border-border bg-surface-raised px-3 py-2.5 text-sm font-medium text-foreground shadow-card transition-colors hover:border-primary/30 hover:shadow-card-hover"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </span>
      <span>{label}</span>
    </Link>
  );
}
