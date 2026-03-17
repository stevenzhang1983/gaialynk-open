import { describe, expect, test } from "vitest";
import { getDictionary } from "../src/content/dictionaries";
import { checkTermConsistency, GOVERNED_TERMS } from "../src/content/terminology";
import type { Locale } from "../src/lib/i18n/locales";
import { SUPPORTED_LOCALES } from "../src/lib/i18n/locales";

/**
 * P0-F: Three-language terminology governance.
 * Ensures governed terms (Ask, Fallback, HITL, Evidence, Trust Policy, Receipt) have consistent
 * translations across en / zh-Hant / zh-Hans and prevents misleading or deviant copy.
 */

type DictLeaf = string | string[] | Record<string, unknown>;

function collectStrings(obj: Record<string, unknown>, prefix: string): Array<{ path: string; text: string }> {
  const out: Array<{ path: string; text: string }> = [];
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out.push({ path, text: value });
    } else if (Array.isArray(value)) {
      out.push({ path, text: value.join(" ") });
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      out.push(...collectStrings(value as Record<string, unknown>, path));
    }
  }
  return out;
}

function getFlattenedByLocale(locale: Locale): Array<{ path: string; text: string }> {
  const dict = getDictionary(locale) as Record<string, unknown>;
  return collectStrings(dict, "");
}

describe("terminology governance", () => {
  test("every governed term has at least one allowed variant per locale", () => {
    for (const [termId, variants] of Object.entries(GOVERNED_TERMS)) {
      expect((variants as { en: readonly string[] }).en.length).toBeGreaterThan(0);
      expect((variants as { "zh-Hant": readonly string[] })["zh-Hant"].length).toBeGreaterThan(0);
      expect((variants as { "zh-Hans": readonly string[] })["zh-Hans"].length).toBeGreaterThan(0);
    }
  });

  test("dictionary copy is consistent with governed terminology across locales", () => {
    const enEntries = getFlattenedByLocale("en");
    const byPath = new Map<string, { en: string; "zh-Hant": string; "zh-Hans": string }>();
    for (const { path, text } of enEntries) {
      byPath.set(path, { en: text, "zh-Hant": "", "zh-Hans": "" });
    }
    for (const locale of SUPPORTED_LOCALES) {
      if (locale === "en") continue;
      const entries = getFlattenedByLocale(locale);
      for (const { path, text } of entries) {
        const row = byPath.get(path);
        if (row) (row as Record<string, string>)[locale] = text;
      }
    }
    const errors: string[] = [];
    for (const [path, row] of byPath) {
      const enText = row.en;
      const zhHantResult = checkTermConsistency(enText, "zh-Hant", row["zh-Hant"]);
      if (!zhHantResult.ok) {
        errors.push(`path "${path}": en uses term "${zhHantResult.termId}", zh-Hant missing allowed variant (value: ${row["zh-Hant"].slice(0, 60)}...)`);
      }
      const zhHansResult = checkTermConsistency(enText, "zh-Hans", row["zh-Hans"]);
      if (!zhHansResult.ok) {
        errors.push(`path "${path}": en uses term "${zhHansResult.termId}", zh-Hans missing allowed variant (value: ${row["zh-Hans"].slice(0, 60)}...)`);
      }
    }
    expect(errors, errors.join("\n")).toHaveLength(0);
  });
});
