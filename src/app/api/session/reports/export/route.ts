import { NextResponse } from "next/server";

import { gatewayFetch, getAccessToken } from "@/lib/session";

export async function GET(request: Request) {
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ code: "unauthenticated" }, { status: 401 });
  const query = new URL(request.url).search;
  const upstream = await gatewayFetch(`/reports/export${query}`, {}, token);
  if (!upstream.ok) return new NextResponse(null, { status: upstream.status });
  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "text/csv",
      "Content-Disposition":
        upstream.headers.get("content-disposition") ?? 'attachment; filename="report.csv"',
    },
  });
}
