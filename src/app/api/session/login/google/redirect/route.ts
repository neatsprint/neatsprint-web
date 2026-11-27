import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE, gatewayFetch } from "@/lib/session";
import { googleErrorReason } from "@/lib/google-error";

function origin(request: Request): string {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const credential = form?.get("credential");
  const formToken = form?.get("g_csrf_token");
  const cookieToken = (await cookies()).get("g_csrf_token")?.value;

  if (
    typeof credential !== "string" ||
    !credential ||
    !formToken ||
    !cookieToken ||
    String(formToken) !== cookieToken
  ) {
    return NextResponse.redirect(new URL("/login?google_error=csrf", origin(request)));
  }

  const upstream = await gatewayFetch("/auth/social/google", {
    method: "POST",
    body: JSON.stringify({ id_token: credential }),
  });
  if (!upstream.ok) {
    const body = (await upstream.json().catch(() => ({}))) as { code?: string };
    const reason = googleErrorReason(upstream.status, body.code);
    return NextResponse.redirect(new URL(`/login?google_error=${reason}`, origin(request)));
  }
  const payload = (await upstream.json().catch(() => ({}))) as {
    data?: { access_token?: string; refresh_token?: string };
  };
  if (!payload.data?.access_token || !payload.data.refresh_token) {
    return NextResponse.redirect(new URL("/login?google_error=failed", origin(request)));
  }

  const response = NextResponse.redirect(new URL("/admin/users", origin(request)), 303);
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
