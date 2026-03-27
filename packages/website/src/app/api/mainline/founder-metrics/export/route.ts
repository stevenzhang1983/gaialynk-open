import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") ?? "7";
    const limit = searchParams.get("limit") ?? "50000";
    const url = `${getMainlineApiUrl()}/api/v1/founder-metrics/export.csv?days=${encodeURIComponent(days)}&limit=${encodeURIComponent(limit)}`;
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request),
    });
    const body = await res.text();
    const ct = res.headers.get("content-type") ?? "text/csv; charset=utf-8";
    const cd = res.headers.get("content-disposition") ?? "";
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": ct,
        ...(cd ? { "Content-Disposition": cd } : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
