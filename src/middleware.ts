import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = "ns_access";
const REFRESH_COOKIE = "ns_refresh";

function apiBase(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8000/api/v1"
  );
}

function accessTokenExpiring(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const part = token.split(".")[1] ?? "";
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64)) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 - Date.now() < 60_000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!accessTokenExpiring(access)) {
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${apiBase()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!response.ok) throw new Error("refresh failed");
    const body = (await response.json()) as {
      data: { access_token: string; refresh_token: string };
    };
    const headers = new Headers(request.headers);
    headers.set(
      "cookie",
      `${ACCESS_COOKIE}=${body.data.access_token}; ${REFRESH_COOKIE}=${body.data.refresh_token}`,
    );
    const next = NextResponse.next({ request: { headers } });
    const secure = process.env.NODE_ENV === "production";
    next.cookies.set(ACCESS_COOKIE, body.data.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 15,
    });
    next.cookies.set(REFRESH_COOKIE, body.data.refresh_token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return next;
  } catch {
    const login = NextResponse.redirect(new URL("/login", request.url));
    login.cookies.delete(ACCESS_COOKIE);
    login.cookies.delete(REFRESH_COOKIE);
    return login;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
