import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
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
  const copy = getDictionary(locale).developers;
  return buildEntryPageMetadata({ locale, routeSegment: "developers", copy });
}

export default async function DevelopersPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getDictionary(locale).developers;
  const quickstart = {
    en: [
      "Define one user outcome first (not one agent feature)",
      "Register agent template with risk metadata",
      "Route one conversation request to the right capability",
      "Verify trust decision + receipt + audit evidence",
    ],
    "zh-Hant": ["先定義一個使用者結果（不是先定義功能）", "註冊含風險資訊的 Agent 模板", "把一次會話需求路由到正確能力", "驗證 trust 決策 + 收據 + 稽核證據"],
    "zh-Hans": ["先定义一个用户结果（不是先定义功能）", "注册带风险信息的 Agent 模板", "把一次会话需求路由到正确能力", "验证 trust 决策 + 收据 + 审计证据"],
  }[locale];

  const boundaries = {
    en: [
      "Open Core: conversation runtime, trust policy baseline, review queue, audit receipts",
      "Cloud Layer: managed orchestration, advanced governance, and enterprise operation controls",
    ],
    "zh-Hant": [
      "開源核心：會話 Runtime、Trust Policy 基線、Review Queue、審計收據",
      "雲端能力：託管編排、進階治理與企業運營控制",
    ],
    "zh-Hans": [
      "开源核心：会话 Runtime、Trust Policy 基线、Review Queue、审计收据",
      "云端能力：托管编排、进阶治理与企业运营控制",
    ],
  }[locale];

  const heading = {
    en: { quickstart: "Build Path", boundary: "Open Core / Cloud Boundary" },
    "zh-Hant": { quickstart: "構建路徑", boundary: "開源核心 / 雲端邊界" },
    "zh-Hans": { quickstart: "构建路径", boundary: "开源核心 / 云端边界" },
  }[locale];

  const quickExample = {
    en: {
      title: "Quick integration example",
      steps: [
        "npm install && npm run dev:server  # start mainline (port 3000)",
        "npm run dev:website               # start site (port 3001)",
        "POST /api/v1/ask with { \"text\": \"your task\" } → get ask_id, then GET visualization",
      ],
      code: "curl -X POST http://localhost:3000/api/v1/ask -H 'Content-Type: application/json' -d '{\"text\":\"Summarize the risks\"}'",
    },
    "zh-Hant": {
      title: "快速接入示例",
      steps: [
        "npm install && npm run dev:server  # 啟動主線 (port 3000)",
        "npm run dev:website               # 啟動官網 (port 3001)",
        "POST /api/v1/ask，body { \"text\": \"任務\" } → 取得 ask_id，再 GET visualization",
      ],
      code: "curl -X POST http://localhost:3000/api/v1/ask -H 'Content-Type: application/json' -d '{\"text\":\"Summarize the risks\"}'",
    },
    "zh-Hans": {
      title: "快速接入示例",
      steps: [
        "npm install && npm run dev:server  # 启动主线 (port 3000)",
        "npm run dev:website               # 启动官网 (port 3001)",
        "POST /api/v1/ask，body { \"text\": \"任务\" } → 取得 ask_id，再 GET visualization",
      ],
      code: "curl -X POST http://localhost:3000/api/v1/ask -H 'Content-Type: application/json' -d '{\"text\":\"Summarize the risks\"}'",
    },
  }[locale];

  const contributionMap = {
    en: {
      title: "Contribution map",
      items: [
        { label: "Mainline APIs (conversations, Ask, review queue, receipts)", path: "packages/server", internalPath: null },
        { label: "Website (entry pages, funnel, analytics)", path: "packages/website", internalPath: null },
        { label: "Session topologies T1–T5", path: "docs + mainline conversation_topology", internalPath: "/topology" as const },
        { label: "A2A L3 evidence (developer view)", path: "GET /api/v1/a2a/visualization/l3", internalPath: "/developers/evidence" as const },
      ],
    },
    "zh-Hant": {
      title: "貢獻導圖",
      items: [
        { label: "主線 API（會話、Ask、審核佇列、收據）", path: "packages/server", internalPath: null },
        { label: "官網（入口頁、漏斗、分析）", path: "packages/website", internalPath: null },
        { label: "會話拓撲 T1–T5", path: "docs + mainline conversation_topology", internalPath: "/topology" as const },
        { label: "A2A L3 證據（開發者視圖）", path: "GET /api/v1/a2a/visualization/l3", internalPath: "/developers/evidence" as const },
      ],
    },
    "zh-Hans": {
      title: "贡献导图",
      items: [
        { label: "主线 API（会话、Ask、审核队列、收据）", path: "packages/server", internalPath: null },
        { label: "官网（入口页、漏斗、分析）", path: "packages/website", internalPath: null },
        { label: "会话拓扑 T1–T5", path: "docs + mainline conversation_topology", internalPath: "/topology" as const },
        { label: "A2A L3 证据（开发者视图）", path: "GET /api/v1/a2a/visualization/l3", internalPath: "/developers/evidence" as const },
      ],
    },
  }[locale];

  const supply = {
    en: {
      standardsTitle: "Supply-side Listing Standards",
      standards: [
        "Connectivity, latency, and error-rate checks before listing",
        "Rate-limit behavior must remain explicit and predictable",
        "Failure semantics must map technical errors to user-readable recovery",
      ],
      whyTitle: "Why GaiaLynk Is Different",
      why: [
        "Capability is not enough: every invocation needs trust decisions and reason codes",
        "Governance is built into runtime, not patched after incidents",
        "Evidence chain (review + receipt + audit) is first-class product surface",
      ],
    },
    "zh-Hant": {
      standardsTitle: "供給側上架標準",
      standards: ["上架前必做連通性、延遲、錯誤率檢查", "限流行為需可預期且可解釋", "失敗語義要可映射為使用者可理解的回退動作"],
      whyTitle: "我們的方法論差異",
      why: ["不只比能力，更比可解釋的 trust 決策", "治理能力內建於 runtime，而非事後補丁", "Review + Receipt + Audit 證據鏈是產品一級能力"],
    },
    "zh-Hans": {
      standardsTitle: "供给侧上架标准",
      standards: ["上架前必须完成连通性、延迟、错误率检查", "限流行为需要可预期且可解释", "失败语义要能映射为用户可理解的回退动作"],
      whyTitle: "我们的方法论差异",
      why: ["不只比能力，更比可解释的 trust 决策", "治理能力内建于 runtime，而非事后补丁", "Review + Receipt + Audit 证据链是产品一级能力"],
    },
  }[locale];

  return (
    <div className="space-y-10">
      <section className="space-y-5">
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="max-w-3xl text-base text-muted">{copy.description}</p>
        <CtaLink
          primary
          href={`/${locale}/docs`}
          eventName="docs_click"
          eventPayload={{ locale, page: "developers", referrer: "internal", cta_id: "read_quickstart" }}
        >
          {copy.primaryCta}
        </CtaLink>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">{quickExample.title}</h2>
        <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-muted">
          {quickExample.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <pre className="mt-4 overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
          {quickExample.code}
        </pre>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">{contributionMap.title}</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted">
          {contributionMap.items.map((item) => (
            <li key={item.label}>
              {item.internalPath ? (
                <Link href={`/${locale}${item.internalPath}`} className="font-medium text-primary hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{item.label}</span>
              )}
              <span className="block text-xs text-muted">{item.path}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">{heading.quickstart}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {quickstart.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{heading.boundary}</h2>
            <StatusBadge status="In Progress" />
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {boundaries.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">{supply.standardsTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {supply.standards.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">{supply.whyTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {supply.why.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
