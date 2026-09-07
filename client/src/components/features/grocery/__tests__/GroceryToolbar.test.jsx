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
  statusLine: "6 remaining · 1 purchased",
  progress: 100 / 7,
  showProgress: true,
  onShare: vi.fn(),
  onHistory: vi.fn(),
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

  it("preserves sharing, invitations, history and switching between lists", () => {
    const onShare = vi.fn();
    const onHistory = vi.fn();
    const onSwitchList = vi.fn();
    render(
      <GroceryToolbar
        {...defaults}
        onShare={onShare}
        onHistory={onHistory}
        onSwitchList={onSwitchList}
        activeListLabel="Alex's list"
        invitationCount={2}
      />,
    );
    const share = screen.getByRole("button", { name: t("share.title") });
    expect(share.textContent).toContain("2");
    fireEvent.click(share);
    fireEvent.click(screen.getByRole("button", { name: t("history.open") }));
    fireEvent.click(
      screen.getByRole("button", {
        name: `${t("lists.switchTo")}: Alex's list`,
      }),
    );
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onHistory).toHaveBeenCalledTimes(1);
    expect(onSwitchList).toHaveBeenCalledTimes(1);
  });

  // History is a sheet behind one icon, not a tab: a full-width tab bar spent
  // more than a third of this screen's chrome on a destination you visit about
  // once a month, and the list is what the screen is for.
  it("offers history as a single control rather than a tab bar", () => {
    render(<GroceryToolbar {...defaults} />);
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(screen.getByRole("button", { name: t("history.open") })).toBeTruthy();
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
