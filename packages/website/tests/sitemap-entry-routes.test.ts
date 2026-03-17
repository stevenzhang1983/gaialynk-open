import { describe, expect, test } from "vitest";
import sitemap from "../src/app/sitemap";

describe("sitemap entry routes", () => {
  test("includes website entry pages for each locale", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((item) => item.url));
    const required = [
      "https://gaialynk.com/en/ask",
      "https://gaialynk.com/en/recovery-hitl",
      "https://gaialynk.com/en/subscriptions",
      "https://gaialynk.com/en/connectors-governance",
      "https://gaialynk.com/zh-Hant/ask",
      "https://gaialynk.com/zh-Hans/ask",
    ];
    for (const url of required) {
      expect(urls.has(url), `missing ${url}`).toBe(true);
    }
  });
});
