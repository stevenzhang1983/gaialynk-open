/**
 * P0-2 H: Sensitive domain (medical/legal/investment) and copyright/data boundary.
 * Reason codes and disclaimer text for responses and audit.
 */

export const SENSITIVE_CATEGORIES = ["medical", "legal", "investment"] as const;
export type SensitiveCategory = (typeof SENSITIVE_CATEGORIES)[number];

export const REASON_CODE_SENSITIVE_DOMAIN_DISCLAIMER = "sensitive_domain_disclaimer";
export const REASON_CODE_NOT_FOR_RETRAINING_BOUNDARY = "not_for_retraining_boundary";

const DISCLAIMER_BY_CATEGORY: Record<SensitiveCategory, string> = {
  medical: "本结果仅供参考，不构成医疗建议，请以执业医师意见为准。",
  legal: "本结果仅供参考，不构成法律意见，请以执业律师意见为准。",
  investment: "本结果仅供参考，不构成投资建议，请谨慎决策。",
};

export const getRiskDisclaimerForCategory = (
  category: string,
): { disclaimer: string; reason_code: string } | null => {
  const normalized = category.toLowerCase();
  if (SENSITIVE_CATEGORIES.includes(normalized as SensitiveCategory)) {
    return {
      disclaimer: DISCLAIMER_BY_CATEGORY[normalized as SensitiveCategory],
      reason_code: REASON_CODE_SENSITIVE_DOMAIN_DISCLAIMER,
    };
  }
  return null;
};

export const isSensitiveCategory = (category: string): boolean =>
  SENSITIVE_CATEGORIES.includes(category.toLowerCase() as SensitiveCategory);
