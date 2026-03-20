"use client";

import { useCallback, useEffect, useState } from "react";

/** T-5.6 GET /api/v1/receipts/:id 返回的 data 形状 */
type Receipt = {
  id: string;
  audit_event_id: string;
  conversation_id: string;
  receipt_type: string;
  payload_hash: string;
  signature: string;
  signer: string;
  issued_at: string;
  prev_receipt_hash?: string;
};

type ReceiptContextProps = {
  receiptId: string;
};

/**
 * T-4.4 收据视图：收据详情、签名验证、关联审计事件。
 * 对接 T-5.6 GET /api/mainline/receipts/:id（含 meta.is_valid）与 GET /api/mainline/receipts/:id/verify。
 */
export function ReceiptContext({ receiptId }: ReceiptContextProps) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/mainline/receipts/${receiptId}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.data) {
        setReceipt(json.data);
        setVerified(json.meta?.is_valid ?? null);
      } else {
        const verifyRes = await fetch(`/api/mainline/receipts/${receiptId}/verify`, { cache: "no-store" });
        const verifyJson = await verifyRes.json().catch(() => ({}));
        if (verifyRes.ok && verifyJson.data) {
          setReceipt({ id: receiptId } as Receipt);
          setVerified(verifyJson.data.is_valid === true);
        } else {
          setReceipt(null);
          setVerified(null);
          if (!verifyRes.ok && verifyJson?.error?.message) {
            setError(verifyJson.error.message);
          }
        }
      }
    } catch {
      setReceipt(null);
      setVerified(null);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Loading receipt…</p>
      </div>
    );
  }

  if (error && !receipt) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Receipt</h3>
        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{receiptId}</p>
      </div>

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Signature verification</h4>
        <p className="mt-1 text-sm text-foreground">
          {verified === true ? (
            <span className="text-emerald-600">Verified</span>
          ) : verified === false ? (
            <span className="text-amber-600">Unverified</span>
          ) : receipt?.signature ? (
            <code className="rounded bg-muted px-1 text-[10px]">{receipt.signature.slice(0, 20)}…</code>
          ) : (
            "—"
          )}
        </p>
      </div>

      {receipt?.signer && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground">Signer</h4>
          <p className="mt-1 text-sm font-mono text-foreground">{receipt.signer}</p>
        </div>
      )}

      {receipt?.issued_at && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground">Issued</h4>
          <p className="mt-1 text-sm text-foreground">
            {new Date(receipt.issued_at).toLocaleString()}
          </p>
        </div>
      )}

      {receipt?.receipt_type && (
        <div>
          <h4 className="text-xs font-medium text-muted-foreground">Type</h4>
          <p className="mt-1 text-sm text-foreground">{receipt.receipt_type}</p>
        </div>
      )}

      <div>
        <h4 className="text-xs font-medium text-muted-foreground">Related audit event</h4>
        {receipt?.audit_event_id ? (
          <p className="mt-1 font-mono text-xs text-foreground">{receipt.audit_event_id}</p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  );
}
