import { NextResponse } from "next/server";
import { SESSION_USER_COOKIE } from "@/lib/identity/session";

export async function POST() {
  const response = NextResponse.json({ data: { signed_out: true } }, { status: 200 });
  response.cookies.set(SESSION_USER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

