import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildAuthCookieResponse } from "@/lib/identity/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "email and password are required" } },
      { status: 400 },
    );
  }
  try {
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    const accessToken = data?.data?.access_token;
    const refreshToken = data?.data?.refresh_token;
    const user = data?.data?.user;
    if (!accessToken || !refreshToken || !user?.id) {
      return NextResponse.json(
        { error: { code: "invalid_response", message: "Invalid auth response" } },
        { status: 502 },
      );
    }
    return buildAuthCookieResponse(accessToken, refreshToken, 200, {
      data: { user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Auth service unreachable" } },
      { status: 502 },
    );
  }
}
