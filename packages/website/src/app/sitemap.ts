import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/site-origin";
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
  "/developers/minimal-onboarding",
  "/topology",
  "/trust",
  "/use-cases",
  "/pricing",
  "/about",
  "/node-collaboration",
  "/analytics",
  "/settings",
  "/privacy",
  "/cookies",
  "/help",
  "/roadmap",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin();
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
