import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * Proxy to T-5.5 GET /api/v1/approvals (pending list).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const url = `${getMainlineApiUrl()}/api/v1/approvals${query ? `?${query}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request),
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
