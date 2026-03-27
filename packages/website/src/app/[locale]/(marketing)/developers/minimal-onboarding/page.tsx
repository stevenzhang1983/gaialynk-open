import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink } from "@/components/cta-link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    back: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    step3List: string[];
    step4Title: string;
    step4Body: string;
    contextNote: string;
    ctaConsole: string;
    ctaProtocol: string;
    ctaDevelopers: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "15-minute minimal listing",
    subtitle:
      "Shortest path from a working A2A endpoint to a listing: read the contract, echo once, declare concurrency, submit. Matches in-app Provider console checks.",
    back: "Back to Developers",
    step1Title: "1. Read the A2A surface",
    step1Body:
      "Expose an HTTPS endpoint the platform can call. Implement health/readiness semantics your stack supports, and be ready to accept test invocations with the platform-injected invocation context (user, conversation, run, trace identifiers). See the protocol page for trust and evidence expectations.",
    step2Title: "2. Send one echo / test call",
    step2Body:
      "In the app, use Provider onboarding or My Agents → Connectivity & review → Run health check, then Send test call. Confirm your server logs show the request and that the platform accepts the response body.",
    step3Title: "3. Declare gateway fields (default-safe)",
    step3Body:
      "In My Agents, open Gateway & listing fields and save. For the smallest compliant footprint, use:",
    step3List: [
      "max_concurrent = 1 (single-lane MVP; scale out by adding homogenous endpoint URLs, not threads first)",
      "queue_behavior = queue or fast_fail (pick based on whether you prefer FIFO wait vs immediate 429)",
      "timeout_ms empty = platform default, or set an explicit ceiling",
      "supports_scheduled and memory_tier = match how your Agent actually behaves (honest defaults reduce review friction)",
    ],
    step4Title: "4. Submit for listing",
    step4Body:
      "Use Submit for listing / go live in the console. Staging environments may auto-approve; production review states appear as pending_review → active (or deprecated when delisted). Fine-grained “needs more materials” may also surface via notifications.",
    contextNote:
      "Invocation context is attached on every forward by the gateway; you do not manually forge production tokens—validate TLS and your own auth model for the endpoint.",
    ctaConsole: "Open My Agents →",
    ctaProtocol: "A2A protocol →",
    ctaDevelopers: "Developers",
    seoTitle: "15-minute minimal listing - GaiaLynk Developers",
    seoDescription:
      "Minimal path to list an Agent: A2A head, echo test call, gateway fields (max_concurrent=1), submit review.",
  },
  "zh-Hant": {
    title: "15 分鐘最小上架路徑",
    subtitle:
      "從可用 A2A 端點到上架之最短路徑：閱讀契約、echo 一次、宣告併發、提交；與應用內 Provider 檢查一致。",
    back: "返回開發者",
    step1Title: "1. 讀懂 A2A 介面",
    step1Body:
      "提供平台可呼叫的 HTTPS 端點；依你的堆疊實作健康檢查／就緒語意，並準備接收帶有平台注入之調用上下文（使用者、會話、run、trace 等）的測試調用。信任與證據要求見協議頁。",
    step2Title: "2. 發送一次 echo／測試調用",
    step2Body:
      "在應用內使用 Provider 入門或「我的 Agent」→ 連通性與審核 → 執行健康檢查，再送測試調用。確認伺服器日誌有請求，且平台接受回應內容。",
    step3Title: "3. 宣告網關欄位（保守預設）",
    step3Body: "在「我的 Agent」開啟「網關與上架欄位」並儲存。最小合規可採：",
    step3List: [
      "max_concurrent = 1（單車道 MVP；橫向擴展優先加同構 URL，而非先改多執行緒）",
      "queue_behavior = queue 或 fast_fail（要 FIFO 等待或立即 429）",
      "timeout_ms 留空＝平台預設，或自行設定上限",
      "supports_scheduled、memory_tier 與實際行為一致（誠實預設降低審核摩擦）",
    ],
    step4Title: "4. 提交上架",
    step4Body:
      "在控制台使用「提交上架／上線」。Staging 可能自動通過；正式環境以 pending_review → active（或下架時 deprecated）呈現。「需補材」等細節亦可能透過通知傳達。",
    contextNote: "每次轉發由網關附加調用上下文；無需偽造生產權杖——請驗證 TLS 與你對端點的自有鑑權模型。",
    ctaConsole: "開啟我的 Agent →",
    ctaProtocol: "A2A 協議 →",
    ctaDevelopers: "開發者",
    seoTitle: "15 分鐘最小上架 - GaiaLynk 開發者",
    seoDescription: "Agent 最小上架：A2A、echo 測試、網關欄位（max_concurrent=1）、提交審核。",
  },
  "zh-Hans": {
    title: "15 分钟最小上架路径",
    subtitle:
      "从可用 A2A 端点到上架的最短路径：阅读契约、echo 一次、声明并发、提交；与应用内 Provider 检查一致。",
    back: "返回开发者",
    step1Title: "1. 读懂 A2A 接口",
    step1Body:
      "提供平台可调用的 HTTPS 端点；按你的栈实现健康检查/就绪语义，并准备接收带有平台注入的调用上下文（用户、会话、run、trace 等）的测试调用。信任与证据要求见协议页。",
    step2Title: "2. 发送一次 echo / 测试调用",
    step2Body:
      "在应用内使用 Provider 入门或「我的 Agent」→ 连通性与审核 → 运行健康检查，再发送测试调用。确认服务器日志有请求，且平台接受响应内容。",
    step3Title: "3. 声明网关字段（保守默认）",
    step3Body: "在「我的 Agent」打开「网关与上架字段」并保存。最小合规可采用：",
    step3List: [
      "max_concurrent = 1（单车道 MVP；横向扩展优先加同构 URL，而非先改多线程）",
      "queue_behavior = queue 或 fast_fail（要 FIFO 等待或立即 429）",
      "timeout_ms 留空=平台默认，或自行设上限",
      "supports_scheduled、memory_tier 与实际行为一致（诚实默认降低审核摩擦）",
    ],
    step4Title: "4. 提交上架",
    step4Body:
      "在控制台使用「提交上架/上线」。Staging 可能自动通过；正式环境以 pending_review → active（或下架时 deprecated）呈现。「需补材」等也可能通过通知传达。",
    contextNote: "每次转发由网关附加调用上下文；无需伪造生产令牌——请验证 TLS 与你对端点的自有鉴权模型。",
    ctaConsole: "打开我的 Agent →",
    ctaProtocol: "A2A 协议 →",
    ctaDevelopers: "开发者",
    seoTitle: "15 分钟最小上架 - GaiaLynk 开发者",
    seoDescription: "Agent 最小上架：A2A、echo 测试、网关字段（max_concurrent=1）、提交审核。",
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
    alternates: { canonical: `/${locale}/developers/minimal-onboarding` },
  };
}

/** W-13：15 分钟最小接入文档（读头 → echo → 并发 1 → 上架），与 E-7 字段、控制台表单一致。 */
export default async function MinimalOnboardingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = COPY[locale];

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/${locale}/developers`} className="text-sm text-muted-foreground hover:text-foreground">
          ← {c.back}
        </Link>
      </div>

      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">{c.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{c.subtitle}</p>
      </header>

      <ol className="max-w-3xl space-y-6">
        <li className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">{c.step1Title}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{c.step1Body}</p>
        </li>
        <li className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">{c.step2Title}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{c.step2Body}</p>
        </li>
        <li className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">{c.step3Title}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{c.step3Body}</p>
          <ul className="mt-3 max-w-prose list-inside list-disc space-y-2 text-base leading-relaxed text-muted-foreground">
            {c.step3List.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </li>
        <li className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground">{c.step4Title}</h2>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{c.step4Body}</p>
        </li>
      </ol>

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{c.contextNote}</p>

      <section className="flex flex-wrap gap-4 border-t border-border pt-8">
        <CtaLink
          primary
          href={`/${locale}/app/my-agents`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "developers/minimal-onboarding",
            referrer: "internal",
            cta_id: "open_my_agents",
          }}
        >
          {c.ctaConsole}
        </CtaLink>
        <Link
          href={`/${locale}/developers/protocol`}
          className="inline-flex items-center rounded-md border border-border px-5 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          {c.ctaProtocol}
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
