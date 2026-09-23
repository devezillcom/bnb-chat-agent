import {
  BotIcon,
  CableIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  labelKey: string;
  segment: string;
  icon: LucideIcon;
};

export type DashboardNavGroup = {
  labelKey: string;
  items: DashboardNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
};

export const DASHBOARD_DAILY_NAV_ITEMS: DashboardNavItem[] = [
  { labelKey: "nav.agents", segment: "agents", icon: BotIcon },
  { labelKey: "nav.connections", segment: "connections", icon: CableIcon },
];

export const DASHBOARD_SETTINGS_NAV_ITEM: DashboardNavItem = {
  labelKey: "nav.workspaceSettings",
  segment: "settings/workspace",
  icon: SettingsIcon,
};

export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    labelKey: "nav.daily",
    items: DASHBOARD_DAILY_NAV_ITEMS,
  },
];

export function getDashboardNavHref(
  workspaceIndex: number,
  segment: string,
): string {
  return `/w/${workspaceIndex}/${segment}`;
}

export function isDashboardNavActive(
  pathname: string,
  href: string,
  segment: string,
) {
  if (segment === "settings/workspace") {
    return pathname.startsWith(`/w/`) && pathname.includes("/settings/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAnyNavItemActive(
  pathname: string,
  workspaceIndex: number,
  items: DashboardNavItem[],
) {
  return items.some((item) => {
    const href = getDashboardNavHref(workspaceIndex, item.segment);
    return isDashboardNavActive(pathname, href, item.segment);
  });
}
