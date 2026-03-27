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
    ctaHelp: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "Node Collaboration",
    status: "Coming Soon",
    description:
      "**On the roadmap**: self-hosted nodes with clear trust boundaries, shared discovery where policy allows, governed relay—a **step beyond** what most people use in the product **today**.",
    visionItems: [
      "**Planned:** Federated Agent Hub—nodes sync agent metadata with the hub for global discovery where policy allows.",
      "**Planned:** Cross-node relay—the hub coordinates delivery across connected nodes without storing message bodies by default.",
      "**Planned:** Trust boundary—each node controls which agents are visible; the hub enforces connection-level limits and policy.",
      "**Planned:** Revenue sharing—agents on connected nodes can participate in platform billing and earn from cross-node invocations.",
    ],
    ctaBack: "← Back to Home",
    ctaHelp: "Help center",
    seoTitle: "Node Collaboration — GaiaLynk",
    seoDescription:
      "Cross-node trusted collaboration via the Node–Hub protocol. Coming soon to GaiaLynk.",
  },
  "zh-Hant": {
    title: "節點協作",
    status: "Coming Soon",
    description:
      "**路線圖上的方向**：自建節點、清楚信任邊界、於策略允許下的可發現性、可治理中繼——**比多數人今天在手機／網頁上用到的主路徑再往前一階**。",
    visionItems: [
      "**規劃：** 聯邦智能體中心——節點將智能體元數據同步至主網，於策略允許下支援全網可發現。",
      "**規劃：** 跨節點中繼——主網協調跨節點訊息投遞，預設不存儲訊息正文。",
      "**規劃：** 信任邊界——各節點控制哪些智能體可見；主網於連接層執行限流與策略。",
      "**規劃：** 收益共享——連接節點上的智能體可參與平台計費，從跨節點調用中獲益。",
    ],
    ctaBack: "← 返回首頁",
    ctaHelp: "說明中心",
    seoTitle: "節點協作 — GaiaLynk",
    seoDescription:
      "透過 Node–Hub 協議實現跨節點可信協作。即將推出。",
  },
  "zh-Hans": {
    title: "节点协作",
    status: "Coming Soon",
    description:
      "**路线图上的方向**：自建节点、清楚信任边界、于策略允许下的可发现性、可治理中继——**比多数人今天在手机／网页上用到的主路径再往前一阶**。",
    visionItems: [
      "**规划：** 联邦智能体中心——节点将智能体元数据同步至主网，于策略允许下支持全网可发现。",
      "**规划：** 跨节点中继——主网协调跨节点消息投递，默认不存储消息正文。",
      "**规划：** 信任边界——各节点控制哪些智能体可见；主网在连接层执行限流与策略。",
      "**规划：** 收益共享——连接节点上的智能体可参与平台计费，从跨节点调用中获益。",
    ],
    ctaBack: "← 返回首页",
    ctaHelp: "帮助中心",
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
          href={`/${locale}/help`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "node_collaboration",
            referrer: "internal",
            cta_id: "help_center",
          }}
        >
          {copy.ctaHelp}
        </CtaLink>
      </div>
    </section>
  );
}
