"use client";

import { useCallback, useState } from "react";
import type { ProviderOnboardingCopy } from "@/content/onboarding/provider-onboarding-copy";
import type { ProviderAgentCapability, RegisterAgentBody } from "@/lib/product/provider-agent-types";

type Props = {
  copy: ProviderOnboardingCopy["form"];
  initial?: Partial<RegisterAgentBody>;
  onSubmit: (body: RegisterAgentBody) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string;
};

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mock:";
  } catch {
    return false;
  }
}

export function ProviderAgentFormStep({ copy, initial, onSubmit, onBack, loading, error }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [agentType, setAgentType] = useState<RegisterAgentBody["agent_type"]>(initial?.agent_type ?? "logical");
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url ?? "");
  const [capabilities, setCapabilities] = useState<ProviderAgentCapability[]>(
    initial?.capabilities?.length ? [...initial.capabilities] : [{ name: "", risk_level: "low" }],
  );

  const addCapability = useCallback(() => {
    setCapabilities((prev) => [...prev, { name: "", risk_level: "low" }]);
  }, []);

  const updateCapability = useCallback((index: number, field: keyof ProviderAgentCapability, value: string) => {
    setCapabilities((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value };
      return next;
    });
  }, []);

  const removeCapability = useCallback((index: number) => {
    setCapabilities((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const caps = capabilities.filter((c) => c.name.trim());
      if (!name.trim()) return;
      if (!description.trim()) return;
      if (!isValidUrl(sourceUrl.trim())) return;
      if (caps.length === 0) return;
      onSubmit({
        name: name.trim(),
        description: description.trim(),
        agent_type: agentType,
        source_url: sourceUrl.trim(),
        capabilities: caps.map((c) => ({ name: c.name.trim(), risk_level: c.risk_level })),
      });
    },
    [name, description, agentType, sourceUrl, capabilities, onSubmit],
  );

  const capsValid = capabilities.some((c) => c.name.trim());
  const formValid = name.trim() && description.trim() && isValidUrl(sourceUrl.trim()) && capsValid;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <div>
        <label htmlFor="provider-agent-name" className="mb-1 block text-sm font-medium text-foreground">
          {copy.nameLabel}
        </label>
        <input
          id="provider-agent-name"
          type="text"
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.namePlaceholder}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div>
        <label htmlFor="provider-agent-desc" className="mb-1 block text-sm font-medium text-foreground">
          {copy.descLabel}
        </label>
        <textarea
          id="provider-agent-desc"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={copy.descPlaceholder}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      <div>
        <label htmlFor="provider-agent-type" className="mb-1 block text-sm font-medium text-foreground">
          {copy.typeLabel}
        </label>
        <select
          id="provider-agent-type"
          value={agentType}
          onChange={(e) => setAgentType(e.target.value as RegisterAgentBody["agent_type"])}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {copy.agentTypes.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="provider-source-url" className="mb-1 block text-sm font-medium text-foreground">
          {copy.urlLabel}
        </label>
        <input
          id="provider-source-url"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder={copy.urlPlaceholder}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">{copy.urlHint}</p>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">{copy.capabilitiesLabel}</label>
          <button type="button" onClick={addCapability} className="text-xs text-primary hover:underline">
            {copy.addCapability}
          </button>
        </div>
        <ul className="space-y-2">
          {capabilities.map((cap, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={cap.name}
                onChange={(e) => updateCapability(i, "name", e.target.value)}
                placeholder={copy.capabilityPlaceholder}
                className="min-w-[140px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <select
                value={cap.risk_level}
                onChange={(e) => updateCapability(i, "risk_level", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {copy.riskLevels.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeCapability(i)}
                disabled={capabilities.length <= 1}
                className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                aria-label={copy.removeCapabilityAria}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
          {copy.back}
        </button>
        <button
          type="submit"
          disabled={!formValid || loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {loading ? copy.registering : copy.registerCta}
        </button>
      </div>
    </form>
  );
}
