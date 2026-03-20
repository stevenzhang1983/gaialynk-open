import Link from "next/link";
import type { Metadata } from "next";
import { AgentDirectory } from "@/components/product/agent-directory";
import { PanelLayout } from "@/components/product/panels/panel-layout";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { isSupportedLocale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);
  return {
    title: dict.nav.agents ?? "Agents",
    description: "Browse verified agents, capabilities, and risk labels.",
  };
}

/**
 * T-7.1 /app 产品区正门：
 * - 未登录：可浏览 Agent 目录
 * - 写操作（如发送消息）触发登录（由 ChatWindow/InputBar 处理）
 */
export default async function ProductAppHome({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    return <div />;
  }

  const dict = getDictionary(locale);
  const title = dict.nav.agents ?? "Agents";

  return (
    <PanelLayout locale={locale} title={title} description="Browse verified agents, capabilities, and risk labels.">
      <div className="mb-4 flex items-center justify-end">
        <Link
          href={`/${locale}/app/chat`}
          className="rounded-md border border-border bg-surface-raised px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-raised/80"
        >
          Start conversation →
        </Link>
      </div>
      <AgentDirectory />
    </PanelLayout>
  );
}

