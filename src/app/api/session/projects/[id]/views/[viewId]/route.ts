import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; viewId: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id, viewId } = await context.params;
  const upstream = await gatewayFetch(
    `/tasks/projects/${id}/views/${viewId}`,
    { method: "DELETE" },
    token,
  );
  return new NextResponse(null, { status: upstream.status });
}
