"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import type { W9FirstRunCopy } from "@/content/i18n/product-experience";
import { fetchFirstRunAgentPicks } from "@/lib/product/first-run-agents";
import type { Agent } from "@/lib/product/agent-types";
import { AgentCard } from "@/components/product/agent-card";
import { usePanelFocus } from "@/components/product/context-panel/panel-focus-context";
import { getW15RbacUiCopy, getW18AgentLifecycleCopy } from "@/content/i18n/product-experience";

type Props = {
  locale: Locale;
  copy: W9FirstRunCopy;
  conversationId: string;
  userId: string | null;
  isGuest: boolean;
  readOnly: boolean;
  onConversationRefresh: () => void;
};

/**
 * W-9：空会话首屏——主叙事 + 3–5 张推荐 Agent + 弱连接器 CTA；无连接器/订阅为补充说明（不阻断）。
 */
export function ChatFirstRunEmpty({
  locale,
  copy,
  conversationId,
  userId,
  isGuest,
  readOnly,
  onConversationRefresh,
}: Props) {
  const { setFocus } = usePanelFocus();
  const w15 = getW15RbacUiCopy(locale);
  const w18 = getW18AgentLifecycleCopy(locale);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [connectorState, setConnectorState] = useState<"idle" | "empty" | "has" | "unknown">("idle");
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAgentsLoading(true);
      const list = await fetchFirstRunAgentPicks(5);
      if (!cancelled) {
        setAgents(list);
        setAgentsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setConnectorState("idle");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/mainline/connectors/authorizations?user_id=${encodeURIComponent(userId)}`,
          { cache: "no-store" },
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setConnectorState("unknown");
          return;
        }
        const rows = json.data;
        if (!Array.isArray(rows)) {
          setConnectorState("unknown");
          return;
        }
        setConnectorState(rows.length === 0 ? "empty" : "has");
      } catch {
        if (!cancelled) setConnectorState("unknown");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handlePick = useCallback(
    async (agent: Agent) => {
      if (isGuest || readOnly || !userId) return;
      setAddingId(agent.id);
      try {
        const res = await fetch(`/api/mainline/conversations/${conversationId}/agents`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ agent_id: agent.id }),
        });
        if (res.ok) {
          setFocus({ type: "agent", agent });
          onConversationRefresh();
        }
      } catch {
        /* ignore */
      } finally {
        setAddingId(null);
      }
    },
    [conversationId, isGuest, readOnly, userId, onConversationRefresh, setFocus],
  );

  const disableCards = isGuest || readOnly || !userId || Boolean(addingId);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-6">
      <header className="text-center sm:text-left">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{copy.title}</h2>
        <p className="mx-auto mt-3 max-w-[65ch] text-base leading-relaxed text-muted-foreground sm:mx-0">
          {copy.lead}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.inputHint}</p>
      </header>

      <section aria-labelledby="w9-recommended-heading" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 id="w9-recommended-heading" className="text-sm font-semibold text-foreground">
            {copy.recommendedHeading}
          </h3>
          <Link
            href={`/${locale}/app/agents`}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {copy.browseDirectory}
          </Link>
        </div>
        {agentsLoading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
            {agents.map((agent) => (
              <div key={agent.id} className="w-[min(100%,280px)] shrink-0">
                <div className={disableCards ? "pointer-events-none opacity-50" : ""}>
                  <AgentCard
                    agent={agent}
                    lifecycleCopy={w18}
                    onSelect={() => {
                      void handlePick(agent);
                    }}
                  />
                </div>
                {addingId === agent.id ? (
                  <p className="mt-1 text-center text-xs text-muted-foreground">{copy.addAgentLoading}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {isGuest ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.guestNoAdd}</p>
        ) : null}
        {readOnly ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.readOnlyHint}</p>
        ) : null}
      </section>

      <div className="space-y-2 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
        {connectorState === "empty" ? <p>{copy.noConnectorHint}</p> : null}
        {connectorState === "unknown" ? <p>{copy.connectorUnknownHint}</p> : null}
        <p>{copy.subscriptionHint}</p>
        {isGuest ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{w15.guestConnectorBanner}</p>
        ) : (
          <Link
            href={`/${locale}/app/connectors-governance`}
            className="inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            {copy.connectorCta}
          </Link>
        )}
      </div>
    </div>
  );
}
