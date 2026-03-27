import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  try {
    const res = await fetch(
      `${getMainlineApiUrl()}/api/v1/messages/${encodeURIComponent(id)}/report`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          ...buildMainlineActorHeaders(request),
          "content-type": "application/json",
        },
        body: JSON.stringify(body ?? {}),
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
