import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    scenarioTitle: string;
    scenarioBody: string;
    workflowTitle: string;
    workflowSteps: string[];
    solutionTitle: string;
    decisionOutcomes: string[];
    ctaStartBuilding: string;
    ctaOpenApp: string;
    ctaBookDemo: string;
    backToUseCases: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "Enterprise governance",
    scenarioTitle: "The scenario",
    scenarioBody:
      "In the enterprise, every Agent invocation must be governed: who can call which Agent, which actions require human approval, and how to prove compliance. Without a runtime trust system, organizations either block Agent use or accept unaudited risk.",
    workflowTitle: "How it works on GaiaLynk",
    workflowSteps: [
      "User request enters the conversation runtime",
      "Trust policy computes a decision with reason codes (allow / allow_limited / need_confirmation / deny)",
      "High-risk path is routed to the review queue (human-in-the-loop)",
      "Execution completes with a signed receipt",
      "The full audit timeline remains replayable for governance and compliance",
    ],
    solutionTitle: "Decision outcomes",
    decisionOutcomes: [
      "allow: pass with full audit trace",
      "allow_limited: pass with scoped restrictions",
      "need_confirmation: require explicit human confirmation",
      "deny: blocked with reason codes and receipts",
    ],
    ctaStartBuilding: "Start Building",
    ctaOpenApp: "Open App →",
    ctaBookDemo: "Book a Demo",
    backToUseCases: "Back to Use Cases",
    seoTitle: "Enterprise governance - GaiaLynk Use Cases",
    seoDescription: "Policy-driven decisions, HITL review, and auditable receipts for enterprise Agent governance.",
  },
  "zh-Hant": {
    title: "企業治理",
    scenarioTitle: "場景",
    scenarioBody:
      "企業內每一次 Agent 調用都需可治理：誰能調用哪個 Agent、哪些動作需人工審批、如何證明合規。若無運行時信任體系，企業只能選擇封鎖 Agent 或承受無法審計的風險。",
    workflowTitle: "在 GaiaLynk 上的流程",
    workflowSteps: [
      "使用者需求進入會話 Runtime",
      "Trust Policy 產生決策與 reason codes（allow / allow_limited / need_confirmation / deny）",
      "高風險路徑進入 Review Queue（人工覆核）",
      "執行完成並簽發收據",
      "完整審計時間線可回放，支援治理與合規",
    ],
    solutionTitle: "決策結果",
    decisionOutcomes: [
      "allow：放行，保留完整稽核軌跡",
      "allow_limited：受限放行（範圍/能力/時效）",
      "need_confirmation：需要人工明確確認",
      "deny：拒絕並附 reason codes 與證據",
    ],
    ctaStartBuilding: "開始構建",
    ctaOpenApp: "打開應用 →",
    ctaBookDemo: "預約 Demo",
    backToUseCases: "返回應用場景",
    seoTitle: "企業治理 - GaiaLynk 應用場景",
    seoDescription: "策略驅動決策、人工覆核與可審計收據，支援企業 Agent 治理。",
  },
  "zh-Hans": {
    title: "企业治理",
    scenarioTitle: "场景",
    scenarioBody:
      "企业内每一次 Agent 调用都需可治理：谁能调用哪个 Agent、哪些动作需人工审批、如何证明合规。若无运行时信任体系，企业只能选择封锁 Agent 或承受无法审计的风险。",
    workflowTitle: "在 GaiaLynk 上的流程",
    workflowSteps: [
      "用户需求进入会话 Runtime",
      "Trust Policy 产出决策与 reason codes（allow / allow_limited / need_confirmation / deny）",
      "高风险路径进入 Review Queue（人工复核）",
      "执行完成并签发收据",
      "完整审计时间线可回放，支持治理与合规",
    ],
    solutionTitle: "决策结果",
    decisionOutcomes: [
      "allow：放行，保留完整审计轨迹",
      "allow_limited：受限放行（范围/能力/时效）",
      "need_confirmation：需要人工明确确认",
      "deny：拒绝并附 reason codes 与证据",
    ],
    ctaStartBuilding: "开始构建",
    ctaOpenApp: "打开应用 →",
    ctaBookDemo: "预约 Demo",
    backToUseCases: "返回应用场景",
    seoTitle: "企业治理 - GaiaLynk 应用场景",
    seoDescription: "策略驱动决策、人工复核与可审计收据，支持企业 Agent 治理。",
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
    alternates: { canonical: `/${locale}/use-cases/enterprise-governance` },
  };
}

/**
 * T-3.10 企业治理用例页：从 trust-flow（产品区 /app/trust）内容迁移并增强。
 * 包含：场景描述、工作流图示、平台如何解决（决策结果）、CTA。
 */
export default async function EnterpriseGovernancePage({
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
          href={`/${locale}/use-cases`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {c.backToUseCases}
        </Link>
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          {c.title}
        </h1>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.scenarioTitle}</h2>
        <p className="mt-3 text-muted-foreground">{c.scenarioBody}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.workflowTitle}</h2>
        <ol className="mt-4 space-y-2 text-muted-foreground">
          {c.workflowSteps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">{c.solutionTitle}</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          {c.decisionOutcomes.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-4 border-t border-border pt-8">
        <CtaLink
          primary
          href={`/${locale}/developers`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "use_case_enterprise_governance",
            referrer: "internal",
            cta_id: "start_building",
          }}
        >
          {c.ctaStartBuilding}
        </CtaLink>
        <CtaLink
          href={`/${locale}/app`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "use_case_enterprise_governance",
            referrer: "internal",
            cta_id: "open_app",
          }}
        >
          {c.ctaOpenApp}
        </CtaLink>
        <Link
          href={`/${locale}/demo`}
          className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          {c.ctaBookDemo}
        </Link>
      </section>
    </div>
  );
}
