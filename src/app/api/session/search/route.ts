import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function GET(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ data: { projects: [], items: [], users: [] } });
  const encoded = encodeURIComponent(q);
  const [tasks, users] = await Promise.all([
    gatewayFetch(`/tasks/search?q=${encoded}`, {}, token),
    gatewayFetch(`/iam/users?search=${encoded}&per_page=10`, {}, token),
  ]);
  const taskPayload = tasks.ok
    ? ((await tasks.json()) as {
        data: { projects: unknown[]; items: unknown[] };
      }).data
    : { projects: [], items: [] };
  const userPayload = users.ok
    ? ((await users.json()) as { data: unknown[] }).data
    : [];
  return NextResponse.json({
    data: { ...taskPayload, users: userPayload },
  });
}
