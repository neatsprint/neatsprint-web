import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, gatewayFetch, getAccessToken } from "@/lib/session";

export async function POST() {
  const token = await getAccessToken();
  if (token) {
    await gatewayFetch("/auth/logout", { method: "POST" }, token).catch(() => null);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}
