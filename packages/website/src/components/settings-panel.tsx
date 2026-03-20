"use client";

import { useEffect, useState } from "react";
import { useIdentity } from "@/lib/identity/context";

type NotificationPrefs = {
  channels: Array<"in_app" | "email">;
  strategy: "only_exceptions" | "all_runs";
};

export function SettingsPanel() {
  const { userId, isAuthenticated, isLoading, signIn, signOut } = useIdentity();
  const [inputUserId, setInputUserId] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    channels: ["in_app"],
    strategy: "only_exceptions",
  });
  const [saving, setSaving] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId) return;
    setLoadingPrefs(true);
    setMessage("");
    void fetch(`/api/mainline/users/${encodeURIComponent(userId)}/notification-preferences`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.data) return;
        setPrefs({
          channels: Array.isArray(data.data.channels) ? data.data.channels : ["in_app"],
          strategy: data.data.strategy === "all_runs" ? "all_runs" : "only_exceptions",
        });
      })
      .finally(() => setLoadingPrefs(false));
  }, [userId]);

  async function handleSignIn() {
    setMessage("");
    const ok = await signIn(inputUserId);
    setMessage(ok ? "Signed in." : "Sign-in failed.");
  }

  async function handleSavePrefs() {
    if (!userId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/mainline/users/${encodeURIComponent(userId)}/notification-preferences`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error?.message ?? "Save failed.");
        return;
      }
      setMessage("Saved.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading identity...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground">Session</h2>
        {!isAuthenticated ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              placeholder="Enter user id"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={handleSignIn}
              disabled={!inputUserId.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Sign in
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">Signed in as: <span className="font-medium text-foreground">{userId}</span></p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Sign out
            </button>
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
          <div className="mt-3 space-y-3 text-sm">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={prefs.channels.includes("in_app")}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    channels: e.target.checked
                      ? Array.from(new Set([...p.channels, "in_app"]))
                      : p.channels.filter((c) => c !== "in_app"),
                  }))
                }
              />
              In-app
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                checked={prefs.channels.includes("email")}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    channels: e.target.checked
                      ? Array.from(new Set([...p.channels, "email"]))
                      : p.channels.filter((c) => c !== "email"),
                  }))
                }
              />
              Email
            </label>
            <label className="block text-muted-foreground">
              Strategy
              <select
                value={prefs.strategy}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    strategy: e.target.value === "all_runs" ? "all_runs" : "only_exceptions",
                  }))
                }
                className="mt-1 block rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              >
                <option value="only_exceptions">Only exceptions</option>
                <option value="all_runs">All runs</option>
              </select>
            </label>
            <button
              type="button"
              onClick={handleSavePrefs}
              disabled={saving || loadingPrefs || prefs.channels.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save preferences"}
            </button>
          </div>
        </section>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

