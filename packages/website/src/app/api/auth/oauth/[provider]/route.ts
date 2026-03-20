import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";

const ALLOWED_PROVIDERS = ["github", "google"] as const;

/**
 * T-4.6 OAuth 发起：重定向到 mainline 的 /api/v1/auth/oauth/:provider。
 * 前端可传 return_url（登录后希望回到的 path，如 /en/app/chat），mainline 回调时需将用户带回网站并带上 tokens（见 auth/callback 页）。
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
  const base = getMainlineApiUrl();
  const mainlineOAuthUrl = `${base}/api/v1/auth/oauth/${normalized}`;
  const res = NextResponse.redirect(mainlineOAuthUrl, 302);
  return res;
}
