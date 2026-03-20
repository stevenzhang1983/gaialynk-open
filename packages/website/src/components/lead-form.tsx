"use client";

import { useState, type FormEvent } from "react";
import { buildAnalyticsPayload } from "@/lib/analytics/events";
import { trackEvent } from "@/lib/analytics/track";
import type { Locale } from "@/lib/i18n/locales";
import type { LeadType } from "@/lib/leads/parse";

type LeadFormProps = {
  locale: Locale;
  type: LeadType;
  submitLabel: string;
};

export function LeadForm({ locale, type, submitLabel }: LeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type,
        locale,
        name,
        email,
        company,
        useCase,
        source: `${type}_form`,
      }),
    });

    const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (!response.ok || !result?.ok) {
      setStatus("error");
      setMessage(result?.error || "Submission failed.");
      return;
    }

    setStatus("success");
    setMessage("Submitted successfully.");

    trackEvent(
      type === "demo" ? "demo_submit" : "waitlist_submit",
      buildAnalyticsPayload({
        locale,
        page: type,
        referrer: "internal",
        cta_id: type === "demo" ? "demo_submit" : "waitlist_submit",
      }),
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Name</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span>Email</span>
          <input
            type="email"
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span>Company</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            required
          />
        </label>
        <label className="space-y-2 text-sm">
          <span>Use Case</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2"
            value={useCase}
            onChange={(event) => setUseCase(event.target.value)}
            required
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {status === "loading" ? "Submitting..." : submitLabel}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
