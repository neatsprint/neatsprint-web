import { describe, expect, it } from "vitest";

import { formatDuration, initials } from "./utils";

describe("formatDuration", () => {
  it("formats minutes", () => {
    expect(formatDuration(90)).toBe("1m");
    expect(formatDuration(1830)).toBe("30m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3600)).toBe("1h 0m");
    expect(formatDuration(5400)).toBe("1h 30m");
  });

  it("guards invalid input", () => {
    expect(formatDuration(-1)).toBe("0m");
    expect(formatDuration(Number.NaN)).toBe("0m");
  });
});

describe("initials", () => {
  it("takes at most two initials", () => {
    expect(initials("Laksiri Fernando")).toBe("LF");
    expect(initials("Jane")).toBe("J");
    expect(initials("  Ana Maria Silva ")).toBe("AM");
  });
});
