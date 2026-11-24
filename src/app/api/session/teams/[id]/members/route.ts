import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    user_id?: string;
    role_in_team?: string;
  };
  if (!body.user_id) {
    return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  }
  const upstream = await gatewayFetch(
    `/teams/${id}/members`,
    {
      method: "POST",
      body: JSON.stringify({
        user_id: body.user_id,
        role_in_team: body.role_in_team ?? "MEMBER",
      }),
    },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
