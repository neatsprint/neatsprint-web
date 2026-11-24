// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BacklogClient, type BacklogItem } from "@/app/projects/[id]/backlog/backlog-client";
import { GlobalSearch } from "@/components/global-search";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const ITEMS: BacklogItem[] = [
  {
    id: "1",
    key: "AUTH-1",
    type: "TASK",
    title: "First task",
    status: "TODO",
    priority: "HIGH",
    estimate_points: 3,
    assignee_id: null,
    sprint_id: null,
  },
];

afterEach(cleanup);

describe("accessibility", () => {
  it("backlog has no axe violations", async () => {
    const { container } = render(
      <BacklogClient
        projectId="p1"
        initialItems={ITEMS}
        sprints={[]}
        users={[]}
        canEdit
        canTransition
        canAssign
        canDelete
      />,
    );
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });

  it("global search trigger has no axe violations", async () => {
    const { container } = render(<GlobalSearch />);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
