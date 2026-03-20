import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildAuthCookieResponse, getRefreshTokenFromRequest } from "@/lib/identity/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  let refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token.trim() : null;
  if (!refreshToken) {
    refreshToken = getRefreshTokenFromRequest(request);
  }
  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "refresh_token required" } },
      { status: 400 },
    );
  }
  try {
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    const accessToken = data?.data?.access_token;
    const newRefreshToken = data?.data?.refresh_token;
    const user = data?.data?.user;
    if (!accessToken || !newRefreshToken || !user?.id) {
      return NextResponse.json(
        { error: { code: "invalid_response", message: "Invalid refresh response" } },
        { status: 502 },
      );
    }
    return buildAuthCookieResponse(accessToken, newRefreshToken, 200, {
      data: { user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Auth service unreachable" } },
      { status: 502 },
    );
  }
}
