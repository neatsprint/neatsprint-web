import "server-only";

import { cookies } from "next/headers";

export const ACCESS_COOKIE = "ns_access";
export const REFRESH_COOKIE = "ns_refresh";

export type SessionProfile = {
  id: string;
  email: string;
  full_name: string;
  tenant_id: string;
  status: string;
  roles: string[];
  permissions: string[];
};

export function internalApiBase(): string {
  return (
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8000/api/v1"
  );
}

export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

export async function gatewayFetch(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${internalApiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function getProfile(): Promise<SessionProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const response = await gatewayFetch("/auth/me", {}, token);
  if (!response.ok) return null;
  const body = (await response.json()) as { data: SessionProfile };
  return body.data;
}

export async function requireProfile(): Promise<SessionProfile | null> {
  return getProfile();
}
