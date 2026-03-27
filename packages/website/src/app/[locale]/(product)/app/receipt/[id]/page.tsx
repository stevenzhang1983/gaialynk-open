import type { Metadata } from "next";
import { InvocationReceiptDetailClient } from "@/components/product/receipt/invocation-receipt-detail";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "Invocation receipt",
    "zh-Hans": "调用收据",
    "zh-Hant": "呼叫收據",
  };
  return {
    title: titles[locale] ?? titles.en,
    robots: { index: false, follow: false },
  };
}

export default async function InvocationReceiptPage({ params }: PageProps) {
  const { locale, id } = await params;
  return <InvocationReceiptDetailClient locale={locale} invocationId={id} />;
}
