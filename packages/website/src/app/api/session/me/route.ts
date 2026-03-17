import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdFromRequest } from "@/lib/identity/session";

export async function GET(request: NextRequest) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: { code: "unauthorized", message: "Not signed in" } }, { status: 401 });
  }
  return NextResponse.json({ data: { user_id: userId } }, { status: 200 });
}

