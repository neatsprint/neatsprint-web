import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const upstream = await gatewayFetch(
    `/monitor/screenshots/${id}`,
    { method: "DELETE" },
    token,
  );
  return new NextResponse(null, { status: upstream.status });
}
