import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceL3View } from "@/components/evidence-l3-view";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<Locale, { title: string; description: string; back: string; seoTitle: string; seoDescription: string }> = {
  en: {
    title: "A2A L3 evidence (developer view)",
    description: "Policy hit, reason codes, receipt refs, and signature digest for audit and replay.",
    back: "Back to Developers",
    seoTitle: "A2A L3 evidence - GaiaLynk Agent IM",
    seoDescription: "Evidence layer for A2A visualization: policy, reason codes, receipts.",
  },
  "zh-Hant": {
    title: "A2A L3 證據（開發者視圖）",
    description: "策略命中、reason codes、收據引用與簽名摘要，供審計與回放。",
    back: "返回開發者",
    seoTitle: "A2A L3 證據 - GaiaLynk Agent IM",
    seoDescription: "A2A 可視化證據層：策略、reason codes、收據。",
  },
  "zh-Hans": {
    title: "A2A L3 证据（开发者视图）",
    description: "策略命中、reason codes、收据引用与签名摘要，供审计与回放。",
    back: "返回开发者",
    seoTitle: "A2A L3 证据 - GaiaLynk Agent IM",
    seoDescription: "A2A 可视化证据层：策略、reason codes、收据。",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = COPY[locale];
  return { title: c.seoTitle, description: c.seoDescription, alternates: { canonical: `/${locale}/developers/evidence` } };
}

export default async function DevelopersEvidencePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = COPY[locale];

  return (
    <section className="space-y-8">
      <div>
        <Link href={`/${locale}/developers`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {c.back}
        </Link>
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
        <p className="max-w-3xl text-muted-foreground">{c.description}</p>
      </div>
      <EvidenceL3View />
    </section>
  );
}
