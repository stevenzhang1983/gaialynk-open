import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * Proxies multipart file upload to mainline `POST /api/v1/connectors/file-upload`.
 * Forwards FormData as-is; does not set Content-Type (boundary preserved).
 */
export async function POST(request: NextRequest) {
  const base = getMainlineApiUrl();
  const url = `${base}/api/v1/connectors/file-upload`;
  try {
    const formData = await request.formData();
    const res = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: buildMainlineActorHeaders(request),
      body: formData,
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
