export const primaryNavigation = Object.freeze([
  { href: "/dashboard", label: "Dashboard" },
  { href: "/deposit", label: "Deposit" },
  { href: "/borrow", label: "Borrow" },
  { href: "/repay", label: "Repay" },
  { href: "/liquidity", label: "Liquidation" },
]);

export function findNavigationItem(pathname) {
  return primaryNavigation.find(({ href }) => href === pathname) ?? null;
}

export function isNavigationItemActive(pathname, href) {
  if (!pathname || !href) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}
