import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

type InviteBody = {
  email?: string;
  role_ids?: string[];
};

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as InviteBody;
  if (!body.email || !Array.isArray(body.role_ids) || body.role_ids.length === 0) {
    return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  }

  const upstream = await gatewayFetch(
    "/iam/invitations",
    {
      method: "POST",
      body: JSON.stringify({ email: body.email, role_ids: body.role_ids }),
    },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
