import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const base = getMainlineApiUrl();
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const url = `${base}/api/v1/user-task-instances/${id}/export${query ? `?${query}` : ""}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request),
    });
    const contentType = res.headers.get("content-type") ?? "application/json";
    if (contentType.includes("text/csv")) {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
