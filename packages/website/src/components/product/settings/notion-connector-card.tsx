"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { W17NotionConnectorCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

const OAUTH_MESSAGE_TYPE = "gaialynk_connector_oauth";

type AuthRow = {
  id: string;
  connector: string;
  status: string;
  created_at?: string;
  oauth_workspace_name?: string | null;
};

type NotionConnectorCardProps = {
  locale: Locale;
  copy: W17NotionConnectorCopy;
  userId: string;
  /** Active Notion cloud row if any */
  notionAuth: AuthRow | null;
  onRefresh: () => Promise<void>;
};

export function NotionConnectorCard({ locale, copy, userId, notionAuth, onRefresh }: NotionConnectorCardProps) {
  const [oauthBusy, setOauthBusy] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);

  const connected = Boolean(notionAuth && notionAuth.status === "active");

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; connector?: string; status?: string } | null;
      if (!d || d.type !== OAUTH_MESSAGE_TYPE || d.connector !== "notion") return;
      setOauthBusy(false);
      if (d.status === "connected") {
        setBanner(null);
        void onRefresh();
        try {
          popupRef.current?.close();
        } catch {
          /* ignore */
        }
        popupRef.current = null;
      } else if (d.status === "error") {
        setBanner(copy.oauthFailed);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [copy.oauthFailed, onRefresh]);

  const startOAuth = useCallback(() => {
    setBanner(null);
    const q = new URLSearchParams({ ui_locale: locale });
    const url = `/api/mainline/connectors/notion/authorize?${q.toString()}`;
    setOauthBusy(true);
    const w = window.open(url, "gl_notion_oauth", "width=520,height=720,noopener,noreferrer");
    popupRef.current = w;
    if (!w) {
      setOauthBusy(false);
      setBanner(copy.oauthPopupBlocked);
      return;
    }
    w.focus();
  }, [copy.oauthPopupBlocked, locale]);

  const disconnect = useCallback(async () => {
    if (!notionAuth?.id) return;
    setRevoking(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/mainline/connectors/authorizations/${encodeURIComponent(notionAuth.id)}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBanner(json?.error?.message ?? copy.revokeFailed);
        return;
      }
      await onRefresh();
    } catch {
      setBanner(copy.revokeFailed);
    } finally {
      setRevoking(false);
    }
  }, [copy.revokeFailed, notionAuth?.id, onRefresh, userId]);

  const workspace =
    (notionAuth?.oauth_workspace_name && notionAuth.oauth_workspace_name.trim()) || copy.workspaceFallback;
  const connectedAt =
    notionAuth?.created_at &&
    (() => {
      try {
        return new Date(notionAuth.created_at).toLocaleString(
          locale === "en" ? "en-US" : locale === "zh-Hant" ? "zh-TW" : "zh-CN",
          { dateStyle: "medium", timeStyle: "short" },
        );
      } catch {
        return notionAuth.created_at;
      }
    })();

  return (
    <div
      className="rounded-xl border border-border bg-card p-4 text-base shadow-sm"
      lang={locale}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground/5 text-lg font-bold text-foreground">
          N
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{copy.cardTitle}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                connected ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-muted text-muted-foreground"
              }`}
            >
              {connected ? copy.connected : copy.notConnected}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.cardDescription}</p>
          {connected ? (
            <div className="space-y-0.5 pt-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{copy.workspaceLabel}: </span>
                {workspace}
              </p>
              {connectedAt ? (
                <p>
                  <span className="font-medium text-foreground">{copy.connectedAtLabel}: </span>
                  <span className="font-mono tabular-nums">{connectedAt}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:items-end">
          {connected ? (
            <button
              type="button"
              onClick={() => void disconnect()}
              disabled={revoking}
              className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              {revoking ? "…" : copy.disconnect}
            </button>
          ) : (
            <button
              type="button"
              onClick={startOAuth}
              disabled={oauthBusy}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {oauthBusy ? copy.oauthOpening : copy.connect}
            </button>
          )}
        </div>
      </div>
      {banner ? <p className="mt-3 text-sm text-destructive">{banner}</p> : null}
    </div>
  );
}
