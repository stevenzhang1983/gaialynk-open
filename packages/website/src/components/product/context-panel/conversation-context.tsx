"use client";

import { useCallback, useEffect, useState } from "react";

type Participant = {
  id: string;
  participant_type: "user" | "agent";
  participant_id: string;
  role: string;
  joined_at: string;
};

type ConversationDetail = {
  conversation: {
    id: string;
    title: string;
    state: string;
    conversation_topology?: string;
    authorization_mode?: string;
    visibility_mode?: string;
  };
  participants: Participant[];
};

type ConversationContextProps = {
  conversationId: string;
};

/**
 * T-4.4 对话视图：参与者列表、会话拓扑、授权范围。
 * 数据来自 GET /api/mainline/conversations/:id，失败时用占位。
 */
export function ConversationContext({ conversationId }: ConversationContextProps) {
  const [data, setData] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/mainline/conversations/${conversationId}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data?.conversation) {
        setData(json.data);
        return;
      }
      setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Loading conversation…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Conversation not found or unavailable.</p>
      </div>
    );
  }

  const { conversation, participants } = data;
  const agents = participants.filter((p) => p.participant_type === "agent");
  const users = participants.filter((p) => p.participant_type === "user");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{conversation.title || "Conversation"}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">ID: {conversation.id.slice(0, 8)}…</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Participants</h4>
        <ul className="mt-1.5 space-y-1 text-sm">
          {users.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">user</span>
              <span className="text-foreground">{p.participant_id.slice(0, 8)}…</span>
              <span className="text-muted-foreground">({p.role})</span>
            </li>
          ))}
          {agents.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">agent</span>
              <span className="text-foreground">{p.participant_id}</span>
              <span className="text-muted-foreground">({p.role})</span>
            </li>
          ))}
          {participants.length === 0 && (
            <li className="text-muted-foreground">No participants yet.</li>
          )}
        </ul>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Topology</h4>
        <p className="mt-1 text-sm text-foreground">
          {conversation.conversation_topology ?? "T1"} — {conversation.conversation_topology === "T1" ? "Single user, single agent" : "Multi-party / delegated"}
        </p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Authorization & scope</h4>
        <p className="mt-1 text-sm text-foreground">
          {conversation.authorization_mode ?? "user_explicit"} · visibility: {conversation.visibility_mode ?? "full"}
        </p>
      </div>
    </div>
  );
}
