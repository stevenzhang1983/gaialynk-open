import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildAuthCookieResponse } from "@/lib/identity/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "provider" || body?.role === "consumer" ? body.role : undefined;
  if (!email || !password) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "email and password are required" } },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "password must be at least 8 characters" } },
      { status: 400 },
    );
  }
  try {
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, role }),
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
    return buildAuthCookieResponse(accessToken, refreshToken, 201, {
      data: { user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Auth service unreachable" } },
      { status: 502 },
    );
  }
}
