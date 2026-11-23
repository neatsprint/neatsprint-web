import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { status?: string };
  if (!body.status) return NextResponse.json({ code: "validation_failed" }, { status: 422 });

  const upstream = await gatewayFetch(
    `/tasks/backlog/${id}/transition`,
    { method: "POST", body: JSON.stringify({ status: body.status }) },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
