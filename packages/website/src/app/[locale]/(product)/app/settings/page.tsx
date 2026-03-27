import { redirect } from "next/navigation";
import { isSupportedLocale, type Locale } from "@/lib/i18n/locales";

/**
 * W-10：设置套件默认进入「账户」子页。
 */
export default async function SettingsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isSupportedLocale(raw) ? raw : "en";
  redirect(`/${locale}/app/settings/account`);
}
