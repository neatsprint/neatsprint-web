import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    name?: string;
    key?: string;
    description?: string;
  };
  if (!body.name || !body.key) {
    return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  }
  const upstream = await gatewayFetch(
    "/tasks/projects",
    {
      method: "POST",
      body: JSON.stringify({
        name: body.name,
        key: body.key.toUpperCase(),
        description: body.description ?? null,
      }),
    },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
