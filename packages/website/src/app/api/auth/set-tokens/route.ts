import { NextRequest, NextResponse } from "next/server";
import { buildAuthCookieResponse } from "@/lib/identity/session";

/**
 * T-4.6 OAuth 回调后由前端调用：用 mainline 返回的 tokens 写入 cookie，供后续请求带 Cookie 访问 /api/auth/me。
 * 仅接受 POST，body: { access_token: string; refresh_token: string }。
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const accessToken = typeof body?.access_token === "string" ? body.access_token.trim() : "";
  const refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token.trim() : "";
  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "access_token and refresh_token are required" } },
      { status: 400 },
    );
  }
  return buildAuthCookieResponse(accessToken, refreshToken, 200, { data: { ok: true } });
}
