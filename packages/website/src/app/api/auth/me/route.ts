import { NextRequest, NextResponse } from "next/server";
import { getMainlineApiUrl } from "@/lib/config/mainline";
import { buildAuthCookieResponse, getAccessTokenFromRequest, getRefreshTokenFromRequest } from "@/lib/identity/session";

async function fetchMe(accessToken: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${getMainlineApiUrl()}/api/v1/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

export async function GET(request: NextRequest) {
  let accessToken = getAccessTokenFromRequest(request);
  const refreshToken = getRefreshTokenFromRequest(request);

  if (accessToken) {
    const { status, data } = await fetchMe(accessToken);
    if (status === 200 && data && typeof data === "object" && "data" in data) {
      return NextResponse.json(data, { status: 200 });
    }
    if (status === 401 && refreshToken) {
      try {
        const refreshRes = await fetch(`${getMainlineApiUrl()}/api/v1/auth/refresh`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const refreshData = await refreshRes.json().catch(() => ({}));
        if (refreshRes.ok && refreshData?.data?.access_token && refreshData?.data?.refresh_token) {
          const user = refreshData.data.user ?? {};
          const meData = { id: user.id, email: user.email, role: user.role };
          return buildAuthCookieResponse(
            refreshData.data.access_token,
            refreshData.data.refresh_token,
            200,
            { data: meData },
          );
        }
      } catch {
        // fall through to 401
      }
    }
  }

  return NextResponse.json(
    { error: { code: "unauthorized", message: "Not signed in" } },
    { status: 401 },
  );
}
