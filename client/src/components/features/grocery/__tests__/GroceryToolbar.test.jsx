import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import GroceryToolbar from "../GroceryToolbar";
import translations from "../../../../translations/en/grocery";

afterEach(cleanup);
const t = (key) =>
  key.split(".").reduce((value, part) => value?.[part], translations) || key;
const defaults = {
  t,
  tab: "list",
  statusLine: "6 remaining · 1 purchased",
  progress: 100 / 7,
  showProgress: true,
  onShare: vi.fn(),
  onTabChange: vi.fn(),
};

describe("compact grocery toolbar", () => {
  it("keeps an accessible page name without a visible title and exposes list progress", () => {
    render(<GroceryToolbar {...defaults} />);
    expect(screen.getByRole("heading", { level: 1 }).className).toBe("sr-only");
    expect(screen.getByRole("status").textContent).toBe(defaults.statusLine);
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "14",
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuetext")).toBe(
      defaults.statusLine,
    );
    expect(screen.queryByRole("button", { name: /Switch to/ })).toBeNull();
  });

  it("preserves sharing, invitations, tab changes and switching between lists", () => {
    const onShare = vi.fn();
    const onTabChange = vi.fn();
    const onSwitchList = vi.fn();
    render(
      <GroceryToolbar
        {...defaults}
        onShare={onShare}
        onTabChange={onTabChange}
        onSwitchList={onSwitchList}
        activeListLabel="Alex's list"
        invitationCount={2}
      />,
    );
    const share = screen.getByRole("button", { name: t("share.title") });
    expect(share.textContent).toContain("2");
    fireEvent.click(share);
    fireEvent.click(screen.getByRole("tab", { name: t("tabs.history") }));
    fireEvent.click(
      screen.getByRole("button", {
        name: `${t("lists.switchTo")}: Alex's list`,
      }),
    );
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith("history");
    expect(onSwitchList).toHaveBeenCalledTimes(1);
  });

  it("does not show current-shopping progress over the history tab", () => {
    render(<GroceryToolbar {...defaults} tab="history" />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(
      screen
        .getByRole("tab", { name: t("tabs.history") })
        .getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("keeps visual and accessible progress within the same bounds", () => {
    const { rerender } = render(
      <GroceryToolbar {...defaults} progress={120} />,
    );
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe(
      "100",
    );
    expect(screen.getByRole("progressbar").firstElementChild.style.width).toBe(
      "100%",
    );
    rerender(<GroceryToolbar {...defaults} showProgress={false} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
