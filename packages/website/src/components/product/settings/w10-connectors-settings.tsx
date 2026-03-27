"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { W10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import { getW17NotionConnectorCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";
import { useIdentity } from "@/lib/identity/context";
import { NotionConnectorCard } from "./notion-connector-card";
import { DesktopConnectorCard } from "./desktop-connector-card";
import { getW22DesktopConnectorCopy } from "@/content/i18n/product-experience";

type AuthRow = {
  id: string;
  connector: string;
  provider?: string | null;
  scope_level?: string;
  scope_value?: string;
  status: string;
  expires_at?: string;
  created_at?: string;
  oauth_workspace_name?: string | null;
};

export function W10ConnectorsSettingsPanel({ locale, copy }: { locale: Locale; copy: W10SettingsSuiteCopy }) {
  const w22 = getW22DesktopConnectorCopy(locale);
  const notionUi = getW17NotionConnectorCopy(locale);
  const { userId, isAuthenticated, isLoading } = useIdentity();
  const [rows, setRows] = useState<AuthRow[]>([]);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoadingList(true);
    setError("");
    try {
      const res = await fetch(
        `/api/mainline/connectors/authorizations?user_id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message ?? copy.connectorLoadError);
        setRows([]);
        return;
      }
      const list = Array.isArray(json?.data) ? json.data : [];
      setRows(list as AuthRow[]);
    } catch {
      setError(copy.connectorLoadError);
      setRows([]);
    } finally {
      setLoadingList(false);
    }
  }, [userId, copy.connectorLoadError]);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    void load();
  }, [isAuthenticated, userId, load]);

  async function revoke(id: string) {
    if (!userId) return;
    setRevoking(id);
    setError("");
    try {
      const res = await fetch(`/api/mainline/connectors/authorizations/${encodeURIComponent(id)}/revoke`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actor_id: userId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message ?? copy.connectorLoadError);
        return;
      }
      await load();
    } catch {
      setError(copy.connectorLoadError);
    } finally {
      setRevoking(null);
    }
  }

  if (isLoading) {
    return <p className="text-base text-muted-foreground">{copy.loadingIdentity}</p>;
  }

  if (!isAuthenticated) {
    return <p className="text-base text-muted-foreground">{copy.pleaseSignIn}</p>;
  }

  const notionRow =
    rows.find((r) => r.connector === "notion" && r.status === "active") ?? null;
  const rowsForList = rows.filter((row) => !(row.connector === "notion" && row.status === "active"));

  return (
    <div className="space-y-4">
      <DesktopConnectorCard locale={locale} copy={w22} listLoading={copy.listLoading} />
      {userId ? (
        <NotionConnectorCard
          locale={locale}
          copy={notionUi}
          userId={userId}
          notionAuth={notionRow}
          onRefresh={load}
        />
      ) : null}
      <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{copy.connectorsLead}</p>
      <Link
        href={`/${locale}/app/connectors-governance`}
        className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        {copy.connectorsGovernanceLink}
      </Link>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {loadingList && <p className="text-sm text-muted-foreground">{copy.listLoading}</p>}

      {!loadingList && rowsForList.length === 0 && !notionRow && !error && (
        <p className="text-base text-muted-foreground">{copy.connectorEmpty}</p>
      )}

      {rowsForList.length > 0 && (
        <ul className="space-y-3">
          {rowsForList.map((row) => {
            const active = row.status === "active";
            return (
              <li
                key={row.id}
                className="rounded-xl border border-border bg-card p-4 text-base"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-foreground">{row.connector}</p>
                    <p className="text-sm text-muted-foreground">
                      {copy.connectorProvider}: {row.provider ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {copy.connectorScope}: {row.scope_level ?? "—"} / {row.scope_value ?? "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {copy.connectorStatus}:{" "}
                      <span className="font-medium text-foreground">
                        {active ? copy.statusActive : copy.statusRevoked}
                      </span>
                    </p>
                    {row.expires_at && (
                      <p className="text-sm text-muted-foreground">
                        {copy.connectorExpires}:{" "}
                        <span className="font-mono tabular-nums">{row.expires_at}</span>
                      </p>
                    )}
                  </div>
                  {active && (
                    <button
                      type="button"
                      onClick={() => void revoke(row.id)}
                      disabled={revoking === row.id}
                      className="shrink-0 rounded-md border border-destructive/40 px-3 py-1.5 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {revoking === row.id ? copy.connectorRevoking : copy.connectorRevoke}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
