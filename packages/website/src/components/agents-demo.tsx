"use client";

import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  description: string;
  capabilities: Array<{ name: string; risk_level: string }>;
};

export function AgentsDemo() {
  const [items, setItems] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    void fetch("/api/mainline/agents", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.error?.message ?? "Failed to load agents");
          setItems([]);
          return;
        }
        setItems(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => {
        setError("Network error");
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading agents...</p>;
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No agents available.</p>;

  return (
    <ul className="space-y-3">
      {items.map((agent) => (
        <li key={agent.id} className="rounded-xl border border-border bg-card p-4">
          <p className="font-medium text-foreground">{agent.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{agent.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {agent.capabilities.slice(0, 4).map((cap) => (
              <span key={`${agent.id}-${cap.name}`} className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
                {cap.name} ({cap.risk_level})
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

