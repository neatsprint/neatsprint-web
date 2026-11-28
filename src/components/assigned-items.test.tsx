// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AssignedItems } from "./assigned-items";

afterEach(cleanup);

const rows = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    key: `AUTH-${index + 1}`,
    title: `Task number ${index + 1}`,
    status: index === 0 ? "DONE" : "IN_PROGRESS",
  }));

describe("AssignedItems", () => {
  it("shows a hint when nothing is in an active sprint", () => {
    render(<AssignedItems items={[]} />);
    expect(screen.getByText("No active-sprint items.")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
  });

  it("shows every item when there are five or fewer", () => {
    render(<AssignedItems items={rows(2)} />);
    expect(screen.getByText("Task number 1")).toBeTruthy();
    expect(screen.getByText("Task number 2")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the status of each item", () => {
    render(<AssignedItems items={rows(2)} />);
    expect(screen.getByText("Done")).toBeTruthy();
    expect(screen.getByText("In progress")).toBeTruthy();
  });

  it("caps the list at five and expands with More", () => {
    render(<AssignedItems items={rows(7)} />);
    expect(screen.getByText("Task number 5")).toBeTruthy();
    expect(screen.queryByText("Task number 6")).toBeNull();

    const more = screen.getByRole("button", { name: "More… (2)" });
    fireEvent.click(more);
    expect(screen.getByText("Task number 6")).toBeTruthy();
    expect(screen.getByText("Task number 7")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Show less" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Show less" }));
    expect(screen.queryByText("Task number 6")).toBeNull();
  });
});
