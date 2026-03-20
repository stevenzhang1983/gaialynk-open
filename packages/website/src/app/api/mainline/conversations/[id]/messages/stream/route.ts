import { NextRequest } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * Proxy SSE stream from mainline GET /api/v1/conversations/:id/messages/stream.
 * Next.js forwards the stream so the client can use EventSource on this URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const base = getMainlineApiUrl().replace(/\/$/, "");
    const url = `${base}/api/v1/conversations/${id}/messages/stream`;
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request),
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      return Response.json(data, { status: res.status });
    }
    return new Response(res.body, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return Response.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
