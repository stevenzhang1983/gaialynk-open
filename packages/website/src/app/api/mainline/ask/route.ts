import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";

export async function POST(request: NextRequest) {
  const base = getMainlineApiUrl();
  const url = `${base}/api/v1/ask`;
  try {
    const body = await request.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "mainline_unreachable", message: "Mainline API unreachable" } },
      { status: 502 },
    );
  }
}
