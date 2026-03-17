import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const level = request.nextUrl.searchParams.get("level") ?? "l1";
  const base = getMainlineApiUrl();
  const url = `${base}/api/v1/ask/${id}/visualization?level=${encodeURIComponent(level)}`;
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
