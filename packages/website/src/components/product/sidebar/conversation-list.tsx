"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ApiConversation, ConversationListItem } from "@/lib/product/chat-types";
import { MOCK_CONVERSATIONS } from "@/lib/product/mock-conversations";
import type { Locale } from "@/lib/i18n/locales";
import type { W6ConversationLifecycleCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";
import { useSpace } from "@/components/product/space-context";
import { useConversationLifecycle } from "@/components/product/conversation-lifecycle-context";
import {
  groupConversationsByRecency,
  matchesConversationSearch,
  sortConversationsForSidebar,
} from "@/lib/product/conversation-lifecycle-utils";
import { ConversationItem } from "./conversation-item";

type ConversationListProps = {
  locale: Locale;
  w6: W6ConversationLifecycleCopy;
  activeId: string | null;
  collapsed: boolean;
  onMobileClose?: () => void;
};

function toListItem(c: ApiConversation): ConversationListItem {
  return {
    ...c,
    summary: undefined,
    agentNames: [],
    unread: false,
  };
}

/**
 * T-4.3 / W-6 会话列表：按状态筛选、搜索、时间分组、置顶排序。
 */
export function ConversationList({
  locale,
  w6,
  activeId,
  collapsed,
  onMobileClose,
}: ConversationListProps) {
  const { isAuthenticated } = useIdentity();
  const { currentSpaceId } = useSpace();
  const {
    searchQuery,
    includeArchived,
    setIncludeArchived,
    listVersion,
    bumpListVersion,
  } = useConversationLifecycle();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const spaceQ =
        isAuthenticated && currentSpaceId
          ? `&space_id=${encodeURIComponent(currentSpaceId)}`
          : "";
      const states = includeArchived ? "active,archived" : "active";
      const res = await fetch(
        `/api/mainline/conversations?limit=80&sort=created_at:desc&states=${encodeURIComponent(states)}${spaceQ}`,
        { cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItems(MOCK_CONVERSATIONS);
        return;
      }
      const data = json.data;
      if (Array.isArray(data)) {
        const mapped = data.map((c: ApiConversation) => toListItem(c));
        setItems(sortConversationsForSidebar(mapped));
        return;
      }
      setItems(MOCK_CONVERSATIONS);
    } catch {
      setItems(MOCK_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, currentSpaceId, includeArchived, listVersion]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return items;
    return items.filter((c) => matchesConversationSearch(c, q));
  }, [items, searchQuery]);

  const groups = useMemo(
    () =>
      groupConversationsByRecency(filtered, {
        today: w6.groupToday,
        week: w6.groupWeek,
        older: w6.groupOlder,
      }),
    [filtered, w6.groupOlder, w6.groupToday, w6.groupWeek],
  );

  if (loading && items.length === 0) {
    return (
      <div
        className="flex flex-col gap-2 px-1 py-3"
        aria-busy="true"
        aria-label={w6.listLoading}
        role="status"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-md bg-muted/80"
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col gap-2 py-2">
        {!collapsed && (
          <label className="flex cursor-pointer items-center gap-2 px-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded border-border"
            />
            {w6.includeArchived}
          </label>
        )}
        <p className="px-1 py-4 text-center text-xs text-muted-foreground">{w6.listEmpty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!collapsed && (
        <label className="flex cursor-pointer items-center gap-2 px-1 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="rounded border-border"
          />
          {w6.includeArchived}
        </label>
      )}
      <ul className="flex flex-col gap-3" role="list" aria-label="Recent conversations">
        {groups.map((g) => (
          <li key={g.key}>
            {!collapsed && (
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
            )}
            <ul className="flex flex-col gap-0.5" role="list">
              {g.items.map((conv) => (
                <li key={conv.id}>
                  <ConversationItem
                    locale={locale}
                    w6={w6}
                    conversation={conv}
                    activeId={activeId}
                    collapsed={collapsed}
                    isAuthenticated={isAuthenticated}
                    onMobileClose={onMobileClose}
                    onMutate={bumpListVersion}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
