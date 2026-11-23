// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./data-table";
import { Drawer } from "./drawer";
import { EmptyState } from "./empty-state";
import { KanbanColumn } from "./kanban-column";
import { PriorityBadge, StatusBadge } from "./task-badges";
import { UserPill } from "./user-pill";

afterEach(cleanup);

describe("shared UI primitives", () => {
  it("renders empty state copy and action", () => {
    render(
      <EmptyState
        title="No matches"
        description="Try a different term."
        action={<button type="button">Clear filters</button>}
      />,
    );
    expect(screen.getByText("No matches")).toBeTruthy();
    expect(screen.getByText("Try a different term.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeTruthy();
  });

  it("renders status and priority badges", () => {
    render(
      <div>
        <StatusBadge status="IN_PROGRESS" />
        <PriorityBadge priority="URGENT" />
      </div>,
    );
    expect(screen.getByText("In progress")).toBeTruthy();
    expect(screen.getByText("URGENT")).toBeTruthy();
  });

  it("renders assigned and unassigned users", () => {
    render(
      <div>
        <UserPill name="Mia Member" />
        <UserPill name={null} />
      </div>,
    );
    expect(screen.getByText("Mia Member")).toBeTruthy();
    expect(screen.getByText("MM")).toBeTruthy();
    expect(screen.getByText("Unassigned")).toBeTruthy();
  });

  it("renders table headers and rows", () => {
    render(
      <DataTable
        label="Demo"
        columns={[{ key: "key", label: "Key" }, { key: "title", label: "Title" }]}
      >
        <tbody>
          <tr>
            <td>AUTH-1</td>
            <td>First task</td>
          </tr>
        </tbody>
      </DataTable>,
    );
    expect(screen.getByRole("table", { name: "Demo" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Key" })).toBeTruthy();
    expect(screen.getByText("First task")).toBeTruthy();
  });

  it("renders a kanban column with an empty label", () => {
    render(<KanbanColumn label="Done" count={0} emptyLabel="Nothing done yet" />);
    expect(screen.getByLabelText("Done column")).toBeTruthy();
    expect(screen.getByText("Nothing done yet")).toBeTruthy();
  });

  it("closes the drawer with Escape", () => {
    const onClose = vi.fn();
    render(
      <Drawer title="Item" subtitle="AUTH-1" onClose={onClose}>
        <p>Body</p>
      </Drawer>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
