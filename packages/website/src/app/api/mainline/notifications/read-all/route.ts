import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

export async function POST(request: NextRequest) {
  try {
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/notifications/read-all`, {
      method: "POST",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request, { includeJsonContentType: true }),
      body: "{}",
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
