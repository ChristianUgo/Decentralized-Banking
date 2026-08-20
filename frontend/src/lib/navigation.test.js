import { describe, expect, it } from "vitest";

import { findNavigationItem, isNavigationItemActive, primaryNavigation } from "./navigation";

describe("primary navigation", () => {
  it("preserves every source-project banking route", () => {
    expect(primaryNavigation.map(({ href }) => href)).toEqual([
      "/dashboard",
      "/deposit",
      "/borrow",
      "/repay",
      "/liquidity",
    ]);
  });

  it("uses liquidation as the clear label for the legacy liquidity route", () => {
    expect(findNavigationItem("/liquidity")).toEqual({
      href: "/liquidity",
      label: "Liquidation",
    });
  });

  it("returns null for a route outside the banking navigation", () => {
    expect(findNavigationItem("/unknown")).toBeNull();
  });

  it("marks exact and nested banking routes active without matching similar paths", () => {
    expect(isNavigationItemActive("/borrow", "/borrow")).toBe(true);
    expect(isNavigationItemActive("/borrow/review", "/borrow")).toBe(true);
    expect(isNavigationItemActive("/borrower", "/borrow")).toBe(false);
    expect(isNavigationItemActive(null, "/borrow")).toBe(false);
  });
});
