import { describe, expect, test } from "vitest";
import { getDictionary } from "../src/content/dictionaries";
import { SUPPORTED_LOCALES } from "../src/lib/i18n/locales";
import { VISION_TRACKS_BY_LOCALE } from "../src/content/vision-coverage";
import { ENTRY_PAGE_GOVERNANCE } from "../src/content/entry-page-governance";
import { buildEntryPageMetadata } from "../src/lib/seo/entry-page-metadata";

describe("entry governance consistency gate", () => {
  test("entry metadata stays aligned with dictionary seo copy", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const dict = getDictionary(locale);
      for (const item of ENTRY_PAGE_GOVERNANCE) {
        const metadata = buildEntryPageMetadata({
          locale,
          routeSegment: item.routeSegment,
          copy: dict[item.dictionaryKey],
        });
        expect(metadata.title).toBe(dict[item.dictionaryKey].seoTitle);
        expect(metadata.description).toBe(dict[item.dictionaryKey].seoDescription);
        expect(metadata.alternates?.canonical).toBe(`/${locale}/${item.routeSegment}`);
      }
    }
  });

  test("entry status labels stay aligned with vision track statuses", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const tracks = VISION_TRACKS_BY_LOCALE[locale];
      for (const item of ENTRY_PAGE_GOVERNANCE.filter((entry) => entry.enforceVisionStatus)) {
        const route = `/${locale}/${item.routeSegment}`;
        const matchedTrack = tracks.find((track) => track.productPath === route);
        expect(matchedTrack, `missing vision track for ${route}`).toBeTruthy();
        expect(matchedTrack?.status).toBe(item.status);
      }
    }
  });
});
