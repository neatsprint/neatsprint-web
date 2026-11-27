import { describe, expect, it } from "vitest";

import { googleErrorMessage, googleErrorReason } from "./google-error";

describe("googleErrorMessage", () => {
  it("returns null without a reason", () => {
    expect(googleErrorMessage(null)).toBeNull();
  });

  it("explains an invitation problem instead of blaming OAuth config", () => {
    const message = googleErrorMessage("not_invited");
    expect(message).toContain("isn't invited");
    expect(message).not.toMatch(/OAuth/);
  });

  it("keeps the CSRF message", () => {
    expect(googleErrorMessage("csrf")).toMatch(/could not be verified/);
  });

  it("does not blame OAuth config for generic failures", () => {
    const message = googleErrorMessage("failed");
    expect(message).not.toMatch(/OAuth/);
    expect(message).toMatch(/email and password/);
  });
});

describe("googleErrorReason", () => {
  it("maps invitation_required to not_invited", () => {
    expect(googleErrorReason(403, "invitation_required")).toBe("not_invited");
  });

  it("maps an invalid Google token to rejected", () => {
    expect(googleErrorReason(401, "invalid_social_token")).toBe("rejected");
  });

  it("falls back to failed", () => {
    expect(googleErrorReason(500, "internal_error")).toBe("failed");
    expect(googleErrorReason(403, "permission_denied")).toBe("failed");
  });
});
