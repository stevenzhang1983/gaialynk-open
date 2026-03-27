import type { Locale } from "@/lib/i18n/locales";

/** 定價頁僅展示佔位文案；訂閱表單若復用可接 notifyForm。 */
export type PricingPageCopy = {
  seoTitle: string;
  seoDescription: string;
  headline: string;
};

const EN: PricingPageCopy = {
  seoTitle: "Pricing - GaiaLynk",
  seoDescription: "Public pricing is not published yet.",
  headline: "Plans to be announced",
};

const ZH_HANT: PricingPageCopy = {
  seoTitle: "定價 - GaiaLynk",
  seoDescription: "公開定價尚未發布。",
  headline: "方案即將公布",
};

const ZH_HANS: PricingPageCopy = {
  seoTitle: "定价 - GaiaLynk",
  seoDescription: "公开定价尚未发布。",
  headline: "方案即将公布",
};

export function getPricingPageCopy(locale: Locale): PricingPageCopy {
  if (locale === "zh-Hant") return ZH_HANT;
  if (locale === "zh-Hans") return ZH_HANS;
  return EN;
}
