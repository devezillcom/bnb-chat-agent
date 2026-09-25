import {
  BotIcon,
  CableIcon,
  HomeIcon,
  SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  labelKey: string;
  segment: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { labelKey: "nav.home", segment: "", icon: HomeIcon },
  { labelKey: "nav.agents", segment: "agents", icon: BotIcon },
  { labelKey: "nav.connections", segment: "connections", icon: CableIcon },
  {
    labelKey: "nav.workspaceSettings",
    segment: "settings/workspace",
    icon: SettingsIcon,
  },
];

export function getDashboardNavHref(
  workspaceIndex: number,
  segment: string,
): string {
  if (!segment) {
    return `/w/${workspaceIndex}`;
  }

  return `/w/${workspaceIndex}/${segment}`;
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\/$/, "") || "/";
}

export function isDashboardNavActive(
  pathname: string,
  href: string,
  segment: string,
) {
  if (!segment) {
    return normalizePathname(pathname) === normalizePathname(href);
  }

  if (segment === "settings/workspace") {
    return pathname.startsWith(`/w/`) && pathname.includes("/settings/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

