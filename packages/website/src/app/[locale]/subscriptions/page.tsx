import type { Metadata } from "next";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import { SubscriptionsDemo } from "@/components/subscriptions-demo";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).subscriptions;
  return buildEntryPageMetadata({ locale, routeSegment: "subscriptions", copy });
}

export default async function SubscriptionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).subscriptions;

  const labels = {
    en: {
      lifecycleTitle: "Task Instance Lifecycle",
      lifecycle: ["draft", "active", "paused", "archived"],
      evidenceTitle: "What users can verify",
      evidence: [
        "Who owns this task and which scope it can touch",
        "Run history with retries, outcomes, and timestamps",
        "Quota and billing checkpoints per cycle",
      ],
    },
    "zh-Hant": {
      lifecycleTitle: "任務實例生命週期",
      lifecycle: ["draft", "active", "paused", "archived"],
      evidenceTitle: "使用者可驗證內容",
      evidence: ["任務歸屬與可操作範圍", "執行歷史（重試、結果、時間）", "每個週期的配額與計費點位"],
    },
    "zh-Hans": {
      lifecycleTitle: "任务实例生命周期",
      lifecycle: ["draft", "active", "paused", "archived"],
      evidenceTitle: "用户可验证内容",
      evidence: ["任务归属与可操作范围", "执行历史（重试、结果、时间）", "每个周期的配额与计费点位"],
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
        <h2 className="text-xl font-semibold">Demo — Task center</h2>
        <SubscriptionsDemo locale={locale} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.lifecycleTitle}</h2>
          <ol className="mt-4 grid gap-2 text-sm text-muted">
            {labels.lifecycle.map((state, index) => (
              <li key={state}>
                {index + 1}. {state}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.evidenceTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {labels.evidence.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <CtaLink
        primary
        href={`/${locale}/connectors-governance`}
        eventName="cta_click"
        eventPayload={{
          locale,
          page: "subscriptions",
          referrer: "internal",
          cta_id: "view_connector_governance",
        }}
      >
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
