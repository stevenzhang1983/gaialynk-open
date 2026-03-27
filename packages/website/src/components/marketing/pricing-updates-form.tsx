"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

/** 與定價頁解耦；若再次掛載表單時請傳入對應語系文案。 */
export type PricingNotifyCopy = {
  formEmailLabel: string;
  formEmailPlaceholder: string;
  formSubmit: string;
  formSuccess: string;
  formError: string;
  formPrivacyBeforeLink: string;
  formPrivacyLinkLabel: string;
  formPrivacyAfterLink: string;
};

type PricingUpdatesFormProps = {
  locale: Locale;
  copy: PricingNotifyCopy;
};

export function PricingUpdatesForm({ locale, copy }: PricingUpdatesFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setStatus("error");
      setMessage(copy.formError);
      return;
    }

    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "waitlist",
        locale,
        name: "Pricing updates subscriber",
        email: trimmed,
        company: "-",
        useCase: "Pricing page: notify when public plans launch",
        source: "pricing_updates",
      }),
    });

    const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!res.ok || !result?.ok) {
      setStatus("error");
      setMessage(result?.error || copy.formError);
      return;
    }

    setStatus("success");
    setMessage(copy.formSuccess);
    setEmail("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="pricing-notify-email" className="mb-1 block text-sm font-medium text-foreground">
            {copy.formEmailLabel}
          </label>
          <input
            id="pricing-notify-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.formEmailPlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          />
        </div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "…" : copy.formSubmit}
        </button>
      </form>
      {message ? (
        <p
          className={`text-sm ${status === "success" ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      <p className="text-caption leading-relaxed text-muted-foreground">
        {copy.formPrivacyBeforeLink}{" "}
        <Link href={`/${locale}/privacy`} className="font-medium text-primary underline-offset-4 hover:underline">
          {copy.formPrivacyLinkLabel}
        </Link>
        {copy.formPrivacyAfterLink}
      </p>
    </div>
  );
}
