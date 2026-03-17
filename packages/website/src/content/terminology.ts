import type { Locale } from "@/lib/i18n/locales";

/**
 * P0-F: Governed terminology for three-language consistency.
 * When copy in one locale uses a term below, the same key in other locales must use an allowed variant.
 * Prevents mistranslation and misleading promises (e.g. "HITL" vs "人工覆核").
 */
export type TermId =
  | "Ask"
  | "Fallback"
  | "HITL"
  | "Evidence"
  | "TrustPolicy"
  | "Receipt";

export const GOVERNED_TERMS: Record<
  TermId,
  { en: readonly string[]; "zh-Hant": readonly string[]; "zh-Hans": readonly string[] }
> = {
  /** Product name "Ask" only (capital A); exclude verb "ask". */
  Ask: {
    en: ["Ask path", "Ask Path", "Ask ->", " Ask ", "Ask,", "Ask."],
    "zh-Hant": ["Ask", "主路徑", "主路径"],
    "zh-Hans": ["Ask", "主路径"],
  },
  Fallback: {
    en: ["fallback", "Fallback"],
    "zh-Hant": ["回退", "fallback", "Fallback"],
    "zh-Hans": ["回退", "fallback", "Fallback"],
  },
  HITL: {
    en: ["HITL", "human-in-the-loop", "human review"],
    "zh-Hant": ["HITL", "人工覆核", "覆核", "人工審核"],
    "zh-Hans": ["HITL", "人工复核", "复核", "人工审核"],
  },
  Evidence: {
    en: ["evidence", "Evidence"],
    "zh-Hant": ["證據", "证据", "evidence", "Evidence"],
    "zh-Hans": ["证据", "evidence", "Evidence"],
  },
  TrustPolicy: {
    en: ["trust policy", "Trust Policy", "trust policies", "Trust", "trust"],
    "zh-Hant": ["信任策略", "可信", "信任", "策略"],
    "zh-Hans": ["信任策略", "可信", "信任", "策略"],
  },
  Receipt: {
    en: ["receipt", "receipts", "Receipt", "Receipts"],
    "zh-Hant": ["收據", "收据", "receipt", "receipts"],
    "zh-Hans": ["收据", "receipt", "receipts"],
  },
};

const TERM_IDS = Object.keys(GOVERNED_TERMS) as TermId[];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Substring match (case-insensitive). */
function containsAny(text: string, variants: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return variants.some((v) => lower.includes(v.toLowerCase()));
}

/** Word-boundary match for English to avoid e.g. "ask" matching inside "task". Case-sensitive. */
function containsEnTerm(text: string, variants: readonly string[]): boolean {
  return variants.some((v) => {
    const re = new RegExp(`\\b${escapeRegex(v)}\\b`);
    return re.test(text);
  });
}

/**
 * Returns the first TermId whose English variant appears in `enText` (word-boundary), or null.
 */
export function findTermInEn(enText: string): TermId | null {
  for (const id of TERM_IDS) {
    if (containsEnTerm(enText, GOVERNED_TERMS[id].en)) return id;
  }
  return null;
}

/**
 * Checks that when `enText` contains a governed term, `localeText` contains an allowed variant for that term.
 */
export function checkTermConsistency(
  enText: string,
  locale: Locale,
  localeText: string,
): { ok: boolean; termId?: TermId } {
  const termId = findTermInEn(enText);
  if (!termId) return { ok: true };
  const allowed = GOVERNED_TERMS[termId][locale];
  const ok = containsAny(localeText, allowed);
  return ok ? { ok: true } : { ok: false, termId };
}
