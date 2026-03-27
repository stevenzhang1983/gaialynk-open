import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

function buildMainlineNotionUrl(request: NextRequest, segments: string[]): string {
  const base = getMainlineApiUrl();
  const sub = segments.length > 0 ? segments.join("/") : "authorize";
  const q = new URL(request.url).searchParams.toString();
  return `${base}/api/v1/connectors/cloud/notion/${sub}${q ? `?${q}` : ""}`;
}

async function proxyToMainline(request: NextRequest, segments: string[]): Promise<Response> {
  const url = buildMainlineNotionUrl(request, segments);
  try {
    return await fetch(url, {
      method: request.method,
      headers: buildMainlineActorHeaders(request),
      redirect: "manual",
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

/**
 * W-17：代理 Notion OAuth 起点（GET/POST）至主线；透传 3xx 到 Notion 或成功页。
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await params;
  const res = await proxyToMainline(request, path);
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get("location");
    if (loc) {
      return NextResponse.redirect(loc, res.status);
    }
  }
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
  const url = buildMainlineNotionUrl(request, path.length > 0 ? path : ["authorize"]);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: buildMainlineActorHeaders(request, { includeJsonContentType: true }),
      body: await request.text(),
      redirect: "manual",
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (loc) {
        return NextResponse.redirect(loc, res.status);
      }
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
