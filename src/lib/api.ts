/**
 * Typed API client for the NeatSprint gateway.
 *
 * Domain types are generated from `neatsprint-contracts` from M1 onward. Until then,
 * callers pass their own response type and the client enforces the common envelope
 * and RFC 7807 error contract.
 */

export type ApiProblem = {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string | null;
  instance?: string | null;
  request_id?: string | null;
  errors?: Array<{ field: string; code: string; message: string }>;
};

export type ApiEnvelope<T> = {
  data: T;
  meta?: { request_id?: string; [key: string]: unknown };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: ApiProblem | null;

  constructor(status: number, code: string, problem: ApiProblem | null) {
    super(problem?.detail ?? problem?.title ?? code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.problem = problem;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

function isProblem(value: unknown): value is ApiProblem {
  if (typeof value !== "object" || value === null) return false;
  return "code" in value && "status" in value;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const problem = isProblem(body) ? body : null;
    throw new ApiError(response.status, problem?.code ?? "request_failed", problem);
  }

  return body as ApiEnvelope<T>;
}

export async function apiData<T>(path: string, init: RequestInit = {}): Promise<T> {
  const envelope = await apiFetch<T>(path, init);
  return envelope.data;
}
