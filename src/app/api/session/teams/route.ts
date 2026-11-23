import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    description?: string;
  };
  if (!body.name) return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  const upstream = await gatewayFetch(
    "/teams",
    {
      method: "POST",
      body: JSON.stringify({ name: body.name, description: body.description ?? null }),
    },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
