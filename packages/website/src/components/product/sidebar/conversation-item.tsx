"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import type { ConversationListItem } from "@/lib/product/chat-types";

type ConversationItemProps = {
  locale: Locale;
  conversation: ConversationListItem;
  /** 当前选中的会话 id（来自路由） */
  activeId: string | null;
  collapsed: boolean;
  onMobileClose?: () => void;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * T-4.3 会话列表项：标题/摘要、参与 Agent 头像、最后活跃时间、未读指示。
 */
export function ConversationItem({
  locale,
  conversation,
  activeId,
  collapsed,
  onMobileClose,
}: ConversationItemProps) {
  const href = `/${locale}/app/chat/${conversation.id}`;
  const isActive = activeId === conversation.id;
  const title = conversation.title || "New chat";
  const summary = conversation.summary ?? "";
  const agentNames = conversation.agentNames ?? [];
  const unread = conversation.unread === true || (typeof conversation.unread === "number" && conversation.unread > 0);

  if (collapsed) {
    return (
      <Link
        href={href}
        onClick={onMobileClose}
        className={`relative flex items-center justify-center rounded-md p-2.5 transition-colors ${
          isActive ? "bg-surface-raised text-primary font-medium" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
        }`}
        aria-label={title}
        title={title}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unread && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" aria-hidden />
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onMobileClose}
      className={`group relative flex flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors ${
        isActive ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`min-w-0 flex-1 truncate text-sm ${isActive ? "font-medium" : ""}`}>
          {title}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground/80">
          {formatRelativeTime(conversation.updated_at)}
        </span>
      </div>
      {(summary || agentNames.length > 0) && (
        <div className="flex items-center gap-2">
          {agentNames.length > 0 && (
            <div className="flex -space-x-1.5 shrink-0" aria-hidden>
              {agentNames.slice(0, 3).map((name, i) => (
                <span
                  key={`${conversation.id}-${name}-${i}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-primary/20 text-[10px] font-medium text-primary"
                  title={name}
                >
                  {name.charAt(0)}
                </span>
              ))}
            </div>
          )}
          {summary && (
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {summary}
            </span>
          )}
        </div>
      )}
      {unread && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" aria-label="Unread" />
      )}
    </Link>
  );
}
