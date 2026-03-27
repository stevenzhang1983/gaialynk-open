"use client";

import type { W22DesktopConnectorCopy } from "@/content/i18n/product-experience";
import { DESKTOP_DEVICE_ONLINE_MS } from "@/lib/product/desktop-connector-constants";

export type DesktopDeviceRow = {
  id: string;
  device_name: string;
  status: string;
  paired_at: string | null;
  last_seen_at: string | null;
};

type DesktopDeviceListProps = {
  items: DesktopDeviceRow[];
  copy: W22DesktopConnectorCopy;
  revokingId: string | null;
  onUnpair: (id: string) => void;
};

function formatTs(iso: string | null | undefined, empty: string): string {
  if (!iso) return empty;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return empty;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(t);
  } catch {
    return iso;
  }
}

function isLikelyOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  const t = Date.parse(lastSeen);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < DESKTOP_DEVICE_ONLINE_MS;
}

export function DesktopDeviceList({ items, copy, revokingId, onUnpair }: DesktopDeviceListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyDevices}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <th className="px-3 py-2 font-semibold text-foreground">{copy.colDevice}</th>
            <th className="hidden px-3 py-2 font-semibold text-foreground sm:table-cell">
              {copy.colPairedAt}
            </th>
            <th className="hidden px-3 py-2 font-semibold text-foreground md:table-cell">
              {copy.colLastSeen}
            </th>
            <th className="px-3 py-2 font-semibold text-foreground">{copy.colStatus}</th>
            <th className="px-3 py-2 font-semibold text-foreground"> </th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const pending = row.status === "pending_pair";
            const online = !pending && isLikelyOnline(row.last_seen_at);
            return (
              <tr key={row.id} className="border-b border-border/80 last:border-0">
                <td className="px-3 py-2.5 font-medium text-foreground">{row.device_name}</td>
                <td className="hidden px-3 py-2.5 text-muted-foreground sm:table-cell">
                  {formatTs(row.paired_at, "—")}
                </td>
                <td className="hidden px-3 py-2.5 text-muted-foreground md:table-cell">
                  {formatTs(row.last_seen_at, "—")}
                </td>
                <td className="px-3 py-2.5">
                  {pending ? (
                    <span className="text-amber-700 dark:text-amber-200">{copy.pendingPair}</span>
                  ) : online ? (
                    <span className="text-emerald-700 dark:text-emerald-300">{copy.online}</span>
                  ) : (
                    <span className="text-muted-foreground">{copy.offline}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onUnpair(row.id)}
                    disabled={revokingId === row.id}
                    className="rounded-md border border-destructive/35 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {revokingId === row.id ? copy.unpairing : copy.unpair}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
