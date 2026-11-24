import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const upstream = await gatewayFetch(`/monitor/screenshots/${id}/content`, {}, token);
  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }
  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, no-store",
    },
  });
}
