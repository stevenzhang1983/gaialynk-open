import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";

const ALLOWED_PROVIDERS = ["github", "google"] as const;

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3001"
  );
}

/**
 * T-4.6 OAuth 发起：重定向到 mainline 的 /api/v1/auth/oauth/:provider。
 * 附带 callback_url（网站的 auth/callback 页）和 return_url，mainline 完成后 302 回来。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const normalized = provider?.toLowerCase();
  if (!normalized || !ALLOWED_PROVIDERS.includes(normalized as (typeof ALLOWED_PROVIDERS)[number])) {
    return NextResponse.json(
      { error: { code: "unsupported_provider", message: "Unsupported OAuth provider" } },
      { status: 400 },
    );
  }
  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get("return_url")?.trim() || "/";

  const locale = searchParams.get("locale")?.trim() || "en";
  const siteUrl = getSiteUrl();
  const callbackUrl = `${siteUrl}/${locale}/app/auth/callback`;

  const base = getMainlineApiUrl();
  const target = new URL(`${base}/api/v1/auth/oauth/${normalized}`);
  target.searchParams.set("callback_url", callbackUrl);
  target.searchParams.set("return_url", returnUrl);

  return NextResponse.redirect(target.toString(), 302);
}
