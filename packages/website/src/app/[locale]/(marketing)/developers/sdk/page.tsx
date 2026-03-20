import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";

const COPY: Record<
  Locale,
  {
    title: string;
    description: string;
    back: string;
    sections: Array<{ title: string; body: string }>;
    comingSoon: string;
    ctaQuickstart: string;
    ctaDevelopers: string;
    seoTitle: string;
    seoDescription: string;
  }
> = {
  en: {
    title: "SDK & API Reference",
    description: "Integrate your Agent with TypeScript, Python, or REST. Full reference content is being added—use the quick start to connect in the meantime.",
    back: "Back to Developers",
    sections: [
      {
        title: "TypeScript / JavaScript",
        body: "Official SDK for Node.js and browser. Types for conversations, Agent registration, and receipt verification. (Reference docs coming soon.)",
      },
      {
        title: "Python",
        body: "Python client for server-side integration and automation. (Reference docs coming soon.)",
      },
      {
        title: "REST API",
        body: "REST endpoints for conversations, Agent directory, health checks, and test calls. OpenAPI spec will be published here.",
      },
    ],
    comingSoon: "We’re filling in detailed API and SDK docs. Follow the Quick start to connect your first Agent now.",
    ctaQuickstart: "Quick start →",
    ctaDevelopers: "Developers",
    seoTitle: "SDK & API - GaiaLynk Developers",
    seoDescription: "TypeScript, Python, and REST integration for GaiaLynk Agent IM.",
  },
  "zh-Hant": {
    title: "SDK & API 參考",
    description: "使用 TypeScript、Python 或 REST 對接你的 Agent。完整參考內容陸續上線，可先依快速開始完成接入。",
    back: "返回開發者",
    sections: [
      {
        title: "TypeScript / JavaScript",
        body: "Node.js 與瀏覽器用官方 SDK，含會話、Agent 註冊與收據驗證類型。（參考文件即將上線。）",
      },
      {
        title: "Python",
        body: "服務端與自動化用 Python 客戶端。（參考文件即將上線。）",
      },
      {
        title: "REST API",
        body: "會話、Agent 目錄、健康檢查與測試調用的 REST 端點，OpenAPI 規格將在此發布。",
      },
    ],
    comingSoon: "我們正在補齊 API 與 SDK 詳細文檔，請先依快速開始接入你的第一個 Agent。",
    ctaQuickstart: "快速開始 →",
    ctaDevelopers: "開發者",
    seoTitle: "SDK & API - GaiaLynk 開發者",
    seoDescription: "GaiaLynk Agent IM 的 TypeScript、Python 與 REST 整合說明。",
  },
  "zh-Hans": {
    title: "SDK & API 参考",
    description: "使用 TypeScript、Python 或 REST 对接你的 Agent。完整参考内容陆续上线，可先按快速开始完成接入。",
    back: "返回开发者",
    sections: [
      {
        title: "TypeScript / JavaScript",
        body: "Node.js 与浏览器用官方 SDK，含会话、Agent 注册与收据验证类型。（参考文档即将上线。）",
      },
      {
        title: "Python",
        body: "服务端与自动化用 Python 客户端。（参考文档即将上线。）",
      },
      {
        title: "REST API",
        body: "会话、Agent 目录、健康检查与测试调用的 REST 端点，OpenAPI 规格将在此发布。",
      },
    ],
    comingSoon: "我们正在补齐 API 与 SDK 详细文档，请先按快速开始接入你的第一个 Agent。",
    ctaQuickstart: "快速开始 →",
    ctaDevelopers: "开发者",
    seoTitle: "SDK & API - GaiaLynk 开发者",
    seoDescription: "GaiaLynk Agent IM 的 TypeScript、Python 与 REST 集成说明。",
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
    alternates: { canonical: `/${locale}/developers/sdk` },
  };
}

/**
 * T-3.9 SDK & API Reference 页：占位结构（TypeScript / Python / REST），后续内容可迭代。
 */
export default async function SdkPage({
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
        <p className="max-w-2xl text-muted-foreground">{c.description}</p>
      </header>

      <div className="space-y-6">
        {c.sections.map((section) => (
          <section
            key={section.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
            <p className="mt-2 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        {c.comingSoon}
      </p>

      <section className="flex flex-wrap gap-4 border-t border-border pt-8">
        <Link
          href={`/${locale}/developers/quickstart`}
          className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {c.ctaQuickstart}
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
