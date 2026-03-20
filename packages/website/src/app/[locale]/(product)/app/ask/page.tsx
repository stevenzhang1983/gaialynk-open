import type { Metadata } from "next";
import { AskDemo } from "@/components/ask-demo";
import { CtaLink } from "@/components/cta-link";
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
  const copy = getDictionary(locale).ask;
  return buildEntryPageMetadata({ locale, routeSegment: "ask", copy });
}

export default async function AskPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).ask;

  const labels = {
    en: {
      layerTitle: "L1 (default) and L2 (advanced)",
      l1: "L1 Result Layer",
      l1Desc: "User sees outcome summary, confidence, and one next action in a single card.",
      l2: "L2 Process Layer",
      l2Desc: "Advanced users inspect route reasons, policy outcomes, and execution timeline.",
      flowTitle: "Ask Main Path",
      steps: [
        "Input one task in natural language",
        "Route to one or two specialist agents with reasons",
        "Aggregate result with summary, cost, and duration",
        "Expose fallback options when confidence is low",
      ],
    },
    "zh-Hant": {
      layerTitle: "L1（預設）與 L2（進階）",
      l1: "L1 結果層",
      l1Desc: "普通使用者只看結果摘要、可信度與下一步行動。",
      l2: "L2 流程層",
      l2Desc: "進階使用者可查看路由理由、策略決策與執行時間線。",
      flowTitle: "Ask 主路徑",
      steps: ["自然語言輸入一個任務", "路由到一到兩個專業 Agent 並展示理由", "聚合結果卡片（摘要、成本、耗時）", "可信度不足時顯示回退動作"],
    },
    "zh-Hans": {
      layerTitle: "L1（默认）与 L2（进阶）",
      l1: "L1 结果层",
      l1Desc: "普通用户只看结果摘要、可信度与下一步动作。",
      l2: "L2 过程层",
      l2Desc: "进阶用户可查看路由原因、策略决策与执行时间线。",
      flowTitle: "Ask 主路径",
      steps: ["自然语言输入一个任务", "路由到一到两个专业 Agent 并展示原因", "聚合结果卡片（摘要、成本、耗时）", "可信度不足时显示回退动作"],
    },
  }[locale];

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
          <StatusBadge status="In Progress" locale={locale} />
        </div>
        <p className="max-w-3xl text-base text-muted-foreground">{copy.description}</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">{copy.demoHeading ?? "Demo"}</h2>
        <AskDemo locale={locale} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.layerTitle}</h2>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">{labels.l1}</p>
              <p>{labels.l1Desc}</p>
            </div>
            <details className="rounded-md border border-border bg-background p-3">
              <summary className="cursor-pointer font-semibold text-foreground">{labels.l2}</summary>
              <p className="mt-2">{labels.l2Desc}</p>
            </details>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.flowTitle}</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
            {labels.steps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <CtaLink
        primary
        href={`/${locale}/recovery-hitl`}
        eventName="cta_click"
        eventPayload={{
          locale,
          page: "ask",
          referrer: "internal",
          cta_id: "view_recovery_hitl",
        }}
      >
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
