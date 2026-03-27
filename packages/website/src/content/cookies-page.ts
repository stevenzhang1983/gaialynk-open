import type { Locale } from "@/lib/i18n/locales";

export type CookiesPageCopy = {
  seoTitle: string;
  seoDescription: string;
  title: string;
  body: string[];
};

const EN: CookiesPageCopy = {
  seoTitle: "Cookies - GaiaLynk",
  seoDescription:
    "Locale preference and minimal analytics to understand conversion by page and locale. You can withdraw consent in the browser.",
  title: "Cookie notice",
  body: [
    "Locale preference and minimal analytics to understand conversion by page and locale. You can withdraw consent in the browser.",
  ],
};

const ZH_HANT: CookiesPageCopy = {
  seoTitle: "Cookies - GaiaLynk",
  seoDescription: "語系偏好與最小化之轉化分析；可於瀏覽器撤回同意。",
  title: "Cookie 說明",
  body: ["語系偏好與最小化之轉化分析；可於瀏覽器撤回同意。"],
};

const ZH_HANS: CookiesPageCopy = {
  seoTitle: "Cookies - GaiaLynk",
  seoDescription: "语言偏好与最小化之转化分析；可于浏览器撤回同意。",
  title: "Cookie 说明",
  body: ["语言偏好与最小化之转化分析；可于浏览器撤回同意。"],
};

const MAP: Record<Locale, CookiesPageCopy> = {
  en: EN,
  "zh-Hant": ZH_HANT,
  "zh-Hans": ZH_HANS,
};

export function getCookiesPageCopy(locale: Locale): CookiesPageCopy {
  return MAP[locale];
}
