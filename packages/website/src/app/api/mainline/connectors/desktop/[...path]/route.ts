import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

function buildMainlineDesktopUrl(request: NextRequest, segments: string[]): string {
  const base = getMainlineApiUrl();
  const sub = segments.join("/");
  const q = new URL(request.url).searchParams.toString();
  return `${base}/api/v1/connectors/desktop/${sub}${q ? `?${q}` : ""}`;
}

async function proxyToMainline(request: NextRequest, segments: string[]): Promise<Response> {
  const url = buildMainlineDesktopUrl(request, segments);
  try {
    return await fetch(url, {
      method: request.method,
      headers: buildMainlineActorHeaders(request, {
        includeJsonContentType: request.method !== "GET" && request.method !== "DELETE",
      }),
      body:
        request.method === "GET" || request.method === "DELETE" ? undefined : await request.text(),
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

/** W-22：透传主线桌面 Connector API（配对、设备列表、解绑、执行、写入确认等）。 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const res = await proxyToMainline(request, path);
  if (res.status === 502) {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const res = await proxyToMainline(request, path);
  if (res.status === 502) {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const res = await proxyToMainline(request, path);
  if (res.status === 502) {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}
