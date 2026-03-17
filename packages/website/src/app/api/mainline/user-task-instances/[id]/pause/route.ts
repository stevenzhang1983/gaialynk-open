import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const base = getMainlineApiUrl();
  const url = `${base}/api/v1/user-task-instances/${id}/pause`;
  try {
    const body = await request.json();
    const res = await fetch(url, {
      method: "POST",
      headers: buildMainlineActorHeaders(request, { includeJsonContentType: true }),
      body: JSON.stringify(body),
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
