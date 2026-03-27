import { ConsumerOnboardingWizard } from "@/components/product/onboarding/consumer/consumer-onboarding-wizard";
import { sanitizeConsumerOnboardingReturnUrl } from "@/lib/product/consumer-onboarding-mock";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

/**
 * W-9 Consumer 首启：Hub（可选目标 + 开始对话/浏览 Agent）→ 至多 3 步浏览路径（推荐 → 首条 Mock → 结果并入主路径）；「开始对话」直去 Chat 并预填首条。
 * Query `return_url`：Skip / Continue 的目标（须为同 locale 站内路径）。
 */
export default async function ConsumerOnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ return_url?: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isSupportedLocale(raw) ? raw : "en";
  const sp = await searchParams;
  const rawReturn =
    typeof sp.return_url === "string" && sp.return_url.startsWith("/") ? sp.return_url : `/${locale}/app/chat`;
  const returnUrl = sanitizeConsumerOnboardingReturnUrl(locale, rawReturn);

  return <ConsumerOnboardingWizard locale={locale} returnUrl={returnUrl} />;
}
