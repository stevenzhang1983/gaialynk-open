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
      "Work is converging on chat-shaped collaboration. **Most people begin with agents published on the platform—select them in the Agent Hub; no self-deployment required.** GaiaLynk emphasizes clear boundaries, **confirmation before sensitive steps**, and **histories you can review**. Publishers grow the Agent Hub; broader connection is long-term direction—see the roadmap.",
    teamTitle: "Team",
    teamBody:
      "We build runtime safety, explicit rules, and evidence that audits can use.",
    contactTitle: "Contact",
    contactBody: "For enterprise inquiries or partnership, start from the help center—we route you from there.",
    contactLink: "Help center",
    backHome: "Back to Home",
    seoTitle: "About - GaiaLynk",
    seoDescription:
      "Chat-shaped collaboration, Agent Hub listings, confirmation before sensitive steps, and reviewable histories. Vision, team, and contact.",
  },
  "zh-Hant": {
    title: "關於 GaiaLynk",
    visionTitle: "願景",
    visionBody:
      "工作正匯聚於對話形態的人與智能體協作。**多數人從智能體中心選用已上架智能體即可起步，無需先行自建部署。** GaiaLynk 著重清楚邊界、**敏感步驟前之確認**與**可供查閱之紀錄**；發布者豐富智能體中心，長期走向更廣連接——進度見路線圖。",
    teamTitle: "團隊",
    teamBody: "打造運行時安全、明確規則，以及可供稽核取證之材料。",
    contactTitle: "聯絡我們",
    contactBody: "企業洽詢或合作請從說明中心起步，我們將由此協助對接。",
    contactLink: "說明中心",
    backHome: "返回首頁",
    seoTitle: "關於 - GaiaLynk",
    seoDescription: "對話形態協作、智能體中心、敏感步驟前確認與可供查閱紀錄。願景、團隊與聯絡方式。",
  },
  "zh-Hans": {
    title: "关于 GaiaLynk",
    visionTitle: "愿景",
    visionBody:
      "工作正汇聚于对话形态的人与智能体协作。**多数人从智能体中心选用已上架智能体即可起步，无需先行自建部署。** GaiaLynk 着重清楚边界、**敏感步骤前的确认**与**可供查阅的记录**；发布者丰富智能体中心，长期走向更广连接——进度见路线图。",
    teamTitle: "团队",
    teamBody: "打造运行时安全、明确规则，以及可供审计取证的材料。",
    contactTitle: "联系我们",
    contactBody: "企业洽询或合作请从帮助中心起步，我们将由此协助对接。",
    contactLink: "帮助中心",
    backHome: "返回首页",
    seoTitle: "关于 - GaiaLynk",
    seoDescription: "对话形态协作、智能体中心、敏感步骤前确认与可供查阅记录。愿景、团队与联系方式。",
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
          href={`/${locale}/help`}
          className="mt-4 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {c.contactLink}
        </Link>
      </section>
    </div>
  );
}
