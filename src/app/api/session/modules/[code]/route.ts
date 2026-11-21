import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function PUT(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { code } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = body.enabled === true;
  const upstream = await gatewayFetch(
    `/core/tenant-applications/${code}?enabled=${enabled ? "true" : "false"}`,
    { method: "PUT" },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
