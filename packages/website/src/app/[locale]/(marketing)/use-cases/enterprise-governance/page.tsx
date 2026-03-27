import type { Metadata } from "next";
import { getDictionary } from "@/content/dictionaries";
import { UseCasesEnterpriseRedirect } from "@/components/marketing/use-cases-enterprise-redirect";
import type { Locale } from "@/lib/i18n/locales";

const REDIRECT_MESSAGE: Record<Locale, string> = {
  en: "Taking you to Stories, Chapter 5—consequential decisions stay with people.",
  "zh-Hant": "正在前往場景故事第五章——重大決定仍由人作出。",
  "zh-Hans": "正在前往场景故事第五章——重大决定仍由人作出。",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const useCases = getDictionary(locale).useCases;
  return {
    title: useCases.seoTitle,
    description: useCases.seoDescription,
    alternates: {
      canonical: `/${locale}/use-cases`,
    },
  };
}

/** W-1：舊企業治理子頁重定向至總旅程第五章錨點（客戶端寫入 hash）。 */
export default async function EnterpriseGovernanceRedirectPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  return <UseCasesEnterpriseRedirect message={REDIRECT_MESSAGE[locale]} />;
}
