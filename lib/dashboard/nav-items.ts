import {
  BookOpenIcon,
  BotIcon,
  CableIcon,
  SettingsIcon,
  SparklesIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  labelKey: string;
  segment: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { labelKey: "nav.agents", segment: "agents", icon: BotIcon },
  { labelKey: "nav.skills", segment: "skills", icon: SparklesIcon },
  { labelKey: "nav.tools", segment: "tools", icon: WrenchIcon },
  {
    labelKey: "nav.knowledgeBase",
    segment: "knowledge-base",
    icon: BookOpenIcon,
  },
  { labelKey: "nav.connections", segment: "connections", icon: CableIcon },
  {
    labelKey: "nav.settings",
    segment: "settings/workspace",
    icon: SettingsIcon,
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
