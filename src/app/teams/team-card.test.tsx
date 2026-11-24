// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TeamCard } from "./team-card";

const TEAM = {
  id: "t1",
  name: "Backend Squad",
  description: "Core services",
  lead_id: "u1",
};

const USERS = [
  { id: "u1", full_name: "Leo Lead", email: "lead@example.com", status: "ACTIVE" },
  { id: "u2", full_name: "Mia Member", email: "member@example.com", status: "ACTIVE" },
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TeamCard", () => {
  it("adds an active user to the team", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TeamCard
        team={TEAM}
        initialMembers={[{ user_id: "u1", role_in_team: "LEAD" }]}
        users={USERS}
        canManage
      />,
    );

    expect(screen.getByText("1 members")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Add a member to Backend Squad"), {
      target: { value: "u2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.getByText("Mia Member")).toBeTruthy());
    expect(screen.getByText("2 members")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/session/teams/t1/members",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
