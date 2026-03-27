"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { W22DesktopConnectorCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";
import {
  DESKTOP_CONNECTOR_RELEASES_URL,
  DESKTOP_DEVICE_ONLINE_MS,
} from "@/lib/product/desktop-connector-constants";
import { DesktopDeviceList, type DesktopDeviceRow } from "./desktop-device-list";
import { PairingDialog } from "./pairing-dialog";

type DesktopConnectorCardProps = {
  locale: Locale;
  copy: W22DesktopConnectorCopy;
  listLoading: string;
};

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

function isLikelyOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const t = Date.parse(lastSeen);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < DESKTOP_DEVICE_ONLINE_MS;
}

export function DesktopConnectorCard({ locale, copy, listLoading }: DesktopConnectorCardProps) {
  const narrow = useNarrowViewport();
  const [items, setItems] = useState<DesktopDeviceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pairOpen, setPairOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mainline/connectors/desktop/devices", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json?.error?.message === "string" ? json.error.message : copy.loadError);
        setItems([]);
        return;
      }
      const raw = json?.data?.items;
      setItems(Array.isArray(raw) ? (raw as DesktopDeviceRow[]) : []);
    } catch {
      setError(copy.loadError);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (narrow) setPairOpen(false);
  }, [narrow]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  async function unpair(id: string) {
    setRevoking(id);
    try {
      const res = await fetch(`/api/mainline/connectors/desktop/devices/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(typeof json?.error?.message === "string" ? json.error.message : copy.loadError);
        return;
      }
      await load();
    } catch {
      setError(copy.loadError);
    } finally {
      setRevoking(null);
    }
  }

  const hasActive = items.some((r) => r.status === "active");
  const hasPending = items.some((r) => r.status === "pending_pair");
  const anyOnline = items.some(
    (r) => r.status === "active" && isLikelyOnline(r.last_seen_at),
  );

  let statusLine = copy.statusNotPaired;
  if (hasPending && !hasActive) {
    statusLine = copy.statusAwaitingConnector;
  } else if (hasActive) {
    statusLine = anyOnline ? copy.statusConnected : copy.statusDisconnected;
  }

  const releases = DESKTOP_CONNECTOR_RELEASES_URL;

  return (
    <section
      className={`rounded-xl border border-border bg-card p-4 ${narrow ? "opacity-60" : ""}`}
      aria-label={copy.sectionTitle}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{copy.sectionTitle}</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            {copy.sectionLead}
          </p>
        </div>
      </div>

      {narrow ? (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          {copy.mobileOnlyHint}
        </p>
      ) : null}

      <p className="mt-3 text-sm font-medium text-foreground">{statusLine}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={releases}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {copy.downloadMac}
        </a>
        <a
          href={releases}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {copy.downloadWin}
        </a>
        <Link
          href={`/${locale}/help#article-how-to-install-pair-desktop-connector`}
          className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {copy.pairingDialogTitle} →
        </Link>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{copy.releasesNote}</p>

      {!narrow ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPairOpen(true)}
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
            >
              {copy.pairNewDevice}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              {copy.listRefresh}
            </button>
          </div>
          {toast ? <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">{toast}</p> : null}
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
          {loading ? <p className="mt-2 text-sm text-muted-foreground">{listLoading}</p> : null}
          <h3 className="mt-5 text-base font-semibold text-foreground">{copy.listTitle}</h3>
          <div className="mt-2">
            <DesktopDeviceList
              items={items}
              copy={copy}
              revokingId={revoking}
              onUnpair={(id) => void unpair(id)}
            />
          </div>
        </>
      ) : null}

      <PairingDialog
        open={pairOpen}
        onClose={() => setPairOpen(false)}
        locale={locale}
        copy={copy}
        onPaired={() => {
          setToast(copy.pairingSuccess);
          void load();
        }}
      />
    </section>
  );
}
