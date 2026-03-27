"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { W8NotificationCenterCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";
import type { NotificationListItem, NotificationListResponse } from "@/lib/product/notification-api-types";
import { mapMainlineDeepLinkToProductHref } from "@/lib/product/notification-deep-link";
import { notificationRowSummary } from "@/lib/product/notification-summary";

type Props = {
  locale: Locale;
  copy: W8NotificationCenterCopy;
};

function typeLabel(item: NotificationListItem, c: W8NotificationCenterCopy): string {
  switch (item.type) {
    case "review_required":
      return c.typeReviewRequired;
    case "task_completed":
      return c.typeTaskCompleted;
    case "connector_expiring":
      return c.typeConnectorExpiring;
    case "quota_warning":
      return c.typeQuotaWarning;
    case "agent_status_change":
      return c.typeAgentStatus;
    default:
      return c.typeLegacy;
  }
}

function formatRelativeTime(iso: string, now: number, c: W8NotificationCenterCopy): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return c.justNow;
  if (m < 60) return c.minutesAgo.replace("{{n}}", String(m));
  const h = Math.floor(m / 60);
  if (h < 48) return c.hoursAgo.replace("{{n}}", String(h));
  const d = Math.floor(h / 24);
  return c.daysAgo.replace("{{n}}", String(d));
}

function TypeGlyph({ type }: { type: NotificationListItem["type"] }) {
  const common = "h-4 w-4 shrink-0";
  switch (type) {
    case "review_required":
      return (
        <span className={`${common} text-amber-600`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
          </svg>
        </span>
      );
    case "task_completed":
      return (
        <span className={`${common} text-emerald-600`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    case "connector_expiring":
      return (
        <span className={`${common} text-sky-600`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path d="M14.828 14.828a4 4 0 015.656 0 4 4 0 010 5.656l-4 4a4 4 0 01-5.656 0" />
          </svg>
        </span>
      );
    case "quota_warning":
      return (
        <span className={`${common} text-orange-600`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M12 2L2 22h20L12 2z" strokeLinecap="round" />
          </svg>
        </span>
      );
    case "agent_status_change":
      return (
        <span className={`${common} text-violet-600`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      );
    default:
      return (
        <span className={`${common} text-muted-foreground`} aria-hidden>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </span>
      );
  }
}

export function NotificationCenter({ locale, copy }: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/mainline/notifications?limit=1", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as NotificationListResponse;
      if (res.ok && typeof json.meta?.unread_count === "number") {
        setUnread(json.meta.unread_count);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mainline/notifications?limit=30", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as NotificationListResponse;
      if (!res.ok) {
        setError(json.error?.message ?? copy.loadError);
        setItems([]);
        return;
      }
      const list = json.data?.items ?? [];
      setItems(list);
      if (typeof json.meta?.unread_count === "number") {
        setUnread(json.meta.unread_count);
      }
    } catch {
      setError(copy.loadError);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    void refreshUnread();
    const id = window.setInterval(() => void refreshUnread(), 60000);
    return () => window.clearInterval(id);
  }, [refreshUnread]);

  useEffect(() => {
    const onFocus = () => void refreshUnread();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUnread]);

  useEffect(() => {
    if (!open) return;
    void loadList();
    const id = window.setInterval(() => setNowTick(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, [open, loadList]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const onMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/mainline/notifications/read-all", { method: "POST" });
      if (res.ok) {
        await loadList();
        await refreshUnread();
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const onRowActivate = async (item: NotificationListItem) => {
    if (!item.read_at) {
      try {
        await fetch(`/api/mainline/notifications/${encodeURIComponent(item.id)}/read`, { method: "POST" });
        setUnread((u) => Math.max(0, u - 1));
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, read_at: new Date().toISOString() } : x)),
        );
      } catch {
        /* still navigate */
      }
    }
    const href = mapMainlineDeepLinkToProductHref(locale, item.deep_link);
    setOpen(false);
    if (href) {
      router.push(href);
    }
  };

  const badge =
    unread > 0 ? (
      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground tabular-nums">
        {unread > 99 ? "99+" : unread}
        <span className="sr-only"> {copy.unreadBadgeSuffix}</span>
      </span>
    ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="relative rounded p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={copy.bellAria}
        onClick={() => setOpen((o) => !o)}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {badge}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-border bg-card shadow-lg"
          role="dialog"
          aria-label={copy.panelTitle}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
            <h2 className="text-base font-semibold leading-tight text-foreground">{copy.panelTitle}</h2>
            <button
              type="button"
              disabled={markingAll || unread === 0}
              onClick={() => void onMarkAllRead()}
              className="text-xs font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-40"
            >
              {markingAll ? copy.markingAll : copy.markAllRead}
            </button>
          </div>
          <div className="max-h-[min(70vh,24rem)] overflow-y-auto overscroll-y-contain">
            {loading && items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">{copy.markingAll}</p>
            ) : error ? (
              <div className="space-y-2 px-3 py-6 text-center">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => void loadList()}
                >
                  {copy.retry}
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-base leading-relaxed text-muted-foreground">{copy.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const unreadRow = !item.read_at;
                  const summary = notificationRowSummary(item, locale);
                  const rel = formatRelativeTime(item.created_at, nowTick, copy);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => void onRowActivate(item)}
                        className={`flex w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 ${
                          unreadRow ? "bg-primary/5" : ""
                        }`}
                      >
                        <TypeGlyph type={item.type} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {typeLabel(item, copy)}
                            </span>
                            <time
                              className="shrink-0 text-xs tabular-nums text-muted-foreground"
                              dateTime={item.created_at}
                            >
                              {rel}
                            </time>
                          </div>
                          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-foreground">{summary}</p>
                          {unreadRow ? (
                            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
