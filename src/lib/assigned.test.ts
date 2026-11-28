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
    expect(assignedItems(rows, "me").map((row) => row.id).sort()).toEqual(["1", "2"]);
  });

  it("excludes items assigned to other people or nobody", () => {
    const rows = [item("1", "me"), item("2", "someone-else"), item("3", null)];
    expect(assignedItems(rows, "me").map((row) => row.id)).toEqual(["1"]);
  });

  it("orders in progress, to do, review, blocked, then done", () => {
    const rows = [
      item("1", "me", "DONE"),
      item("2", "me", "TODO"),
      item("3", "me", "IN_REVIEW"),
      item("4", "me", "IN_PROGRESS"),
      item("5", "me", "BLOCKED"),
    ];
    expect(assignedItems(rows, "me").map((row) => row.status)).toEqual([
      "IN_PROGRESS",
      "TODO",
      "IN_REVIEW",
      "BLOCKED",
      "DONE",
    ]);
  });

  it("keeps backlog order within the same status", () => {
    const rows = [item("a", "me", "TODO"), item("b", "me", "TODO"), item("c", "me", "TODO")];
    expect(assignedItems(rows, "me").map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("places unknown statuses last", () => {
    const rows = [item("1", "me", "SOMEDAY"), item("2", "me", "DONE")];
    expect(assignedItems(rows, "me").map((row) => row.id)).toEqual(["2", "1"]);
  });
});
