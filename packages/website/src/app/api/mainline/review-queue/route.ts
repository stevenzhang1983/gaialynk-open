import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

export async function GET(request: NextRequest) {
  const base = getMainlineApiUrl();
  const url = `${base}/api/v1/review-queue`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store", headers: buildMainlineActorHeaders(request) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
