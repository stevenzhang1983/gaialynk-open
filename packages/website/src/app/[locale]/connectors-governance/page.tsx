import type { Metadata } from "next";
import { CtaLink } from "@/components/cta-link";
import { ConnectorsGovernanceDemo } from "@/components/connectors-governance-demo";
import { StatusBadge } from "@/components/status-badge";
import { getDictionary } from "@/content/dictionaries";
import type { Locale } from "@/lib/i18n/locales";
import { buildEntryPageMetadata } from "@/lib/seo/entry-page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = getDictionary(locale).connectors;
  return buildEntryPageMetadata({ locale, routeSegment: "connectors-governance", copy });
}

export default async function ConnectorsGovernancePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).connectors;

  const labels = {
    en: {
      authTitle: "Authorization Model",
      authItems: ["Scope: directory / app / action", "Duration: once / session / long-lived", "Revocation: immediate + auditable"],
      receiptTitle: "Receipt Fields",
      receiptItems: ["action", "time", "parameter summary", "result", "execution environment signature"],
    },
    "zh-Hant": {
      authTitle: "授權模型",
      authItems: ["粒度：目錄 / 應用 / 動作", "時效：一次性 / 會話期 / 長期", "撤銷：立即生效且可審計"],
      receiptTitle: "收據欄位",
      receiptItems: ["action", "time", "parameter summary", "result", "execution environment signature"],
    },
    "zh-Hans": {
      authTitle: "授权模型",
      authItems: ["粒度：目录 / 应用 / 动作", "时效：一次性 / 会话期 / 长期", "撤销：立即生效且可审计"],
      receiptTitle: "收据字段",
      receiptItems: ["action", "time", "parameter summary", "result", "execution environment signature"],
    },
  }[locale];

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
          <StatusBadge status="In Progress" />
        </div>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Demo — Authorizations & receipts</h2>
        <ConnectorsGovernanceDemo locale={locale} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.authTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {labels.authItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">{labels.receiptTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {labels.receiptItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <CtaLink
        primary
        href={`/${locale}/waitlist`}
        eventName="cta_click"
        eventPayload={{
          locale,
          page: "connectors_governance",
          referrer: "internal",
          cta_id: "join_waitlist_connectors",
        }}
      >
        {copy.primaryCta}
      </CtaLink>
    </section>
  );
}
