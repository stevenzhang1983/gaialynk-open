import { describe, expect, it } from "vitest";
import { getHelpCenter, helpArticleSearchHaystack } from "../src/content/help-center";
import { DESKTOP_CONNECTOR_RELEASES_URL } from "../src/lib/product/desktop-connector-constants";

describe("W-22 desktop connector UI", () => {
  it("exposes a releases URL string", () => {
    expect(typeof DESKTOP_CONNECTOR_RELEASES_URL).toBe("string");
    expect(DESKTOP_CONNECTOR_RELEASES_URL.length).toBeGreaterThan(10);
  });

  it("includes desktop install/pair articles in all locales", () => {
    for (const locale of ["en", "zh-Hans", "zh-Hant"] as const) {
      const h = getHelpCenter(locale);
      const connectors = h.sections.find((s) => s.id === "connectors");
      expect(connectors?.articles.some((a) => a.id === "what-is-desktop-connector")).toBe(true);
      expect(
        connectors?.articles.some((a) => a.id === "how-to-install-pair-desktop-connector"),
      ).toBe(true);
    }
  });

  it("search haystack matches desktop pairing keywords", () => {
    const en = getHelpCenter("en");
    const art = en.sections
      .flatMap((s) => s.articles)
      .find((a) => a.id === "how-to-install-pair-desktop-connector");
    expect(art).toBeTruthy();
    const hay = helpArticleSearchHaystack(art!, "en");
    expect(hay.includes("pair") || hay.includes("install")).toBe(true);
  });
});
