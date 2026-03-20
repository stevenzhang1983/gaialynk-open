import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    visionTitle: string;
    visionBody: string;
    teamTitle: string;
    teamBody: string;
    contactTitle: string;
    contactBody: string;
    contactLink: string;
    backHome: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "About GaiaLynk",
    visionTitle: "Vision",
    visionBody:
      "We are building the trusted collaboration layer for the Agent Internet. Every Agent invocation should be verified, governed, and traceable—so that organizations can adopt multi-Agent workflows without sacrificing control or compliance.",
    teamTitle: "Team",
    teamBody:
      "GaiaLynk is founded by practitioners who care about runtime trust, policy-as-code, and evidence-by-default. We are shipping the infrastructure that makes Agent-to-Agent collaboration safe and auditable.",
    contactTitle: "Contact",
    contactBody: "For product demos, enterprise inquiries, or partnership: book a demo or reach out via the link below.",
    contactLink: "Contact / Book a Demo",
    backHome: "Back to Home",
    seoTitle: "About - GaiaLynk",
    seoDescription: "Vision, team, and contact. Trusted Agent collaboration layer for the Agent Internet.",
  },
  "zh-Hant": {
    title: "關於 GaiaLynk",
    visionTitle: "願景",
    visionBody:
      "我們正在建造 Agent 互聯網的可信協作層。每一次 Agent 調用都應可驗證、可治理、可追溯——讓組織在採用多 Agent 工作流時不必犧牲控制與合規。",
    teamTitle: "團隊",
    teamBody:
      "GaiaLynk 由關注運行時信任、策略即代碼與默認證據的實踐者創立。我們正在交付讓 Agent 間協作既安全又可審計的基礎設施。",
    contactTitle: "聯絡我們",
    contactBody: "產品 Demo、企業洽詢或合作：請預約 Demo 或透過下方連結聯繫。",
    contactLink: "聯絡 / 預約 Demo",
    backHome: "返回首頁",
    seoTitle: "關於 - GaiaLynk",
    seoDescription: "願景、團隊與聯絡方式。Agent 互聯網的可信協作層。",
  },
  "zh-Hans": {
    title: "关于 GaiaLynk",
    visionTitle: "愿景",
    visionBody:
      "我们正在建造 Agent 互联网的可信协作层。每一次 Agent 调用都应可验证、可治理、可追溯——让组织在采用多 Agent 工作流时不必牺牲控制与合规。",
    teamTitle: "团队",
    teamBody:
      "GaiaLynk 由关注运行时信任、策略即代码与默认证据的实践者创立。我们正在交付让 Agent 间协作既安全又可审计的基础设施。",
    contactTitle: "联系我们",
    contactBody: "产品 Demo、企业洽询或合作：请预约 Demo 或通过下方链接联系。",
    contactLink: "联系 / 预约 Demo",
    backHome: "返回首页",
    seoTitle: "关于 - GaiaLynk",
    seoDescription: "愿景、团队与联系方式。Agent 互联网的可信协作层。",
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
    alternates: { canonical: `/${locale}/about` },
  };
}

/**
 * T-3.11 About 页：团队 / 愿景 / 联系方式。
 */
export default async function AboutPage({
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
          href={`/${locale}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {c.backHome}
        </Link>
      </div>

      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {c.title}
        </h1>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.visionTitle}</h2>
        <p className="mt-3 text-muted-foreground">{c.visionBody}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.teamTitle}</h2>
        <p className="mt-3 text-muted-foreground">{c.teamBody}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.contactTitle}</h2>
        <p className="mt-3 text-muted-foreground">{c.contactBody}</p>
        <Link
          href={`/${locale}/demo`}
          className="mt-4 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {c.contactLink}
        </Link>
      </section>
    </div>
  );
}
