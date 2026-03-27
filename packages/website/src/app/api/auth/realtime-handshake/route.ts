import { NextRequest, NextResponse } from "next/server";
import { getMainlineWsOrigin } from "@/lib/config/mainline";
import { getAccessTokenFromRequest } from "@/lib/identity/session";

/**
 * W-16：为浏览器 WebSocket 握手提供 access_token 与主线 WS 原点（Cookie 中的 JWT 无法由 JS 读取）。
 * 客户端用返回的 token 作为 query `token=` 连接 `/api/v1/realtime/ws`（与主线 ws.gateway 对齐）。
 */
export async function GET(request: NextRequest) {
  const token = getAccessTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Not authenticated" } },
      { status: 401 },
    );
  }
  return NextResponse.json({
    data: {
      access_token: token,
      ws_origin: getMainlineWsOrigin(),
    },
  });
}
