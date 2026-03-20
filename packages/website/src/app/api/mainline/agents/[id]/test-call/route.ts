import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * T-4.8 / T-5.4 代理：POST /api/v1/agents/:id/test-call（body 可选 message）。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/agents/${id}/test-call`, {
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
