import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    project_id?: string;
    name?: string;
    goal?: string;
  };
  if (!body.project_id || !body.name) {
    return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  }
  const upstream = await gatewayFetch(
    "/tasks/sprints",
    {
      method: "POST",
      body: JSON.stringify({
        project_id: body.project_id,
        name: body.name,
        goal: body.goal ?? null,
      }),
    },
    token,
  );
  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
