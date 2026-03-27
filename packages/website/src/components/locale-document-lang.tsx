"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/i18n/locales";

const HTML_LANG: Record<Locale, string> = {
  en: "en",
  "zh-Hans": "zh-Hans",
  "zh-Hant": "zh-Hant",
};

/**
 * W-14：将 `<html lang>` 与当前路由语系对齐（根 layout 默认 en，由本组件在客户端修正）。
 */
export function LocaleDocumentLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale] ?? "en";
  }, [locale]);
  return null;
}
