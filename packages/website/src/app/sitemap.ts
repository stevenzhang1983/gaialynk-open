import type { MetadataRoute } from "next";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const ROUTES = [
  "",
  "/ask",
  "/recovery-hitl",
  "/subscriptions",
  "/connectors-governance",
  "/developers",
  "/developers/evidence",
  "/developers/quickstart",
  "/developers/sdk",
  "/developers/protocol",
  "/topology",
  "/trust",
  "/use-cases",
  "/use-cases/enterprise-governance",
  "/pricing",
  "/about",
  "/demo",
  "/node-collaboration",
  "/analytics",
  "/settings",
  "/privacy",
  "/cookies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://gaialynk.com";
  const now = new Date();

  return SUPPORTED_LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: `${base}/${locale}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
  );
}
