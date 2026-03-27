import type { Metadata } from "next";
import { HelpCenterClient } from "@/components/marketing/help-center-client";
import { RichLine } from "@/components/marketing/rich-line";
import { getHelpCenter } from "@/content/help-center";
import type { Locale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const h = getHelpCenter(locale);
  return {
    title: `${h.metaTitle} | GaiaLynk`,
    description: h.metaDescription,
  };
}

/**
 * W-11 最小版 + **W-21** + **W-22**：入门 / 连接器（含桌面 Connector 三篇）/ 隐私与安全 / 故障排查；增量短文；状态标签与搜索。
 */
export default async function HelpPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const bundle = getHelpCenter(locale);

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="font-display text-h1 font-bold leading-tight tracking-tight text-foreground md:text-[clamp(2rem,2.2vw+1.5rem,2.75rem)] md:leading-snug">
          {bundle.title}
        </h1>
        <p className="max-w-[65ch] text-body-lg leading-body-relaxed text-muted-foreground">
          <RichLine text={bundle.subtitle} />
        </p>
      </header>
      <HelpCenterClient locale={locale} bundle={bundle} />
    </div>
  );
}
