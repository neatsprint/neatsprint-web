import { describe, expect, it } from "vitest";

import { assignedItems } from "./assigned";

const item = (id: string, assignee_id: string | null, status = "TODO") => ({
  id,
  key: `KEY-${id}`,
  title: `Item ${id}`,
  status,
  assignee_id,
});

describe("assignedItems", () => {
  it("keeps Done items because they are still assigned", () => {
    const rows = [item("1", "me", "DONE"), item("2", "me", "IN_PROGRESS")];
    expect(assignedItems(rows, "me").map((row) => row.id)).toEqual(["1", "2"]);
  });

  it("excludes items assigned to other people or nobody", () => {
    const rows = [item("1", "me"), item("2", "someone-else"), item("3", null)];
    expect(assignedItems(rows, "me").map((row) => row.id)).toEqual(["1"]);
  });
});
