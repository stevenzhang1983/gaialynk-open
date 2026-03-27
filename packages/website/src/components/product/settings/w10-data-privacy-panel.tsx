"use client";

import { useMemo, useState } from "react";
import type { W10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";

export function W10DataPrivacyPanel({ copy }: { copy: W10SettingsSuiteCopy }) {
  const { userId, email, isAuthenticated } = useIdentity();
  const [confirm, setConfirm] = useState("");

  const mailHref = useMemo(() => {
    const subject = encodeURIComponent(copy.deleteMailSubject);
    const body = encodeURIComponent(
      `user_id: ${userId ?? "(unknown)"}\nemail: ${email ?? "(unknown)"}\n\n${copy.deleteMailSubject}`,
    );
    return `mailto:support@gaialynk.com?subject=${subject}&body=${body}`;
  }, [copy.deleteMailSubject, email, userId]);

  const canOpenMail = confirm.trim().toUpperCase() === "DELETE";

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.dataPrivacySection}</h2>
        <p className="mt-3 max-w-prose text-base leading-relaxed text-muted-foreground">{copy.dataPrivacyBody}</p>
        <p className="mt-4 text-sm text-muted-foreground">{copy.dataExportNote}</p>
      </section>

      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <h2 className="text-lg font-semibold tracking-tight text-destructive">{copy.deleteSection}</h2>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-muted-foreground">{copy.deleteLead}</p>
        <p className="mt-2 text-sm font-medium text-foreground">{copy.deleteCoolingNote}</p>

        {!isAuthenticated && (
          <p className="mt-4 text-sm text-muted-foreground">{copy.pleaseSignIn}</p>
        )}

        {isAuthenticated && (
          <div className="mt-6 space-y-3">
            <label className="block text-sm font-medium text-foreground">
              {copy.deleteConfirmLabel}
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={copy.deleteConfirmPlaceholder}
                autoComplete="off"
                className="mt-2 block w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-base text-foreground"
              />
            </label>
            {!canOpenMail && confirm.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400">{copy.deleteConfirmMismatch}</p>
            )}
            <a
              href={canOpenMail ? mailHref : undefined}
              aria-disabled={!canOpenMail}
              className={[
                "inline-flex rounded-md px-4 py-2 text-sm font-semibold",
                canOpenMail
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              ].join(" ")}
              onClick={(e) => {
                if (!canOpenMail) e.preventDefault();
              }}
            >
              {copy.deleteOpenMail}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
