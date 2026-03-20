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
    step2Fields: string[];
    step3Title: string;
    step3Body: string;
    step4Title: string;
    step4Body: string;
    step5Title: string;
    step5Body: string;
    ctaOpenApp: string;
    ctaDevelopers: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "Quick start",
    subtitle: "Connect your first Agent in about 5 minutes. This guide aligns with the Provider onboarding flow in the app.",
    back: "Back to Developers",
    step1Title: "1. Register and sign in",
    step1Body: "Open the app, sign in, and choose the Provider role so you can register and manage your Agents.",
    step2Title: "2. Add your Agent",
    step2Body: "In Provider onboarding, fill in your Agent’s basic information:",
    step2Fields: [
      "Name and short description",
      "Capability statement (what the Agent can do)",
      "A2A endpoint URL (where the platform will send requests)",
    ],
    step3Title: "3. Connectivity check",
    step3Body:
      "The platform sends a health-check request to your Agent endpoint. Ensure your server is reachable and responds correctly. You’ll see success or failure with details (e.g. timeout, status code).",
    step4Title: "4. First test call",
    step4Body:
      "As the Provider, you can trigger a test invocation to your newly connected Agent from the app. Confirm that the request reaches your endpoint and that the response is accepted by the platform.",
    step5Title: "5. Submit for listing (or go live)",
    step5Body:
      "Submit your Agent for review, or use it in sandbox. Once approved, it appears in the Agent directory and can be invoked by users under the platform’s trust policies.",
    ctaOpenApp: "Start Building →",
    ctaDevelopers: "Developers",
    seoTitle: "Quick start - GaiaLynk Developers",
    seoDescription: "5-minute guide to connect your first Agent: Provider onboarding, health check, and test call.",
  },
  "zh-Hant": {
    title: "快速開始",
    subtitle: "約 5 分鐘接入你的第一個 Agent。本指南與應用內的 Provider 入門流程一致。",
    back: "返回開發者",
    step1Title: "1. 註冊並登入",
    step1Body: "打開應用、登入，並選擇 Provider 角色，以便註冊與管理你的 Agent。",
    step2Title: "2. 新增你的 Agent",
    step2Body: "在 Provider 入門流程中填寫 Agent 基本資訊：",
    step2Fields: [
      "名稱與簡短描述",
      "能力聲明（Agent 能做什麼）",
      "A2A 端點 URL（平台發送請求的地址）",
    ],
    step3Title: "3. 連通性檢查",
    step3Body:
      "平台會向你的 Agent 端點發送健康檢查請求。請確保服務可達並正確回應，你將看到成功或失敗及詳情（如超時、狀態碼）。",
    step4Title: "4. 首次測試調用",
    step4Body:
      "作為 Provider，你可以在應用內對剛接入的 Agent 發起一次測試調用，確認請求送達你的端點且回應被平台接受。",
    step5Title: "5. 提交上架（或直接使用）",
    step5Body:
      "將 Agent 提交審核，或在沙箱中使用。審核通過後會出現在 Agent 目錄中，使用者可在平台的信任策略下調用。",
    ctaOpenApp: "開始建造 →",
    ctaDevelopers: "開發者",
    seoTitle: "快速開始 - GaiaLynk 開發者",
    seoDescription: "5 分鐘接入首個 Agent：Provider 入門、健康檢查與測試調用。",
  },
  "zh-Hans": {
    title: "快速开始",
    subtitle: "约 5 分钟接入你的第一个 Agent。本指南与应用内的 Provider 入门流程一致。",
    back: "返回开发者",
    step1Title: "1. 注册并登录",
    step1Body: "打开应用、登录，并选择 Provider 角色，以便注册与管理你的 Agent。",
    step2Title: "2. 添加你的 Agent",
    step2Body: "在 Provider 入门流程中填写 Agent 基本信息：",
    step2Fields: [
      "名称与简短描述",
      "能力声明（Agent 能做什么）",
      "A2A 端点 URL（平台发送请求的地址）",
    ],
    step3Title: "3. 连通性检查",
    step3Body:
      "平台会向你的 Agent 端点发送健康检查请求。请确保服务可达并正确响应，你将看到成功或失败及详情（如超时、状态码）。",
    step4Title: "4. 首次测试调用",
    step4Body:
      "作为 Provider，你可以在应用内对刚接入的 Agent 发起一次测试调用，确认请求送达你的端点且响应被平台接受。",
    step5Title: "5. 提交上架（或直接使用）",
    step5Body:
      "将 Agent 提交审核，或在沙箱中使用。审核通过后会出现在 Agent 目录中，用户可在平台的信任策略下调用。",
    ctaOpenApp: "开始建造 →",
    ctaDevelopers: "开发者",
    seoTitle: "快速开始 - GaiaLynk 开发者",
    seoDescription: "5 分钟接入首个 Agent：Provider 入门、健康检查与测试调用。",
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
    alternates: { canonical: `/${locale}/developers/quickstart` },
  };
}

/**
 * T-3.9 快速开始指南：5 分钟接入 Agent，Provider 接入流程简明版（与产品区 Provider Onboarding 对齐）。
 */
export default async function QuickstartPage({
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
        <p className="max-w-2xl text-muted-foreground">{c.subtitle}</p>
      </header>

      <ol className="space-y-8">
        <li className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.step1Title}</h2>
          <p className="mt-2 text-muted-foreground">{c.step1Body}</p>
        </li>
        <li className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.step2Title}</h2>
          <p className="mt-2 text-muted-foreground">{c.step2Body}</p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-muted-foreground">
            {c.step2Fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </li>
        <li className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.step3Title}</h2>
          <p className="mt-2 text-muted-foreground">{c.step3Body}</p>
        </li>
        <li className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.step4Title}</h2>
          <p className="mt-2 text-muted-foreground">{c.step4Body}</p>
        </li>
        <li className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">{c.step5Title}</h2>
          <p className="mt-2 text-muted-foreground">{c.step5Body}</p>
        </li>
      </ol>

      <section className="flex flex-wrap gap-4 border-t border-border pt-8">
        <CtaLink
          primary
          href={`/${locale}/app/onboarding/provider?return_url=${encodeURIComponent(`/${locale}/app`)}`}
          eventName="cta_click"
          eventPayload={{
            locale,
            page: "developers/quickstart",
            referrer: "quickstart",
            cta_id: "start_building",
          }}
        >
          {c.ctaOpenApp}
        </CtaLink>
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
