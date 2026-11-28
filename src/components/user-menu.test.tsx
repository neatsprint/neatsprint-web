// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { initials, UserMenu } from "./user-menu";

afterEach(cleanup);

describe("UserMenu", () => {
  it("shows the user's initials on the trigger", () => {
    render(<UserMenu name="Laksiri Fernando" email="laksiri@example.com" onSignOut={() => {}} />);
    expect(screen.getByRole("button", { name: "Account menu for Laksiri Fernando" }).textContent).toBe(
      "LF",
    );
  });

  it("keeps the name and sign out hidden until the avatar is clicked", () => {
    render(<UserMenu name="Laksiri Fernando" email="laksiri@example.com" onSignOut={() => {}} />);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.queryByText("Laksiri Fernando")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Account menu for Laksiri Fernando" }));

    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("Laksiri Fernando")).toBeTruthy();
    expect(screen.getByText("laksiri@example.com")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeTruthy();
  });

  it("calls onSignOut from the menu item", () => {
    const onSignOut = vi.fn();
    render(<UserMenu name="Laksiri Fernando" email="laksiri@example.com" onSignOut={onSignOut} />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Laksiri Fernando" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape", () => {
    render(<UserMenu name="Laksiri Fernando" email="laksiri@example.com" onSignOut={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Laksiri Fernando" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes when clicking outside", () => {
    render(<UserMenu name="Laksiri Fernando" email="laksiri@example.com" onSignOut={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Account menu for Laksiri Fernando" }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("initials", () => {
  it("uses the first two words and upper-cases them", () => {
    expect(initials("Laksiri Fernando")).toBe("LF");
    expect(initials("  laksiri   fernando  ")).toBe("LF");
  });

  it("falls back to a single letter or question mark", () => {
    expect(initials("Laksiri")).toBe("L");
    expect(initials("   ")).toBe("?");
  });
});
