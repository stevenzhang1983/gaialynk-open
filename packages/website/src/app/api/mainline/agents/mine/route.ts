import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildMainlineActorHeaders } from "@/lib/identity/session";

/**
 * T-4.8 / T-5.4 代理：GET /api/v1/agents/mine（当前 Provider 的 Agent 列表）。
 */
export async function GET(request: NextRequest) {
  try {
    const res = await fetch(`${getMainlineApiUrl()}/api/v1/agents/mine`, {
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
