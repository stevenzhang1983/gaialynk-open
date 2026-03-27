/**
 * W-19：Cookie 同意状态（localStorage + 可选 BFF 审计占位）。
 * 键名与 CTO 指令一致：`gaialynk_cookie_consent`
 */

export const GAILYNK_COOKIE_CONSENT_KEY = "gaialynk_cookie_consent";
const LEGACY_CONSENT_KEY = "gl_cookie_consent";

export const COOKIE_CONSENT_CHANGED_EVENT = "gaialynk-cookie-consent-changed";

export type CookieConsentStored = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** 与验收清单字段对齐（与 `analytics` 同义） */
  analytics_consent: boolean;
  version: 1;
  updated_at: string;
};

export function buildConsentSnapshot(analytics: boolean, marketing: boolean): CookieConsentStored {
  const now = new Date().toISOString();
  return {
    necessary: true,
    analytics,
    marketing,
    analytics_consent: analytics,
    version: 1,
    updated_at: now,
  };
}

export function parseCookieConsentJson(raw: string | null | undefined): CookieConsentStored | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (o.version !== 1 || o.necessary !== true) return null;
    const analytics = o.analytics === true || o.analytics_consent === true;
    const marketing = o.marketing === true;
    const updated_at = typeof o.updated_at === "string" ? o.updated_at : new Date().toISOString();
    return buildConsentSnapshot(analytics, marketing);
  } catch {
    return null;
  }
}

/** 自旧键迁移：`gl_cookie_consent === "accepted"` → 全部接受 */
export function migrateLegacyCookieKeys(): void {
  if (typeof window === "undefined") return;
  try {
    const next = window.localStorage.getItem(GAILYNK_COOKIE_CONSENT_KEY);
    if (next) return;
    const legacy = window.localStorage.getItem(LEGACY_CONSENT_KEY);
    if (legacy === "accepted") {
      persistCookieConsentClient(buildConsentSnapshot(true, true));
      window.localStorage.removeItem(LEGACY_CONSENT_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function readCookieConsentClient(): CookieConsentStored | null {
  if (typeof window === "undefined") return null;
  try {
    migrateLegacyCookieKeys();
    return parseCookieConsentJson(window.localStorage.getItem(GAILYNK_COOKIE_CONSENT_KEY));
  } catch {
    return null;
  }
}

export function hasAnalyticsConsentClient(): boolean {
  const c = readCookieConsentClient();
  return c?.analytics === true;
}

export function persistCookieConsentClient(
  snapshot: CookieConsentStored,
  options?: { syncServer?: boolean; locale?: string; path?: string },
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GAILYNK_COOKIE_CONSENT_KEY, JSON.stringify(snapshot));
  } catch {
    return;
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_CHANGED_EVENT, { detail: snapshot }));
  if (options?.syncServer !== false) {
    void fetch("/api/consent/cookies", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        necessary: true,
        analytics: snapshot.analytics,
        marketing: snapshot.marketing,
        analytics_consent: snapshot.analytics_consent,
        updated_at: snapshot.updated_at,
        locale: options?.locale,
        path: options?.path,
      }),
      keepalive: true,
    }).catch(() => null);
  }
}
