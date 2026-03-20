"use client";

import { useState, useEffect } from "react";

type L3Item = {
  audit_event_id: string;
  timestamp: string;
  event_type: string;
  policy_hit: string;
  reason_codes: string[];
  receipt_refs: string[];
  signature_digest?: string;
};

export function EvidenceL3View() {
  const [items, setItems] = useState<L3Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch("/api/mainline/a2a/visualization/l3?mode=mock&window_days=7&limit=20")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.data?.items && Array.isArray(data.data.items)) {
          setItems(data.data.items);
        } else if (data?.error) {
          setError(data.error.message ?? "Request failed");
        } else {
          setItems([]);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Network error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading L3 evidence…</p>;
  if (error) return <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No L3 evidence items in this window. Try mock mode or run mainline with events.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="p-3 font-medium text-foreground">Event ID</th>
            <th className="p-3 font-medium text-foreground">Timestamp</th>
            <th className="p-3 font-medium text-foreground">Type</th>
            <th className="p-3 font-medium text-foreground">Policy hit</th>
            <th className="p-3 font-medium text-foreground">Reason codes</th>
            <th className="p-3 font-medium text-foreground">Receipt refs</th>
            <th className="p-3 font-medium text-foreground">Signature</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.audit_event_id} className="border-b border-border last:border-0">
              <td className="p-3 font-mono text-xs text-muted-foreground">{row.audit_event_id.slice(0, 8)}…</td>
              <td className="p-3 text-muted-foreground">{row.timestamp}</td>
              <td className="p-3 text-foreground">{row.event_type}</td>
              <td className="p-3 text-muted-foreground">{row.policy_hit}</td>
              <td className="p-3 text-muted-foreground">{Array.isArray(row.reason_codes) ? row.reason_codes.join(", ") : "—"}</td>
              <td className="p-3 text-muted-foreground">{Array.isArray(row.receipt_refs) ? row.receipt_refs.join(", ") : "—"}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{row.signature_digest ? `${row.signature_digest.slice(0, 12)}…` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
