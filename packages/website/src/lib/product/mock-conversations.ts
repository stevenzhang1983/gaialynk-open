import type { ConversationListItem } from "./chat-types";

/**
 * T-4.3 Mock 会话列表。API 就绪后由 GET /api/mainline/conversations 替代。
 * 按 updated_at 倒排，供侧边栏「最近对话」使用。
 */
export const MOCK_CONVERSATIONS: ConversationListItem[] = [
  {
    id: "conv-mock-1",
    title: "Summary for Q1 report",
    state: "active",
    created_at: "2026-03-18T10:00:00.000Z",
    updated_at: "2026-03-19T09:30:00.000Z",
    summary: "Summary Pro: Here is the executive summary…",
    agentNames: ["Summary Pro"],
    unread: false,
  },
  {
    id: "conv-mock-2",
    title: "PR review for auth module",
    state: "active",
    created_at: "2026-03-18T14:00:00.000Z",
    updated_at: "2026-03-19T08:15:00.000Z",
    summary: "Code Reviewer: Suggested 3 changes…",
    agentNames: ["Code Reviewer"],
    unread: true,
  },
  {
    id: "conv-mock-3",
    title: "New chat",
    state: "active",
    created_at: "2026-03-17T16:00:00.000Z",
    updated_at: "2026-03-17T16:00:00.000Z",
    summary: "",
    agentNames: [],
    unread: false,
  },
];
