import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function PATCH(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const upstream = await gatewayFetch(
    "/core/tenants/current/settings",
    { method: "PATCH", body: JSON.stringify(body) },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
