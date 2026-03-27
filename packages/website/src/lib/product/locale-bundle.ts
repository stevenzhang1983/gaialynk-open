import type { Locale } from "@/lib/i18n/locales";
import type { UserFacingLocaleBundle } from "@/lib/product/reason-codes-user-facing";

/** Pick localized line from E-6-style trilingual bundles for website locales (en / zh-Hant / zh-Hans). */
export function lineFromUserFacingBundle(bundle: UserFacingLocaleBundle, locale: Locale): string {
  if (locale === "en") {
    return bundle.en;
  }
  return bundle.zh;
}
