"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { getSpaceUiCopy } from "@/content/i18n/product-experience";
import type { SpacePresenceStatus } from "@/lib/product/presence-types";
import { PresenceDot } from "./presence-dot";

export type ChatParticipant = {
  participant_type: "user" | "agent";
  participant_id: string;
  role: string;
};

function initials(id: string): string {
  const clean = id.replace(/-/g, "");
  return clean.slice(0, 2).toUpperCase() || "?";
}

type ChatParticipantBarProps = {
  locale: Locale;
  conversationId: string;
  title: string;
  participants: ChatParticipant[];
  isGuestInSpace: boolean;
  /** W-6：归档/关闭会话只读 */
  readOnly?: boolean;
  onParticipantsChange?: () => void;
  /** W-16：Space 会话成员在线状态（user 参与者） */
  presenceByUserId?: Record<string, SpacePresenceStatus>;
  showPresenceDots?: boolean;
  presenceOnlineLabel?: string;
  presenceAwayLabel?: string;
  presenceOfflineLabel?: string;
};

/**
 * W-3：会话头部参与者头像 + 添加 Agent（guest 灰显 + tooltip）。
 */
export function ChatParticipantBar({
  locale,
  conversationId,
  title,
  participants,
  isGuestInSpace,
  readOnly = false,
  onParticipantsChange,
  presenceByUserId,
  showPresenceDots = false,
  presenceOnlineLabel = "Online",
  presenceAwayLabel = "Away",
  presenceOfflineLabel = "Offline",
}: ChatParticipantBarProps) {
  const copy = getSpaceUiCopy(locale);
  const [agentId, setAgentId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const handleAddAgent = useCallback(async () => {
    const id = agentId.trim();
    if (!id || adding || isGuestInSpace || readOnly) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch(`/api/mainline/conversations/${conversationId}/agents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agent_id: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(json?.error?.message ?? "Failed");
        return;
      }
      setAgentId("");
      onParticipantsChange?.();
    } catch {
      setAddError("Network error");
    } finally {
      setAdding(false);
    }
  }, [agentId, adding, conversationId, isGuestInSpace, readOnly, onParticipantsChange]);

  return (
    <header className="flex shrink-0 flex-col gap-2 border-b border-border bg-surface px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-foreground">{title || "Chat"}</h2>
        <div className="mt-1.5 flex flex-wrap items-center gap-1" aria-label={copy.participantsTitle}>
          {participants.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            participants.map((p) => {
              const presence =
                showPresenceDots && p.participant_type === "user"
                  ? (presenceByUserId?.[p.participant_id] ?? "offline")
                  : null;
              return (
                <span
                  key={`${p.participant_type}-${p.participant_id}`}
                  className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-muted/40 text-[10px] font-semibold text-foreground"
                  title={`${p.participant_type}: ${p.participant_id} (${p.role})`}
                >
                  {initials(p.participant_id)}
                  {presence ? (
                    <PresenceDot
                      status={presence}
                      onlineLabel={presenceOnlineLabel}
                      awayLabel={presenceAwayLabel}
                      offlineLabel={presenceOfflineLabel}
                    />
                  ) : null}
                </span>
              );
            })
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-2 sm:items-center">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 sm:flex-initial sm:max-w-[240px]">
          <input
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder={copy.addAgentIdPlaceholder}
            disabled={isGuestInSpace || readOnly}
            title={
              readOnly
                ? undefined
                : isGuestInSpace
                  ? copy.guestNoAddAgentTooltip
                  : undefined
            }
            className="min-w-[6rem] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          />
          <button
            type="button"
            disabled={isGuestInSpace || readOnly || adding || !agentId.trim()}
            title={
              readOnly
                ? undefined
                : isGuestInSpace
                  ? copy.guestNoAddAgentTooltip
                  : undefined
            }
            onClick={() => void handleAddAgent()}
            className="shrink-0 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            {adding ? "…" : copy.addAgentSubmit}
          </button>
        </div>
        <Link
          href={`/${locale}/app/agents`}
          className="text-xs font-medium text-primary hover:underline"
        >
          {copy.addAgentBrowse}
        </Link>
      </div>
      {addError && <p className="w-full text-xs text-destructive">{addError}</p>}
    </header>
  );
}
