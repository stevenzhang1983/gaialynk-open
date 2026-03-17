import type { Metadata } from "next";
import { CtaLink } from "@/components/cta-link";
import { RecoveryHitlDemo } from "@/components/recovery-hitl-demo";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).recovery;
  return buildEntryPageMetadata({ locale, routeSegment: "recovery-hitl", copy });
}

export default async function RecoveryHitlPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).recovery;

  const labels = {
    en: {
      fallbackTitle: "Fallback Actions",
      fallbackItems: [
        "Retry same path with updated context",
        "Switch to alternative specialist agent",
        "Downgrade to safe summary-only output",
      ],
      hitlTitle: "HITL Decision Surface",
      hitlItems: [
        "Trigger reason and impact scope",
        "Actions: approve / reject / ask_more_info / delegate",
        "Receipt and audit link per decision",
      ],
    },
    "zh-Hant": {
      fallbackTitle: "失敗回退三動作",
      fallbackItems: ["同路徑重試（補充上下文）", "切換替代 Agent", "降級輸出為安全摘要"],
      hitlTitle: "HITL 審批界面",
      hitlItems: ["顯示觸發原因與影響範圍", "操作：approve / reject / ask_more_info / delegate", "每次決策皆關聯收據與審計鏈路"],
    },
    "zh-Hans": {
      fallbackTitle: "失败回退三动作",
      fallbackItems: ["同路径重试（补充上下文）", "切换替代 Agent", "降级输出为安全摘要"],
      hitlTitle: "HITL 审批界面",
      hitlItems: ["展示触发原因与影响范围", "操作：approve / reject / ask_more_info / delegate", "每次决策都关联收据与审计链路"],
    },
  }[locale];

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
          <StatusBadge status="In Progress" />
        </div>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Demo — Review queue</h2>
        <RecoveryHitlDemo locale={locale} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.fallbackTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {labels.fallbackItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.hitlTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {labels.hitlItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <CtaLink
        primary
        href={`/${locale}/subscriptions`}
        eventName="cta_click"
        eventPayload={{
          locale,
          page: "recovery_hitl",
          referrer: "internal",
          cta_id: "view_subscriptions",
        }}
      >
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
