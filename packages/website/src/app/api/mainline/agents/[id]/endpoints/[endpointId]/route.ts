import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * E-7 / W-13：代理 DELETE /api/v1/agents/:id/endpoints/:endpointId。
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; endpointId: string }> },
) {
  const { id, endpointId } = await params;
  try {
    const res = await fetch(
      `${getMainlineApiUrl()}/api/v1/agents/${encodeURIComponent(id)}/endpoints/${encodeURIComponent(endpointId)}`,
      {
        method: "DELETE",
        headers: buildMainlineActorHeaders(request),
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
