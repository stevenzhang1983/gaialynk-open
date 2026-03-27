"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIdentity } from "@/lib/identity/context";
import { getSpaceUiCopy } from "@/content/i18n/product-experience";
import { useSpace } from "@/components/product/space-context";

/**
 * W-3：顶栏 Space 切换 + 创建团队 Space（下拉）。
 */
export function SpaceSwitcher() {
  const { isAuthenticated } = useIdentity();
  const { locale, spaces, loading, currentSpace, setCurrentSpaceId, refreshSpaces } = useSpace();
  const copy = getSpaceUiCopy(locale);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const handleCreateTeam = useCallback(async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/mainline/spaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, type: "team" }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.data?.id) {
        setNewName("");
        setShowCreate(false);
        setOpen(false);
        await refreshSpaces();
        setCurrentSpaceId(json.data.id as string);
      }
    } finally {
      setCreating(false);
    }
  }, [creating, newName, refreshSpaces, setCurrentSpaceId]);

  if (!isAuthenticated) {
    return null;
  }

  const label = loading ? "…" : currentSpace?.name ?? copy.spaceSwitcherAria;

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-[200px] sm:max-w-[240px]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full max-w-full items-center gap-2 rounded-md border border-border bg-surface-raised px-2.5 py-1.5 text-left text-xs font-medium text-foreground hover:border-primary/40"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={copy.spaceSwitcherAria}
      >
        <span className="truncate">{label}</span>
        <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-[min(100vw-2rem,280px)] rounded-lg border border-border bg-card py-1 shadow-elevated"
          role="listbox"
        >
          <ul className="max-h-56 overflow-auto py-0.5">
            {spaces.map((s) => (
              <li key={s.id} role="option" aria-selected={s.id === currentSpace?.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentSpaceId(s.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                    s.id === currentSpace?.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className="truncate">{s.name}</span>
                  <span className="ml-auto shrink-0 text-[10px] uppercase text-muted-foreground">{s.type}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-2">
            {!showCreate ? (
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-primary hover:bg-muted/50"
              >
                + {copy.createTeamSpace}
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={copy.teamSpaceNamePlaceholder}
                  className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                />
                <button
                  type="button"
                  disabled={creating || !newName.trim()}
                  onClick={() => void handleCreateTeam()}
                  className="rounded-md bg-primary px-2 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {creating ? copy.teamSpaceCreating : copy.teamSpaceCreate}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
