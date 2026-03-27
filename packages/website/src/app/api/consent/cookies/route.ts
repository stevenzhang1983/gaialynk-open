import { NextRequest, NextResponse } from "next/server";

/**
 * W-19：Cookie 同意记录占位（未来合规审计）；当前仅校验形状并 204。
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: { code: "invalid_body", message: "Invalid JSON" } }, { status: 400 });
    }
    if (body.necessary !== true) {
      return NextResponse.json({ error: { code: "invalid_body", message: "necessary must be true" } }, { status: 400 });
    }
    if (typeof body.analytics !== "boolean" || typeof body.marketing !== "boolean") {
      return NextResponse.json(
        { error: { code: "invalid_body", message: "analytics and marketing must be booleans" } },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: { code: "invalid_body", message: "Invalid JSON" } }, { status: 400 });
  }
  return new NextResponse(null, { status: 204 });
}
