import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";

export async function GET(request: NextRequest) {
  const base = getMainlineApiUrl();
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${base}/api/v1/a2a/visualization/l3${query ? `?${query}` : ""}`;
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
