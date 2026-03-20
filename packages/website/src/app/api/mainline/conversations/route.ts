import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

const base = () => getMainlineApiUrl();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.toString();
    const url = `${base()}/api/v1/conversations${query ? `?${query}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${base()}/api/v1/conversations`, {
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
