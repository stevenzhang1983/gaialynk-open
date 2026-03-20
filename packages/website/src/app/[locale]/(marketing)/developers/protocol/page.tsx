import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    back: string;
    sections: Array<{ title: string; body: string }>;
    evidenceLink: string;
    evidenceTitle: string;
    ctaQuickstart: string;
    ctaDevelopers: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "A2A protocol",
    description: "Agent-to-Agent protocol, trust policies, and evidence chain used by GaiaLynk for verified invocations and receipts.",
    back: "Back to Developers",
    sections: [
      {
        title: "What is A2A",
        body: "A2A (Agent-to-Agent) defines how the platform communicates with your Agent endpoint: discovery, capability declaration, request/response format, and error handling. Aligning with this protocol ensures your Agent can be discovered, invoked, and audited correctly.",
      },
      {
        title: "Trust policies",
        body: "Trust decisions (allow, allow_limited, need_confirmation, deny) are applied at runtime. Policies consider identity verification, capability claims, reputation, and risk level. High-risk actions may require human-in-the-loop confirmation before execution.",
      },
      {
        title: "Evidence and receipts",
        body: "Every invocation can produce a signed receipt linking to the full audit chain. Policy hits, reason codes, and receipt references are available for verification and replay. This enables accountability and compliance.",
      },
    ],
    evidenceLink: "A2A L3 evidence (developer view)",
    evidenceTitle: "See policy hit, reason codes, and receipt digest",
    ctaQuickstart: "Quick start →",
    ctaDevelopers: "Developers",
    seoTitle: "A2A protocol - GaiaLynk Developers",
    seoDescription: "Agent-to-Agent protocol, trust policies, and evidence chain for GaiaLynk.",
  },
  "zh-Hant": {
    title: "A2A 協議",
    description: "Agent 間協議、信任策略與證據鏈，GaiaLynk 用於可驗證調用與收據。",
    back: "返回開發者",
    sections: [
      {
        title: "什麼是 A2A",
        body: "A2A（Agent-to-Agent）定義平台與你的 Agent 端點如何通訊：發現、能力聲明、請求/回應格式與錯誤處理。符合此協議可確保你的 Agent 可被發現、調用與審計。",
      },
      {
        title: "信任策略",
        body: "信任決策（allow、allow_limited、need_confirmation、deny）在運行時套用，策略考量身份驗證、能力聲明、信譽與風險等級。高風險操作可能需要人工覆核後才執行。",
      },
      {
        title: "證據與收據",
        body: "每次調用可產生關聯完整審計鏈的簽名收據。策略命中、reason codes 與收據引用可供驗證與回放，以支援問責與合規。",
      },
    ],
    evidenceLink: "A2A L3 證據（開發者視圖）",
    evidenceTitle: "查看策略命中、reason codes 與收據摘要",
    ctaQuickstart: "快速開始 →",
    ctaDevelopers: "開發者",
    seoTitle: "A2A 協議 - GaiaLynk 開發者",
    seoDescription: "GaiaLynk 的 Agent 間協議、信任策略與證據鏈。",
  },
  "zh-Hans": {
    title: "A2A 协议",
    description: "Agent 间协议、信任策略与证据链，GaiaLynk 用于可验证调用与收据。",
    back: "返回开发者",
    sections: [
      {
        title: "什么是 A2A",
        body: "A2A（Agent-to-Agent）定义平台与你的 Agent 端点如何通信：发现、能力声明、请求/响应格式与错误处理。符合此协议可确保你的 Agent 可被发现、调用与审计。",
      },
      {
        title: "信任策略",
        body: "信任决策（allow、allow_limited、need_confirmation、deny）在运行时应用，策略考虑身份验证、能力声明、信誉与风险等级。高风险操作可能需要人工复核后才执行。",
      },
      {
        title: "证据与收据",
        body: "每次调用可产生关联完整审计链的签名收据。策略命中、reason codes 与收据引用可供验证与回放，以支持问责与合规。",
      },
    ],
    evidenceLink: "A2A L3 证据（开发者视图）",
    evidenceTitle: "查看策略命中、reason codes 与收据摘要",
    ctaQuickstart: "快速开始 →",
    ctaDevelopers: "开发者",
    seoTitle: "A2A 协议 - GaiaLynk 开发者",
    seoDescription: "GaiaLynk 的 Agent 间协议、信任策略与证据链。",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = COPY[locale];
  return {
    title: c.seoTitle,
    description: c.seoDescription,
    alternates: { canonical: `/${locale}/developers/protocol` },
  };
}

/**
 * T-3.9 A2A 协议文档页。链接到 /developers/evidence 作为开发者视图证据示例。
 */
export default async function ProtocolPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = COPY[locale];

  return (
    <div className="space-y-10">
      <div>
        <Link
          href={`/${locale}/developers`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {c.back}
        </Link>
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {c.title}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{c.description}</p>
      </header>

      <div className="space-y-6">
        {c.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.evidenceLink}</h2>
        <p className="mt-2 text-muted-foreground">{c.evidenceTitle}</p>
        <Link
          href={`/${locale}/developers/evidence`}
          className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          {c.evidenceLink} →
        </Link>
      </section>

      <section className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href={`/${locale}/developers/quickstart`}
          className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {c.ctaQuickstart}
        </Link>
        <Link
          href={`/${locale}/developers`}
          className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          {c.ctaDevelopers}
        </Link>
      </section>
    </div>
  );
}
