"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { W21ModerationCopy } from "@/content/i18n/product-experience";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

type ReportDialogProps = {
  open: boolean;
  messageId: string | null;
  copy: W21ModerationCopy;
  onClose: () => void;
  onSuccessToast: (message: string) => void;
};

/**
 * W-21：举报用户消息（POST BFF → 主线 `/messages/:id/report`）。
 */
export function ReportDialog({ open, messageId, copy, onClose, onSuccessToast }: ReportDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [reason, setReason] = useState(copy.reportReasons[0]?.value ?? "other");
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setReason(copy.reportReasons[0]?.value ?? "other");
      setDetail("");
      setError("");
      setSubmitting(false);
      return;
    }
    const t = window.setTimeout(() => {
      const root = panelRef.current;
      const first = root?.querySelector<HTMLElement>(FOCUSABLE);
      first?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open, copy.reportReasons]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute("disabled"),
      );
      if (focusables.length === 0) return;
      const i = focusables.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey) {
        if (i <= 0) {
          e.preventDefault();
          focusables[focusables.length - 1]?.focus();
        }
      } else if (i === focusables.length - 1) {
        e.preventDefault();
        focusables[0]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = useCallback(async () => {
    if (!messageId || !reason.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/mainline/messages/${encodeURIComponent(messageId)}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reason: reason.trim(),
          detail: detail.trim() ? detail.trim() : null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string };
      };
      if (res.ok) {
        onSuccessToast(copy.reportSuccess);
        onClose();
        return;
      }
      const code = json.error?.code;
      if (code === "already_reported") setError(copy.reportErrorAlready);
      else if (code === "not_group_conversation") setError(copy.reportErrorNotGroup);
      else if (code === "report_not_applicable" || code === "message_not_reportable") {
        setError(copy.reportErrorNotApplicable);
      } else setError(json.error?.message ?? copy.reportErrorGeneric);
    } catch {
      setError(copy.reportErrorGeneric);
    } finally {
      setSubmitting(false);
    }
  }, [messageId, reason, detail, copy, onClose, onSuccessToast]);

  if (!open || !messageId) return null;

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
          {copy.reportTitle}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.reportLead}</p>
        <label className="mt-4 block text-sm font-medium text-foreground" htmlFor="gl-report-reason">
          {copy.reasonLabel}
        </label>
        <select
          id="gl-report-reason"
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {copy.reportReasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <label className="mt-3 block text-sm font-medium text-foreground" htmlFor="gl-report-detail">
          {copy.detailLabel}{" "}
          <span className="font-normal text-muted-foreground">({copy.detailOptional})</span>
        </label>
        <textarea
          id="gl-report-detail"
          rows={3}
          maxLength={2000}
          placeholder={copy.detailPlaceholder}
          className="mt-1 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-4 py-2 text-base font-medium hover:bg-muted"
            onClick={onClose}
          >
            {copy.cancel}
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-base font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            disabled={submitting || !reason.trim()}
            onClick={() => void submit()}
          >
            {submitting ? "…" : copy.submitReport}
          </button>
        </div>
      </div>
    </div>
  );
}
