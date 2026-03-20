import { describe, expect, test } from "vitest";
import sitemap from "../src/app/sitemap";
import { SITE_ORIGIN_FALLBACK } from "../src/lib/site-origin";

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? SITE_ORIGIN_FALLBACK).replace(/\/$/, "");
}

describe("sitemap entry routes", () => {
  test("includes website entry pages for each locale", () => {
    const entries = sitemap();
    const urls = new Set(entries.map((item) => item.url));
    const base = siteBase();
    const required = [
      `${base}/en/ask`,
      `${base}/en/recovery-hitl`,
      `${base}/en/subscriptions`,
      `${base}/en/connectors-governance`,
      `${base}/zh-Hant/ask`,
      `${base}/zh-Hans/ask`,
    ];
    for (const url of required) {
      expect(urls.has(url), `missing ${url}`).toBe(true);
    }
  });
});
