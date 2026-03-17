import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/locales";
import type { PageCopy } from "@/content/types";

export function buildEntryPageMetadata(input: {
  locale: Locale;
  routeSegment: string;
  copy: PageCopy;
}): Metadata {
  return {
    title: input.copy.seoTitle,
    description: input.copy.seoDescription,
    alternates: {
      canonical: `/${input.locale}/${input.routeSegment}`,
    },
    openGraph: {
      title: input.copy.seoTitle,
      description: input.copy.seoDescription,
      type: "website",
      locale: input.locale,
    },
  };
}
