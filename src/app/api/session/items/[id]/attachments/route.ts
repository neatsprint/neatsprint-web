import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const upstream = await gatewayFetch(`/tasks/backlog/${id}/attachments`, {}, token);
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const upstream = await gatewayFetch(
    `/tasks/backlog/${id}/attachments`,
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
