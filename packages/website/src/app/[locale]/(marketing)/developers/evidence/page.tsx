import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceL3View } from "@/components/evidence-l3-view";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<Locale, { title: string; description: string; back: string; seoTitle: string; seoDescription: string }> = {
  en: {
    title: "Developer view: policy hit and record digest",
    description:
      "For integrators: rule outcomes, reason codes, record references, and signature material—supporting audit and replay workflows.",
    back: "Back to Developers",
    seoTitle: "Developer evidence view - GaiaLynk",
    seoDescription: "Rule outcomes, reason codes, record references, and signature material for audit and replay.",
  },
  "zh-Hant": {
    title: "開發者視圖：規則命中與紀錄摘要",
    description: "供接入方查閱：規則結果、原因碼、紀錄引用與簽名材料，支援稽核與回放流程。",
    back: "返回開發者",
    seoTitle: "開發者證據視圖 - GaiaLynk",
    seoDescription: "規則結果、原因碼、紀錄引用與簽名材料，支援稽核與回放。",
  },
  "zh-Hans": {
    title: "开发者视图：规则命中与记录摘要",
    description: "供接入方查阅：规则结果、原因码、记录引用与签名材料，支持审计与回放流程。",
    back: "返回开发者",
    seoTitle: "开发者证据视图 - GaiaLynk",
    seoDescription: "规则结果、原因码、记录引用与签名材料，支持审计与回放。",
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
