import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { item_ids?: string[] };
  if (!body.item_ids || body.item_ids.length === 0) {
    return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  }
  const upstream = await gatewayFetch(
    `/tasks/sprints/${id}/items`,
    { method: "POST", body: JSON.stringify({ item_ids: body.item_ids }) },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const itemId = new URL(request.url).searchParams.get("item_id");
  if (!itemId) return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  const upstream = await gatewayFetch(
    `/tasks/sprints/${id}/items/${itemId}`,
    { method: "DELETE" },
    token,
  );
  return new NextResponse(null, { status: upstream.status });
}
