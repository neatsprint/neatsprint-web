// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BacklogClient, type BacklogItem } from "./backlog-client";

const ITEMS: BacklogItem[] = [
  {
    id: "1",
    key: "AUTH-1",
    type: "TASK",
    title: "First task",
    status: "TODO",
    priority: "LOW",
    estimate_points: 3,
    assignee_id: null,
    sprint_id: null,
  },
  {
    id: "2",
    key: "AUTH-2",
    type: "BUG",
    title: "Second task",
    status: "IN_PROGRESS",
    priority: "HIGH",
    estimate_points: 5,
    assignee_id: "u1",
    sprint_id: "s1",
  },
];

const SPRINTS = [{ id: "s1", name: "Sprint 1", state: "ACTIVE" }];
const USERS = [
  { id: "u1", full_name: "Mia Member", email: "member@example.com", status: "ACTIVE" },
];

function renderBacklog(items: BacklogItem[] = ITEMS) {
  return render(
    <BacklogClient
      projectId="p1"
      initialItems={items}
      sprints={SPRINTS}
      users={USERS}
      canEdit
      canTransition
      canAssign
      canDelete
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BacklogClient", () => {
  it("groups by status and can regroup by priority", () => {
    renderBacklog();
    const headers = () =>
      screen.getAllByTestId("group-header").map((node) => node.textContent);

    expect(headers()).toEqual(["To do", "In progress"]);
    fireEvent.change(screen.getByLabelText("Group backlog"), {
      target: { value: "priority" },
    });
    expect(headers()).toEqual(["LOW", "HIGH"]);
  });

  it("selects rows and moves focus with the keyboard", async () => {
    renderBacklog();
    const first = screen.getByTestId("row-AUTH-1");
    first.focus();
    fireEvent.keyDown(first, { key: " " });
    expect(screen.getByTestId("bulk-bar").textContent).toContain("1 selected");

    fireEvent.keyDown(first, { key: "ArrowDown" });
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId("row-AUTH-2"));
    });
  });

  it("applies a priority to every selected item", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    renderBacklog();

    fireEvent.click(screen.getByLabelText("Select AUTH-1"));
    fireEvent.click(screen.getByLabelText("Select AUTH-2"));
    fireEvent.change(screen.getByLabelText("Set priority for selected items"), {
      target: { value: "URGENT" },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const calls = fetchMock.mock.calls as [string, RequestInit][];
    const patches = calls.filter(
      ([url, init]) => url.startsWith("/api/session/items/") && init?.method === "PATCH",
    );
    expect(patches).toHaveLength(2);
    expect(patches[0]?.[1]?.body ?? "").toContain('"priority":"URGENT"');
    await waitFor(() => expect(screen.queryByTestId("bulk-bar")).toBeNull());
  });

  it("edits a title inline from the keyboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    renderBacklog();

    const row = screen.getByTestId("row-AUTH-1");
    expect(screen.getByText("First task").getAttribute("title")).toBe(
      "Double-click or press E to edit",
    );
    row.focus();
    fireEvent.keyDown(row, { key: "e" });
    const input = screen.getByLabelText("Edit AUTH-1 title");
    fireEvent.change(input, { target: { value: "Renamed task" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/session/items/1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(screen.getByText("Renamed task")).toBeTruthy();
  });

  it("creates a backlog item from the drawer", async () => {
    const created: BacklogItem = {
      id: "3",
      key: "AUTH-3",
      type: "TASK",
      title: "New task",
      status: "TODO",
      priority: "MEDIUM",
      estimate_points: null,
      assignee_id: null,
      sprint_id: null,
    };
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/views")) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: created }) });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderBacklog();

    fireEvent.click(screen.getByRole("button", { name: "New item" }));
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "New task" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create item" }));

    await waitFor(() => expect(screen.getByText("New task")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session/projects/p1/backlog",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("shows the empty-backlog state", () => {
    renderBacklog([]);
    expect(screen.getByText("This backlog is empty")).toBeTruthy();
  });
});
