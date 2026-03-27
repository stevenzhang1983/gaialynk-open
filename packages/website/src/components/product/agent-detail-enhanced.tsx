"use client";

import { useState } from "react";
import type { W18AgentLifecycleCopy } from "@/content/i18n/product-experience";

export type AgentLifecycleDetailFields = {
  current_version?: string | null;
  listing_status?: string | null;
  changelog?: Array<{
    version: string;
    summary: string;
    breaking?: boolean;
    created_at?: string;
  }>;
};

type AgentLifecyclePanelProps = {
  detail: AgentLifecycleDetailFields | null;
  copy: W18AgentLifecycleCopy;
};

function listingLabel(status: string | undefined, copy: W18AgentLifecycleCopy): string | null {
  if (status === "maintenance") return copy.listingMaintenance;
  if (status === "delisted") return copy.listingDelisted;
  if (status === "listed" || !status) return null;
  return copy.listingListed;
}

/**
 * W-18：详情侧栏中的版本、changelog、上架状态提示（数据来自 GET /agents/:id）。
 */
export function AgentLifecyclePanel({ detail, copy }: AgentLifecyclePanelProps) {
  const [changelogOpen, setChangelogOpen] = useState(false);
  if (!detail) return null;

  const ls = detail.listing_status ?? "listed";
  const listNote = listingLabel(ls, copy);
  const changelog = Array.isArray(detail.changelog) ? detail.changelog : [];
  const version = detail.current_version?.trim() || "—";

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {listNote && ls === "maintenance" && (
        <div className="rounded-lg border border-amber-500/45 bg-amber-500/[0.08] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
          {copy.maintenanceBanner}
        </div>
      )}
      {ls === "delisted" && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {copy.delistedCardHint}
        </div>
      )}
      <div>
        <h4 className="text-xs font-medium text-muted-foreground">{copy.versionLabel}</h4>
        <p className="mt-1 font-mono text-sm text-foreground">{version}</p>
        {listNote ? (
          <p className="mt-1 text-[0.6875rem] font-medium text-foreground/80">
            <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5">{listNote}</span>
          </p>
        ) : null}
      </div>
      <div>
        <button
          type="button"
          onClick={() => setChangelogOpen((o) => !o)}
          className="flex w-full items-center justify-between text-left text-xs font-medium text-muted-foreground hover:text-foreground"
          aria-expanded={changelogOpen}
        >
          <span>{copy.changelogTitle}</span>
          <span className="tabular-nums text-[10px]">{changelogOpen ? "−" : "+"}</span>
        </button>
        {changelogOpen && (
          <ul className="mt-2 space-y-2 border-l border-border pl-3">
            {changelog.length === 0 ? (
              <li className="text-xs text-muted-foreground">{copy.changelogEmpty}</li>
            ) : (
              [...changelog]
                .reverse()
                .map((entry, i) => (
                  <li key={`${entry.version}-${i}`} className="text-xs leading-relaxed">
                    <span className="font-mono font-medium text-foreground">{entry.version}</span>
                    {entry.breaking ? (
                      <span className="ml-2 rounded bg-rose-500/15 px-1 py-0.5 text-[10px] font-medium text-rose-800 dark:text-rose-200">
                        {copy.breakingTag}
                      </span>
                    ) : null}
                    {entry.created_at ? (
                      <span className="ml-2 tabular-nums text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    ) : null}
                    <p className="mt-0.5 text-muted-foreground">{entry.summary}</p>
                  </li>
                ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

type AgentListingBadgesProps = {
  listingStatus?: string | null;
  copy: W18AgentLifecycleCopy;
};

/** 智能体中心卡片角标：维护中 / 已下架 */
export function AgentListingBadges({ listingStatus, copy }: AgentListingBadgesProps) {
  if (listingStatus === "maintenance") {
    return (
      <span className="shrink-0 rounded-md border border-amber-500/50 bg-amber-500/12 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">
        {copy.listingMaintenance}
      </span>
    );
  }
  if (listingStatus === "delisted") {
    return (
      <span className="shrink-0 rounded-md border border-zinc-400/50 bg-zinc-500/10 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
        {copy.listingDelisted}
      </span>
    );
  }
  return null;
}
