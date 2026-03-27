/** W-9：首启与聊天首屏之间的 session 桥接（同域、会话级） */

export const W9_FIRST_RUN_DRAFT_KEY = "gl_w9_first_run_draft";
export const W9_PENDING_AGENT_ID_KEY = "gl_w9_pending_agent_id";

export function writeFirstRunDraft(text: string): void {
  if (typeof window === "undefined") return;
  const t = text.trim();
  if (!t) return;
  try {
    window.sessionStorage.setItem(W9_FIRST_RUN_DRAFT_KEY, t);
  } catch {
    /* ignore quota / private mode */
  }
}

export function consumeFirstRunDraft(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(W9_FIRST_RUN_DRAFT_KEY);
    if (v) window.sessionStorage.removeItem(W9_FIRST_RUN_DRAFT_KEY);
    return v?.trim() ? v : null;
  } catch {
    return null;
  }
}

export function writePendingAgentId(agentId: string): void {
  if (typeof window === "undefined") return;
  const id = agentId.trim();
  if (!id) return;
  try {
    window.sessionStorage.setItem(W9_PENDING_AGENT_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function consumePendingAgentId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(W9_PENDING_AGENT_ID_KEY);
    if (v) window.sessionStorage.removeItem(W9_PENDING_AGENT_ID_KEY);
    return v?.trim() ? v : null;
  } catch {
    return null;
  }
}
