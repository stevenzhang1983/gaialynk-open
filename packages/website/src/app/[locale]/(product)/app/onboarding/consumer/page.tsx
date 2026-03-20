import { ConsumerOnboardingWizard } from "@/components/product/onboarding/consumer/consumer-onboarding-wizard";
import { sanitizeConsumerOnboardingReturnUrl } from "@/lib/product/consumer-onboarding-mock";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

/**
 * T-4.7 Consumer 新用户引导：欢迎 → 推荐 Agent → 首条消息（Mock）→ 结果与收据 → 进入主界面。
 * Query `return_url`：引导结束后「Continue to app」与 Skip 的目标（须为同 locale 站内路径）。
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
