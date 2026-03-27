"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { W21ModerationCopy } from "@/content/i18n/product-experience";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

type HideMessageDialogProps = {
  open: boolean;
  messageId: string | null;
  copy: W21ModerationCopy;
  onClose: () => void;
  onSuccessToast: (message: string) => void;
};

/**
 * W-21：Space owner/admin 隐藏消息。
 */
export function HideMessageDialog({ open, messageId, copy, onClose, onSuccessToast }: HideMessageDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
      setSubmitting(false);
      return;
    }
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !messageId) return null;

  const confirmHide = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/mainline/messages/${encodeURIComponent(messageId)}/hide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: "{}",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
      if (res.ok) {
        onSuccessToast(copy.hideSuccess);
        onClose();
        return;
      }
      setError(json.error?.message ?? copy.hideError);
    } catch {
      setError(copy.hideError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {copy.hideTitle}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.hideLead}</p>
        {error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-base font-medium hover:bg-muted"
            onClick={onClose}
          >
            {copy.hideCancel}
          </button>
          <button
            type="button"
            className="rounded-md bg-destructive px-4 py-2 text-base font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting}
            onClick={() => void confirmHide()}
          >
            {submitting ? "…" : copy.hideConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
