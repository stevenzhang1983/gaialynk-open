import type { Metadata } from "next";
import { CtaLink } from "@/components/cta-link";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).trust;
  return buildEntryPageMetadata({ locale, routeSegment: "trust", copy });
}

export default async function TrustPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).trust;

  const riskLevels = {
    en: [
      "allow: pass with full audit trace",
      "allow_limited: pass with scoped restrictions",
      "need_confirmation: require explicit human confirmation",
      "deny: blocked with reason codes and receipts",
    ],
    "zh-Hant": [
      "allow：放行，保留完整稽核軌跡",
      "allow_limited：受限放行（範圍/能力/時效）",
      "need_confirmation：需要人工明確確認",
      "deny：拒絕並附 reason codes 與證據",
    ],
    "zh-Hans": [
      "allow：放行，保留完整审计轨迹",
      "allow_limited：受限放行（范围/能力/时效）",
      "need_confirmation：需要人工明确确认",
      "deny：拒绝并附 reason codes 与证据",
    ],
  }[locale];

  const trustFlow = {
    en: [
      "Ask request enters conversation runtime",
      "Trust policy computes decision with reason codes",
      "High-risk path enters review queue (HITL)",
      "Execution completes with signed receipt",
      "Audit timeline remains replayable for governance",
    ],
    "zh-Hant": [
      "Ask 需求進入會話 Runtime",
      "Trust Policy 產生決策與 reason codes",
      "高風險路徑進入 Review Queue（HITL）",
      "執行完成並簽發收據",
      "審計時間線可回放可追責",
    ],
    "zh-Hans": [
      "Ask 需求进入会话 Runtime",
      "Trust Policy 产出决策与 reason codes",
      "高风险路径进入 Review Queue（HITL）",
      "执行完成并签发收据",
      "审计时间线可回放可追责",
    ],
  }[locale];

  const heading = {
    en: { decisions: "Decision Outcomes", flow: "Trust Runtime Flow" },
    "zh-Hant": { decisions: "決策結果", flow: "Trust Runtime 流程" },
    "zh-Hans": { decisions: "决策结果", flow: "Trust Runtime 流程" },
  }[locale];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-3xl text-base text-muted-foreground">{copy.description}</p>
        <CtaLink
          primary
          href={`/${locale}/recovery-hitl`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "trust",
            referrer: "internal",
            cta_id: "view_recovery_hitl",
          }}
        >
          {copy.primaryCta}
        </CtaLink>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">{heading.decisions}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {riskLevels.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">{heading.flow}</h2>
          <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
            {trustFlow.map((item, index) => (
              <li key={item}>
                {index + 1}. {item}
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
