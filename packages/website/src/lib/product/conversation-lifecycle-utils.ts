import type { ConversationListItem } from "@/lib/product/chat-types";

export function matchesConversationSearch(item: ConversationListItem, query: string): boolean {
  const t = query.trim().toLowerCase();
  if (!t) return true;
  if (item.title.toLowerCase().includes(t)) return true;
  if (item.id.toLowerCase().includes(t)) return true;
  if (item.summary?.toLowerCase().includes(t)) return true;
  if (item.agentNames?.some((n) => n.toLowerCase().includes(t))) return true;
  return false;
}

export type ConversationRecencyGroup = {
  key: "today" | "week" | "older";
  label: string;
  items: ConversationListItem[];
};

export function groupConversationsByRecency(
  items: ConversationListItem[],
  labels: { today: string; week: string; older: string },
): ConversationRecencyGroup[] {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(startToday.getTime() - 7 * 86400000);
  const groups: ConversationRecencyGroup[] = [
    { key: "today", label: labels.today, items: [] },
    { key: "week", label: labels.week, items: [] },
    { key: "older", label: labels.older, items: [] },
  ];
  for (const c of items) {
    const u = new Date(c.updated_at);
    if (u >= startToday) {
      groups[0].items.push(c);
    } else if (u >= weekAgo) {
      groups[1].items.push(c);
    } else {
      groups[2].items.push(c);
    }
  }
  return groups.filter((g) => g.items.length > 0);
}

export function sortConversationsForSidebar(items: ConversationListItem[]): ConversationListItem[] {
  return [...items].sort((a, b) => {
    const ap = a.pinned_at ? 1 : 0;
    const bp = b.pinned_at ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
  });
}
