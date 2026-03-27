"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { ConversationListItem } from "@/lib/product/chat-types";
import type { W6ConversationLifecycleCopy } from "@/content/i18n/product-experience";

type ConversationItemProps = {
  locale: Locale;
  w6: W6ConversationLifecycleCopy;
  conversation: ConversationListItem;
  activeId: string | null;
  collapsed: boolean;
  isAuthenticated: boolean;
  onMobileClose?: () => void;
  onMutate?: () => void;
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
 * T-4.3 / W-6 会话列表项：置顶/标星/归档/删除；折叠侧栏仅图标。
 */
export function ConversationItem({
  locale,
  w6,
  conversation,
  activeId,
  collapsed,
  isAuthenticated,
  onMobileClose,
  onMutate,
}: ConversationItemProps) {
  const href = `/${locale}/app/chat/${conversation.id}`;
  const isActive = activeId === conversation.id;
  const title = conversation.title || "New chat";
  const summary = conversation.summary ?? "";
  const agentNames = conversation.agentNames ?? [];
  const unread = conversation.unread === true || (typeof conversation.unread === "number" && conversation.unread > 0);
  const starred = Boolean(conversation.starred);
  const pinned = Boolean(conversation.pinned_at);
  const archived = conversation.state === "archived";
  const closed = conversation.state === "closed";
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patchConversation = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/mainline/conversations/${conversation.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          onMutate?.();
        }
      } catch {
        /* ignore */
      }
    },
    [conversation.id, onMutate],
  );

  const deleteConversation = useCallback(async () => {
    if (!window.confirm(w6.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/mainline/conversations/${conversation.id}`, { method: "DELETE" });
      if (res.ok) {
        onMutate?.();
        if (isActive) {
          window.location.href = `/${locale}/app/chat`;
        }
      }
    } catch {
      /* ignore */
    }
  }, [conversation.id, isActive, locale, onMutate, w6.deleteConfirm]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setMenuOpen(false), 160);
  };

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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {starred && <span className="absolute right-0.5 top-0.5 text-[8px] text-amber-500" aria-hidden>
          ★
        </span>}
        {unread && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" aria-hidden />
        )}
      </Link>
    );
  }

  return (
    <div
      className={`group relative flex rounded-md transition-colors ${
        isActive ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
      }`}
      onMouseLeave={() => scheduleClose()}
      onMouseEnter={() => cancelClose()}
    >
      <Link
        href={href}
        onClick={onMobileClose}
        className="min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <span className={`min-w-0 flex-1 truncate text-sm ${isActive ? "font-medium" : ""}`}>
            {pinned && (
              <span className="mr-1 text-[10px] text-primary" title={w6.pinnedBadge}>
                📌
              </span>
            )}
            {starred && <span className="mr-0.5 text-amber-500" aria-hidden>
              ★
            </span>}
            {title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground/80">
            {formatRelativeTime(conversation.updated_at)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {archived && (
            <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
              {w6.stateArchivedBadge}
            </span>
          )}
          {closed && (
            <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
              {w6.stateClosedBadge}
            </span>
          )}
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
              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{summary}</span>
            )}
          </div>
        )}
        {unread && (
          <span className="absolute right-8 top-2 h-2 w-2 rounded-full bg-accent" aria-label="Unread" />
        )}
      </Link>
      {isAuthenticated && (
        <div className="relative shrink-0 pr-1 pt-1">
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label={w6.actionsAria}
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((o) => !o);
            }}
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16" aria-hidden>
              <circle cx="3" cy="8" r="1.25" />
              <circle cx="8" cy="8" r="1.25" />
              <circle cx="13" cy="8" r="1.25" />
            </svg>
          </button>
          {menuOpen && (
            <ul
              role="menu"
              className="absolute right-0 top-8 z-20 min-w-[10rem] rounded-md border border-border bg-popover py-1 text-xs shadow-md"
              onMouseEnter={() => cancelClose()}
            >
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    void patchConversation({ pinned: !pinned });
                    setMenuOpen(false);
                  }}
                >
                  {pinned ? w6.unpin : w6.pin}
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    void patchConversation({ starred: !starred });
                    setMenuOpen(false);
                  }}
                >
                  {starred ? w6.unstar : w6.star}
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left hover:bg-muted"
                  onClick={() => {
                    void patchConversation({ state: archived || closed ? "active" : "archived" });
                    setMenuOpen(false);
                  }}
                >
                  {archived || closed ? w6.restore : w6.archive}
                </button>
              </li>
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-3 py-1.5 text-left text-destructive hover:bg-muted"
                  onClick={() => {
                    setMenuOpen(false);
                    void deleteConversation();
                  }}
                >
                  {w6.delete}
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
