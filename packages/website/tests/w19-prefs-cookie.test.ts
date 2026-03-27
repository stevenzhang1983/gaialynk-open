import { describe, expect, it } from "vitest";
import {
  buildConsentSnapshot,
  GAILYNK_COOKIE_CONSENT_KEY,
  parseCookieConsentJson,
} from "../src/lib/cookie-consent";

describe("W-19 cookie consent storage", () => {
  it("parseCookieConsentJson accepts v1 with analytics_consent alias", () => {
    const raw = JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      analytics_consent: false,
      version: 1,
      updated_at: "2026-03-25T00:00:00.000Z",
    });
    const c = parseCookieConsentJson(raw);
    expect(c?.analytics).toBe(false);
    expect(c?.marketing).toBe(false);
    expect(c?.analytics_consent).toBe(false);
  });

  it("parseCookieConsentJson treats analytics_consent true as analytics on", () => {
    const raw = JSON.stringify({
      necessary: true,
      analytics: false,
      analytics_consent: true,
      marketing: false,
      version: 1,
      updated_at: "2026-03-25T00:00:00.000Z",
    });
    const c = parseCookieConsentJson(raw);
    expect(c?.analytics).toBe(true);
    expect(c?.analytics_consent).toBe(true);
  });

  it("buildConsentSnapshot mirrors analytics into analytics_consent", () => {
    const s = buildConsentSnapshot(true, false);
    expect(s.necessary).toBe(true);
    expect(s.analytics).toBe(true);
    expect(s.analytics_consent).toBe(true);
    expect(s.marketing).toBe(false);
    expect(s.version).toBe(1);
    expect(typeof s.updated_at).toBe("string");
  });

  it("storage key matches CTO directive", () => {
    expect(GAILYNK_COOKIE_CONSENT_KEY).toBe("gaialynk_cookie_consent");
  });
});
