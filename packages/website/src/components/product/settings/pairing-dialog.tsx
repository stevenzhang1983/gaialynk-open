"use client";

import { useCallback, useId, useState } from "react";
import type { W22DesktopConnectorCopy } from "@/content/i18n/product-experience";
import type { Locale } from "@/lib/i18n/locales";

type PairingDialogProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  copy: W22DesktopConnectorCopy;
  onPaired: () => void;
};

export function PairingDialog({ open, onClose, copy, onPaired }: PairingDialogProps) {
  const titleId = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setCode("");
    setError("");
    setSubmitting(false);
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  if (!open) {
    return null;
  }

  async function submit() {
    const digits = code.replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) {
      setError(copy.pairingInvalid);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/mainline/connectors/desktop/pair", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pairing_code: digits }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof json?.error?.message === "string" ? json.error.message : copy.pairingFailed,
        );
        return;
      }
      onPaired();
      close();
    } catch {
      setError(copy.pairingFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {copy.pairingDialogTitle}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.pairingDialogLead}</p>
        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="gl-pairing-code">
          {copy.pairingCodeLabel}
        </label>
        <input
          id="gl-pairing-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-lg tracking-[0.2em] tabular-nums text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/40"
          placeholder="000000"
        />
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {copy.pairingCancel}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting || code.replace(/\D/g, "").length !== 6}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? copy.pairingSubmitting : copy.pairingSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
