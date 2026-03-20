import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { getDictionary } from "../src/content/dictionaries";
import { SUPPORTED_LOCALES } from "../src/lib/i18n/locales";
import { VISION_TRACKS_BY_LOCALE } from "../src/content/vision-coverage";

describe("website entry coverage", () => {
  test("all locales include required website entry pages in vision tracks", () => {
    const requiredPathsByLocale: Record<(typeof SUPPORTED_LOCALES)[number], string[]> = {
      en: ["/en/ask", "/en/recovery-hitl", "/en/subscriptions", "/en/connectors-governance"],
      "zh-Hant": ["/zh-Hant/ask", "/zh-Hant/recovery-hitl", "/zh-Hant/subscriptions", "/zh-Hant/connectors-governance"],
      "zh-Hans": ["/zh-Hans/ask", "/zh-Hans/recovery-hitl", "/zh-Hans/subscriptions", "/zh-Hans/connectors-governance"],
    };

    for (const locale of SUPPORTED_LOCALES) {
      const productPaths = new Set(VISION_TRACKS_BY_LOCALE[locale].map((item) => item.productPath));
      for (const requiredPath of requiredPathsByLocale[locale]) {
        expect(productPaths.has(requiredPath), `${locale} missing ${requiredPath}`).toBe(true);
      }
    }
  });

  test("dictionary has localized copy for new entry pages", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = getDictionary(locale);
      expect(dict.nav.ask.trim().length).toBeGreaterThan(0);
      expect(dict.ask.title.trim().length).toBeGreaterThan(0);
      expect(dict.recovery.title.trim().length).toBeGreaterThan(0);
      expect(dict.subscriptions.title.trim().length).toBeGreaterThan(0);
      expect(dict.connectors.title.trim().length).toBeGreaterThan(0);
    }
  });

  test("use-cases CTAs keep analytics tracking payload", () => {
    const listPage = readFileSync("src/app/[locale]/(marketing)/use-cases/page.tsx", "utf8");
    const detailPage = readFileSync("src/app/[locale]/(marketing)/use-cases/[slug]/page.tsx", "utf8");
    expect(listPage.includes("eventName=")).toBe(true);
    expect(listPage.includes("eventPayload=")).toBe(true);
    expect(detailPage.includes("eventName=")).toBe(true);
    expect(detailPage.includes("eventPayload=")).toBe(true);
  });
});
