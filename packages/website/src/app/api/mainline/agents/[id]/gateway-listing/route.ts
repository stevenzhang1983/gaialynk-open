import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * E-7 / W-13：代理 PATCH /api/v1/agents/:id/gateway-listing（上架字段：并发、队列、超时、排程、记忆层）。
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(
      `${getMainlineApiUrl()}/api/v1/agents/${encodeURIComponent(id)}/gateway-listing`,
      {
        method: "PATCH",
        headers: buildMainlineActorHeaders(request, { includeJsonContentType: true }),
        body: JSON.stringify(body),
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
