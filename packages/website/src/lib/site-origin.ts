/**
 * 当未设置 NEXT_PUBLIC_SITE_URL 时使用的生产站点根（例如本地 build、CI 未注入变量）。
 * 自定义域名上线后，应在 Vercel / CI 中设置 NEXT_PUBLIC_SITE_URL，无需改此常量。
 */
export const SITE_ORIGIN_FALLBACK = "https://gaialynk-a2a.vercel.app";

export function getSiteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_ORIGIN_FALLBACK).replace(/\/$/, "");
}
