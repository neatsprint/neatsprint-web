import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function GET(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const query = new URL(request.url).search;
  const upstream = await gatewayFetch(`/work/entries${query}`, {}, token);
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const upstream = await gatewayFetch(
    "/work/entries",
    { method: "POST", body: JSON.stringify(body) },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
