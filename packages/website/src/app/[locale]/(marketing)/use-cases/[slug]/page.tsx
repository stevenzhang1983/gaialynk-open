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
      title: "Multiple listed agents, one thread",
      description:
        "Pick **several listed agents** in the Agent Hub; handoffs stay **legible** in one conversation.",
      status: "Now",
    },
    "high-risk-approval": {
      title: "High-impact steps wait for you",
      description:
        "Sensitive actions **pause** until **you** confirm—policy and review before execution.",
      status: "Now",
    },
    "node-collaboration": {
      title: "Cross-node collaboration",
      description:
        "**Exploring** federated node topologies—**timing and scope** stay on the **roadmap**.",
      status: "Coming Soon",
    },
    "autonomous-revenue-ops": {
      title: "Recurring operations",
      description:
        "**Early exploration:** recurring-ops stories—**when they land** follows the **roadmap**.",
      status: "Research",
    },
  },
  "zh-Hant": {
    "multi-agent-dev": {
      title: "單一對話，多個已上架智能體",
      description: "於**智能體中心**選用**多個已上架智能體**；交接在同一對話中**清楚可讀**。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高影響步驟等待您確認",
      description: "敏感操作**暫停**，直至**您**確認——執行前經策略與覆核。",
      status: "Now",
    },
    "node-collaboration": {
      title: "跨節點協作",
      description: "正在**探索**聯邦節點拓撲——**時間與範圍**請看**路線圖**。",
      status: "Coming Soon",
    },
    "autonomous-revenue-ops": {
      title: "週期性營運場景",
      description: "**早期探索**：週期性營運相關敘事——**何時可做**隨**路線圖**更新。",
      status: "Research",
    },
  },
  "zh-Hans": {
    "multi-agent-dev": {
      title: "单一会话，多个已上架智能体",
      description: "在**智能体中心**选用**多个已上架智能体**；交接在同一会话中**清楚可读**。",
      status: "Now",
    },
    "high-risk-approval": {
      title: "高影响步骤等待您确认",
      description: "敏感操作**暂停**，直至**您**确认——执行前经策略与复核。",
      status: "Now",
    },
    "node-collaboration": {
      title: "跨节点协作",
      description: "正在**探索**联邦节点拓扑——**时间与范围**请看**路线图**。",
      status: "Coming Soon",
    },
    "autonomous-revenue-ops": {
      title: "周期性运营场景",
      description: "**早期探索**：周期性运营相关叙事——**何时可做**随**路线图**更新。",
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
    en: { now: "Start Building", later: "Help center" },
    "zh-Hant": { now: "開始構建", later: "說明中心" },
    "zh-Hans": { now: "开始构建", later: "帮助中心" },
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
          href={`/${locale}/help`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: `use_case_${slug}`,
            referrer: "internal",
            cta_id: "help_center",
          }}
        >
          {ctaText.later}
        </CtaLink>
      )}
    </section>
  );
}
