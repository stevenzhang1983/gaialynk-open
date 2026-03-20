import { ProviderOnboardingWizard } from "@/components/product/onboarding/provider/provider-onboarding-wizard";
import { isSupportedLocale } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/i18n/locales";

/**
 * T-4.8 Provider 新用户引导：欢迎 → 填写 Agent 信息 → 连通性检查 → 测试调用 → 提交审核 → 进入主界面。
 * Query `return_url`：引导结束后「Continue to app」与 Skip 的目标（须为同 locale 站内路径）。
 */
export default async function ProviderOnboardingPage({
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
    typeof sp.return_url === "string" && sp.return_url.startsWith("/") ? sp.return_url : `/${locale}/app`;
  const returnUrl =
    rawReturn.startsWith(`/${locale}/`) && !rawReturn.includes("//") && !rawReturn.includes("://")
      ? rawReturn
      : `/${locale}/app`;

  return <ProviderOnboardingWizard locale={locale} returnUrl={returnUrl} />;
}
