"use client";

import type { ProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
import type { ProviderAgent } from "@/lib/product/provider-agent-types";

type Props = {
  copy: ProviderOnboardingCopy["submit"];
  agent: ProviderAgent;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
  onBack: () => void;
};

export function ProviderSubmitStep({ copy, agent, onSubmit, loading, error, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.body}</p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="font-medium text-foreground">{agent.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{agent.description}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{agent.source_url}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {loading ? copy.submitting : copy.cta}
        </button>
      </div>
    </div>
  );
}
