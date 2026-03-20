import { notFound } from "next/navigation";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import type { Locale } from "@/lib/i18n/locales";

type CaseItem = {
  title: string;
  description: string;
  status: "Now" | "In Progress" | "Coming Soon" | "Research";
};

const COPY_BY_LOCALE: Record<Locale, Record<string, CaseItem>> = {
  en: {
    "multi-agent-dev": {
      title: "Ask once, route to specialist agents",
      description: "Start with one request and let GaiaLynk coordinate specialist agents with traceable decisions and results.",
      status: "Now",
    },
    "high-risk-approval": {
      title: "High-risk approval workflow",
      description: "Sensitive actions are gated by policy outcomes, review queue, and explicit human confirmation.",
      status: "Now",
    },
    "node-collaboration": {
      title: "Cross-node trusted collaboration",
      description:
        "Federated directory, cross-node discovery, and governed invocation chains are on the near-term roadmap—reserve a conversation to shape priorities.",
      status: "Coming Soon",
    },
    "autonomous-revenue-ops": {
      title: "Recurring automation and growth operations",
      description: "This scenario is in research and targets policy-governed recurring automation after MVP.",
      status: "Research",
    },
  },
  "zh-Hant": {
    "multi-agent-dev": {
      title: "一次提需求，自動路由給專業 Agent",
      description: "從一條需求開始，由 GaiaLynk 協調專業 Agent，並保留可追蹤決策與結果證據。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高風險動作審批流程",
      description: "敏感操作透過策略結果、審批佇列與人工確認形成可治理閉環。",
      status: "Now",
    },
    "node-collaboration": {
      title: "跨節點可信協作",
      description:
        "聯邦目錄、跨節點發現與可治理調用鏈已排入近程路線圖；預約對談以對齊優先順序。",
      status: "Coming Soon",
    },
    "autonomous-revenue-ops": {
      title: "週期自動化與增長運營",
      description: "此場景目前為研究階段，面向 MVP 後的可治理週期自動化。",
      status: "Research",
    },
  },
  "zh-Hans": {
    "multi-agent-dev": {
      title: "一次提需求，自动路由给专业 Agent",
      description: "从一条需求开始，由 GaiaLynk 协调专业 Agent，并保留可追踪决策与结果证据。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高风险动作审批流程",
      description: "敏感操作通过策略结果、审批队列与人工确认形成可治理闭环。",
      status: "Now",
    },
    "node-collaboration": {
      title: "跨节点可信协作",
      description: "联邦目录、跨节点发现与可治理调用链已排入近程路线图；预约沟通以校准优先级。",
      status: "Coming Soon",
    },
    "autonomous-revenue-ops": {
      title: "周期自动化与增长运营",
      description: "该场景当前为研究阶段，面向 MVP 后的可治理周期自动化。",
      status: "Research",
    },
  },
};

export function generateStaticParams() {
  return Object.keys(COPY_BY_LOCALE.en).map((slug) => ({ slug }));
}

export default async function UseCaseDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const item = COPY_BY_LOCALE[locale][slug];
  if (!item) {
    notFound();
  }

  const ctaText = {
    en: { now: "Start Building", later: "Book a Demo" },
    "zh-Hant": { now: "開始構建", later: "預約 Demo" },
    "zh-Hans": { now: "开始构建", later: "预约 Demo" },
  }[locale];

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{item.title}</h1>
        <StatusBadge status={item.status} locale={locale} />
      </div>
      <p className="max-w-3xl text-base text-muted-foreground">{item.description}</p>
      {item.status === "Now" ? (
        <CtaLink
          primary
          href={`/${locale}/developers`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: `use_case_${slug}`,
            referrer: "internal",
            cta_id: "start_building",
          }}
        >
          {ctaText.now}
        </CtaLink>
      ) : (
        <CtaLink
          href={`/${locale}/demo`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: `use_case_${slug}`,
            referrer: "internal",
            cta_id: "book_demo",
          }}
        >
          {ctaText.later}
        </CtaLink>
      )}
    </section>
  );
}
