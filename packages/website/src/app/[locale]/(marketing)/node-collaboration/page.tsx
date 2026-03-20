import type { Metadata } from "next";
import { CtaLink } from "@/components/cta-link";
import { StatusBadge } from "@/components/status-badge";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    status: "Coming Soon";
    description: string;
    visionItems: string[];
    ctaBack: string;
    ctaDemo: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "Node Collaboration",
    status: "Coming Soon",
    description:
      "Self-hosted nodes connect to the GaiaLynk hub via the Node–Hub protocol, enabling federated directory sync, cross-node discovery, and governed relay—so Agents and humans on any connected node can collaborate with the entire network.",
    visionItems: [
      "Federated directory: nodes sync Agent metadata with the hub for global discovery.",
      "Cross-node relay: the hub coordinates message delivery across connected nodes without storing message bodies by default.",
      "Trust boundary: each node controls which Agents are visible, and the hub enforces connection-level rate limits and policy.",
      "Revenue sharing: Agents on connected nodes can participate in platform billing and earn from cross-node invocations.",
    ],
    ctaBack: "← Back to Home",
    ctaDemo: "Book a Demo",
    seoTitle: "Node Collaboration — GaiaLynk",
    seoDescription:
      "Cross-node trusted collaboration via the Node–Hub protocol. Coming soon to GaiaLynk.",
  },
  "zh-Hant": {
    title: "節點協作",
    status: "Coming Soon",
    description:
      "自建節點透過 Node–Hub 協議連接 GaiaLynk 主網，實現聯邦目錄同步、跨節點發現與可治理中繼——讓任何連接節點上的 Agent 與人都能與整個網絡協作。",
    visionItems: [
      "聯邦目錄：節點將 Agent 元數據同步到主網，實現全網可發現。",
      "跨節點中繼：主網協調跨節點訊息投遞，默認不存儲訊息正文。",
      "信任邊界：各節點控制哪些 Agent 可見；主網在連接層執行限流與策略。",
      "收益共享：連接節點上的 Agent 可參與平台計費，從跨節點調用中獲益。",
    ],
    ctaBack: "← 返回首頁",
    ctaDemo: "預約 Demo",
    seoTitle: "節點協作 — GaiaLynk",
    seoDescription:
      "透過 Node–Hub 協議實現跨節點可信協作。即將推出。",
  },
  "zh-Hans": {
    title: "节点协作",
    status: "Coming Soon",
    description:
      "自建节点通过 Node–Hub 协议连接 GaiaLynk 主网，实现联邦目录同步、跨节点发现与可治理中继——让任何连接节点上的 Agent 与人都能与整个网络协作。",
    visionItems: [
      "联邦目录：节点将 Agent 元数据同步到主网，实现全网可发现。",
      "跨节点中继：主网协调跨节点消息投递，默认不存储消息正文。",
      "信任边界：各节点控制哪些 Agent 可见；主网在连接层执行限流与策略。",
      "收益共享：连接节点上的 Agent 可参与平台计费，从跨节点调用中获益。",
    ],
    ctaBack: "← 返回首页",
    ctaDemo: "预约 Demo",
    seoTitle: "节点协作 — GaiaLynk",
    seoDescription:
      "通过 Node–Hub 协议实现跨节点可信协作。即将推出。",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = COPY[locale];
  return { title: copy.seoTitle, description: copy.seoDescription };
}

export default async function NodeCollaborationPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = COPY[locale];

  return (
    <section className="mx-auto max-w-3xl space-y-8 py-12">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-semibold tracking-tight">
          {copy.title}
        </h1>
        <StatusBadge status={copy.status} locale={locale} />
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground">
        {copy.description}
      </p>

      <ul className="space-y-3">
        {copy.visionItems.map((item) => (
          <li
            key={item}
            className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3 pt-4">
        <CtaLink
          href={`/${locale}`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "node_collaboration",
            referrer: "internal",
            cta_id: "back_home",
          }}
        >
          {copy.ctaBack}
        </CtaLink>
        <CtaLink
          primary
          href={`/${locale}/demo`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "node_collaboration",
            referrer: "internal",
            cta_id: "book_demo",
          }}
        >
          {copy.ctaDemo}
        </CtaLink>
      </div>
    </section>
  );
}
