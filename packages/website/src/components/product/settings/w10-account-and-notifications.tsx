"use client";

import { useEffect, useState } from "react";
import type { W10SettingsSuiteCopy } from "@/content/i18n/product-experience";
import { useIdentity } from "@/lib/identity/context";

const EMAIL_TEMPLATE_IDS = [
  "task_completed",
  "human_review_required",
  "quota_warning",
  "agent_status_changed",
  "connector_expired",
  "space_invitation",
] as const;
type EmailTemplateId = (typeof EMAIL_TEMPLATE_IDS)[number];

type NotificationPrefs = {
  channels: Array<"in_app" | "email">;
  strategy: "only_exceptions" | "all_runs";
  email_enabled: boolean;
  email_types: EmailTemplateId[];
  email_locale: "zh" | "en" | "ja";
};

const DEFAULT_EMAIL_TYPES: EmailTemplateId[] = [...EMAIL_TEMPLATE_IDS];

function isEmailTemplateId(s: unknown): s is EmailTemplateId {
  return typeof s === "string" && (EMAIL_TEMPLATE_IDS as readonly string[]).includes(s);
}

function labelForEmailType(copy: W10SettingsSuiteCopy, id: EmailTemplateId): string {
  switch (id) {
    case "task_completed":
      return copy.emailTypeTaskCompleted;
    case "human_review_required":
      return copy.emailTypeHumanReview;
    case "quota_warning":
      return copy.emailTypeQuotaWarning;
    case "agent_status_changed":
      return copy.emailTypeAgentStatus;
    case "connector_expired":
      return copy.emailTypeConnectorExpired;
    case "space_invitation":
      return copy.emailTypeSpaceInvitation;
    default:
      return id;
  }
}

export function W10AccountSessionCard({ copy }: { copy: W10SettingsSuiteCopy }) {
  const { userId, email, role, isAuthenticated, isLoading, signIn, signOut } = useIdentity();
  const [inputUserId, setInputUserId] = useState("");

  async function handleSignIn() {
    await signIn(inputUserId);
  }

  if (isLoading) {
    return <p className="text-base text-muted-foreground">{copy.loadingIdentity}</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.profileSection}</h2>
        {isAuthenticated ? (
          <dl className="mt-4 space-y-3 text-base">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.userIdLabel}</dt>
              <dd className="mt-1 font-mono text-sm text-foreground tabular-nums">{userId}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.emailLabel}</dt>
              <dd className="mt-1 text-foreground">{email ?? copy.roleUnset}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{copy.roleLabel}</dt>
              <dd className="mt-1 text-foreground">{role ?? copy.roleUnset}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-base text-muted-foreground">{copy.sessionSection}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.securitySection}</h2>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-muted-foreground">{copy.securityLead}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.sessionSection}</h2>
        {!isAuthenticated ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              placeholder={copy.devSignInPlaceholder}
              className="rounded-md border border-border bg-background px-3 py-2 text-base text-foreground"
            />
            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={!inputUserId.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {copy.devSignIn}
            </button>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-base text-muted-foreground">
              {copy.signedInAs}: <span className="font-medium text-foreground">{userId}</span>
            </p>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              {copy.signOut}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export function W10NotificationPreferencesCard({ copy }: { copy: W10SettingsSuiteCopy }) {
  const { userId, isAuthenticated, isLoading } = useIdentity();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    channels: ["in_app"],
    strategy: "only_exceptions",
    email_enabled: true,
    email_types: DEFAULT_EMAIL_TYPES,
    email_locale: "en",
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
        const rawTypes = Array.isArray(data.data.email_types) ? data.data.email_types : [];
        const email_types = rawTypes.filter(isEmailTemplateId);
        const el = data.data.email_locale;
        const email_locale = el === "ja" || el === "zh" ? el : "en";
        setPrefs({
          channels: Array.isArray(data.data.channels) ? data.data.channels : ["in_app"],
          strategy: data.data.strategy === "all_runs" ? "all_runs" : "only_exceptions",
          email_enabled: data.data.email_enabled !== false,
          email_types: email_types.length > 0 ? email_types : DEFAULT_EMAIL_TYPES,
          email_locale,
        });
      })
      .finally(() => setLoadingPrefs(false));
  }, [userId]);

  async function handleSavePrefs() {
    if (!userId) return;
    if (prefs.email_enabled && prefs.email_types.length === 0) {
      setMessage(copy.emailTypesInvalid);
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch(`/api/mainline/users/${encodeURIComponent(userId)}/notification-preferences`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channels: prefs.channels,
          strategy: prefs.strategy,
          email_enabled: prefs.email_enabled,
          email_types: prefs.email_types,
          email_locale: prefs.email_locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.error?.message ?? copy.saveFailed);
        return;
      }
      setMessage(copy.saved);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-base text-muted-foreground">{copy.loadingIdentity}</p>;
  }

  if (!isAuthenticated) {
    return <p className="text-base text-muted-foreground">{copy.pleaseSignIn}</p>;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{copy.notificationsTitle}</h2>
      <p className="mt-2 max-w-prose text-base leading-relaxed text-muted-foreground">{copy.notificationsLead}</p>
      <div className="mt-4 space-y-4 text-base">
        <label className="flex items-center gap-2 text-foreground">
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
          {copy.channelInApp}
        </label>
        <label className="flex items-center gap-2 text-foreground">
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
          {copy.channelEmail}
        </label>
        <label className="block text-foreground">
          <span className="text-sm font-medium text-muted-foreground">{copy.strategyLabel}</span>
          <select
            value={prefs.strategy}
            onChange={(e) =>
              setPrefs((p) => ({
                ...p,
                strategy: e.target.value === "all_runs" ? "all_runs" : "only_exceptions",
              }))
            }
            className="mt-2 block w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-base text-foreground"
          >
            <option value="only_exceptions">{copy.strategyExceptions}</option>
            <option value="all_runs">{copy.strategyAllRuns}</option>
          </select>
        </label>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-base font-semibold text-foreground">{copy.emailSectionTitle}</h3>
        <p className="mt-2 max-w-prose text-base leading-relaxed text-muted-foreground">{copy.emailSectionLead}</p>
        <div className="mt-4 space-y-4 text-base">
          <label className="flex items-center gap-2 text-foreground">
            <input
              type="checkbox"
              checked={prefs.email_enabled}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  email_enabled: e.target.checked,
                  email_types: e.target.checked && p.email_types.length === 0 ? DEFAULT_EMAIL_TYPES : p.email_types,
                }))
              }
            />
            {copy.emailMasterLabel}
          </label>
          <div className={prefs.email_enabled ? "" : "pointer-events-none opacity-50"}>
            <p className="text-sm font-medium text-muted-foreground">{copy.emailTypesLabel}</p>
            <ul className="mt-2 space-y-2">
              {EMAIL_TEMPLATE_IDS.map((id) => (
                <li key={id}>
                  <label className="flex items-center gap-2 text-foreground">
                    <input
                      type="checkbox"
                      checked={prefs.email_types.includes(id)}
                      disabled={!prefs.email_enabled}
                      onChange={(e) =>
                        setPrefs((p) => {
                          const on = e.target.checked;
                          const next = on
                            ? Array.from(new Set([...p.email_types, id]))
                            : p.email_types.filter((t) => t !== id);
                          return { ...p, email_types: next };
                        })
                      }
                    />
                    {labelForEmailType(copy, id)}
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <label className="block text-foreground">
            <span className="text-sm font-medium text-muted-foreground">{copy.emailLocaleLabel}</span>
            <select
              value={prefs.email_locale}
              disabled={!prefs.email_enabled}
              onChange={(e) => {
                const v = e.target.value;
                setPrefs((p) => ({
                  ...p,
                  email_locale: v === "ja" || v === "zh" ? v : "en",
                }));
              }}
              className="mt-2 block w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-base text-foreground disabled:opacity-50"
            >
              <option value="zh">{copy.emailLocaleZh}</option>
              <option value="en">{copy.emailLocaleEn}</option>
              <option value="ja">{copy.emailLocaleJa}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleSavePrefs()}
          disabled={saving || loadingPrefs || prefs.channels.length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {saving ? copy.saving : copy.savePreferences}
        </button>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </section>
  );
}
