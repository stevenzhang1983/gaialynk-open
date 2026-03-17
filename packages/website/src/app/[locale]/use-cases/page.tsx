import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

const USE_CASES = ["multi-agent-dev", "high-risk-approval", "node-collaboration", "autonomous-revenue-ops"] as const;

const CASE_COPY: Record<
  Locale,
  Record<(typeof USE_CASES)[number], { title: string; description: string; evidence: string; status: "Now" | "In Progress" | "Coming Soon" | "Research" }>
> = {
  en: {
    "multi-agent-dev": {
      title: "Ask once, route to specialist agents",
      description: "One user request is routed to the right specialist agents without exposing protocol complexity.",
      evidence: "Result summary plus traceable invocation path in one view.",
      status: "Now",
    },
    "high-risk-approval": {
      title: "High-risk approval workflow",
      description: "Sensitive actions are gated by policy, review queue, and explicit human confirmation.",
      evidence: "Decision reason codes and receipts link every approval step.",
      status: "Now",
    },
    "node-collaboration": {
      title: "Cross-node trusted collaboration",
      description: "Connect distributed nodes while preserving trust boundaries and governance controls.",
      evidence: "Directory sync plus traceable invocation origin per node.",
      status: "Now",
    },
    "autonomous-revenue-ops": {
      title: "Recurring automation and growth operations",
      description: "Move from one-time asks to recurring, policy-governed automation tasks.",
      evidence: "Currently in research for post-MVP expansion.",
      status: "Research",
    },
  },
  "zh-Hant": {
    "multi-agent-dev": {
      title: "一次提需求，自動路由給專業 Agent",
      description: "同一個使用者需求可自動分配給合適 Agent，無需理解協議細節。",
      evidence: "結果摘要與可追蹤調用路徑同時可見。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高風險動作審批流程",
      description: "敏感操作先經策略判定，再進入待確認佇列完成人工覆核。",
      evidence: "每一步都有決策理由與收據證據可追溯。",
      status: "Now",
    },
    "node-collaboration": {
      title: "跨節點可信協作",
      description: "連接分散節點，同時維持信任邊界與治理控制。",
      evidence: "目錄同步並可追蹤每次調用來源節點。",
      status: "Now",
    },
    "autonomous-revenue-ops": {
      title: "週期自動化與增長運營",
      description: "從一次性需求延伸到可週期執行、可治理的自動化任務。",
      evidence: "目前為 post-MVP 探索階段。",
      status: "Research",
    },
  },
  "zh-Hans": {
    "multi-agent-dev": {
      title: "一次提需求，自动路由给专业 Agent",
      description: "同一个用户需求可自动分配给合适 Agent，无需理解协议细节。",
      evidence: "结果摘要与可追踪调用路径同时可见。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高风险动作审批流程",
      description: "敏感操作先经策略判定，再进入待确认队列完成人工复核。",
      evidence: "每一步都有决策理由与收据证据可追溯。",
      status: "Now",
    },
    "node-collaboration": {
      title: "跨节点可信协作",
      description: "连接分布式节点，同时保持信任边界与治理控制。",
      evidence: "目录同步并可追踪每次调用来源节点。",
      status: "Now",
    },
    "autonomous-revenue-ops": {
      title: "周期自动化与增长运营",
      description: "从一次性需求延伸到可周期执行、可治理的自动化任务。",
      evidence: "当前为 post-MVP 探索阶段。",
      status: "Research",
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).useCases;
  return buildEntryPageMetadata({ locale, routeSegment: "use-cases", copy });
}

export default async function UseCasesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const copy = dict.useCases;
  const cards = CASE_COPY[locale];
  const lanes = {
    en: [
      { href: "/ask", title: "Temporary Needs", desc: "Ask once, route quickly, recover safely.", status: "In Progress" as const },
      { href: "/subscriptions", title: "Daily Needs", desc: "Recurring tasks with lifecycle and governance.", status: "Coming Soon" as const },
    ],
    "zh-Hant": [
      { href: "/ask", title: "臨時需求", desc: "一次提問、快速路由、可恢復回退。", status: "In Progress" as const },
      { href: "/subscriptions", title: "日常需求", desc: "以生命週期與治理承接週期任務。", status: "Coming Soon" as const },
    ],
    "zh-Hans": [
      { href: "/ask", title: "临时需求", desc: "一次提问、快速路由、可恢复回退。", status: "In Progress" as const },
      { href: "/subscriptions", title: "日常需求", desc: "以生命周期与治理承接周期任务。", status: "Coming Soon" as const },
    ],
  }[locale];

  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {USE_CASES.map((slug) => {
          const item = cards[slug];
          return (
            <Link
              key={slug}
              href={`/${locale}/use-cases/${slug}`}
              className="rounded-xl border border-border bg-card p-5 hover:border-primary"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold">{item.title}</h2>
                <StatusBadge status={item.status} />
              </div>
              <p className="mt-2 text-sm text-muted">{item.description}</p>
              <p className="mt-3 text-xs text-primary">{item.evidence}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {lanes.map((lane) => (
          <Link
            key={lane.href}
            href={`/${locale}${lane.href}`}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{lane.title}</h2>
              <StatusBadge status={lane.status} />
            </div>
            <p className="mt-2 text-sm text-muted">{lane.desc}</p>
          </Link>
        ))}
      </div>

      <CtaLink
        primary
        href={`/${locale}/developers`}
        eventName="cta_click"
        eventPayload={{
          locale,
          page: "use_cases",
          referrer: "internal",
          cta_id: "try_workflow_start_building",
        }}
      >
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
