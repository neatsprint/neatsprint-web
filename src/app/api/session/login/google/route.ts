import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, gatewayFetch } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { id_token?: string };
  if (!body.id_token) {
    return NextResponse.json({ code: "validation_failed" }, { status: 422 });
  }
  const upstream = await gatewayFetch("/auth/social/google", {
    method: "POST",
    body: JSON.stringify({ id_token: body.id_token }),
  });
  const payload = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(payload, { status: upstream.status });

  const response = NextResponse.json({ data: payload.data?.user ?? null });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, payload.data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 15,
  });
  response.cookies.set(REFRESH_COOKIE, payload.data.refresh_token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
