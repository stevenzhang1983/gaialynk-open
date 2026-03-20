"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiConversation, ConversationListItem } from "@/lib/product/chat-types";
import { MOCK_CONVERSATIONS } from "@/lib/product/mock-conversations";
import type { Locale } from "@/lib/i18n/locales";
import { ConversationItem } from "./conversation-item";

type ConversationListProps = {
  locale: Locale;
  /** 当前选中的会话 id（来自路由） */
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
 * T-4.3 会话列表：拉取 T-5.1 GET /api/mainline/conversations（按时间倒排）。
 * 主线 API 就绪后以真实数据为准；仅在网络/主线不可用时回退到 Mock。
 */
export function ConversationList({
  locale,
  activeId,
  collapsed,
  onMobileClose,
}: ConversationListProps) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/mainline/conversations?limit=50&sort=created_at:desc", {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItems(MOCK_CONVERSATIONS);
        return;
      }
      const data = json.data;
      if (Array.isArray(data)) {
        setItems(data.map((c: ApiConversation) => toListItem(c)));
        return;
      }
      setItems(MOCK_CONVERSATIONS);
    } catch {
      setItems(MOCK_CONVERSATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        No conversations yet. Start a new chat above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5" role="list" aria-label="Recent conversations">
      {items.map((conv) => (
        <li key={conv.id}>
          <ConversationItem
            locale={locale}
            conversation={conv}
            activeId={activeId}
            collapsed={collapsed}
            onMobileClose={onMobileClose}
          />
        </li>
      ))}
    </ul>
  );
}
