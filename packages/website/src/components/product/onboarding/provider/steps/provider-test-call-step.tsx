"use client";

import { useState } from "react";
import type { ProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
type Props = {
  copy: ProviderOnboardingCopy["test"];
  onTrigger: (message: string) => void;
  loading: boolean;
  outputText: string | null;
  error: string | null;
  onNext: () => void;
  onBack: () => void;
};

export function ProviderTestCallStep({ copy, onTrigger, loading, outputText, error, onNext, onBack }: Props) {
  const [message, setMessage] = useState(copy.defaultMessage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {copy.beforeTasksRun}
          <code className="rounded bg-muted px-1">tasks.run</code>
          {copy.afterTasksRun}
        </p>
      </div>

      <div>
        <label htmlFor="provider-test-message" className="mb-1 block text-sm font-medium text-foreground">
          {copy.messageLabel}
        </label>
        <textarea
          id="provider-test-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={copy.defaultMessage}
        />
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <button
          type="button"
          onClick={() => onTrigger(message.trim() || copy.defaultMessage)}
          disabled={loading}
          className="rounded-md border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 disabled:opacity-50"
        >
          {loading ? copy.calling : copy.runTest}
        </button>
      </div>

      {(outputText !== null || error) && (
        <div
          className={`rounded-xl border p-4 ${
            error ? "border-destructive/40 bg-destructive/10" : "border-border bg-surface"
          }`}
        >
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{copy.agentResponse}</p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground">{outputText}</pre>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110"
        >
          {copy.next}
        </button>
      </div>
    </div>
  );
}
