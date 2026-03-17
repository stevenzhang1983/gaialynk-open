import { NextRequest, NextResponse } from "next/server";
import { SESSION_USER_COOKIE } from "@/lib/identity/session";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const userId =
    body && typeof body === "object" && "user_id" in body && typeof body.user_id === "string"
      ? body.user_id.trim()
      : "";
  if (!userId) {
    return NextResponse.json(
      { error: { code: "validation_error", message: "user_id is required" } },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ data: { user_id: userId } }, { status: 200 });
  response.cookies.set(SESSION_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

