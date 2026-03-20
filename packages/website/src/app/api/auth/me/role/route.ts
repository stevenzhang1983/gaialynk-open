import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { getAccessTokenFromRequest } from "@/lib/identity/session";

/**
 * T-4.6 设置/切换用户角色：代理到 mainline PUT /api/v1/auth/me/role。
 */
export async function PUT(request: NextRequest) {
  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Not signed in" } },
      { status: 401 },
    );
  }
  const body = await request.json().catch(() => ({}));
  const role = body?.role === "provider" || body?.role === "consumer" ? body.role : null;
  if (!role) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "role must be provider or consumer" } },
      { status: 400 },
    );
  }
  try {
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/auth/me/role`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Auth service unreachable" } },
      { status: 502 },
    );
  }
}
