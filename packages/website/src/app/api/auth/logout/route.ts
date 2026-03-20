import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/identity/session";

export async function POST() {
  const res = NextResponse.json({ data: { ok: true } }, { status: 200 });
  return clearAuthCookies(res);
}
