import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiData } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiData", () => {
  it("unwraps the success envelope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { ping: "pong" }, meta: { request_id: "r1" } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

    await expect(apiData<{ ping: string }>("/ping")).resolves.toEqual({ ping: "pong" });
  });

  it("throws a typed ApiError with the problem code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: "https://docs.neatsprint.com/errors/permission_denied",
            title: "Permission denied",
            status: 403,
            code: "permission_denied",
            detail: "You cannot do that.",
          }),
          { status: 403, headers: { "content-type": "application/problem+json" } },
        ),
      ),
    );

    await expect(apiData("/tasks/backlog")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      code: "permission_denied",
    });
  });

  it("falls back when the error body is not a problem document", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("oops", { status: 502 })));

    await expect(apiData("/healthz")).rejects.toBeInstanceOf(ApiError);
  });
});
