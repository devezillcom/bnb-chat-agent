import {
  BookOpenIcon,
  BotIcon,
  CableIcon,
  SparklesIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  segment: string;
  icon: LucideIcon;
};

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { label: "Chat agents", segment: "agents", icon: BotIcon },
  { label: "Skills", segment: "skills", icon: SparklesIcon },
  { label: "Tools", segment: "tools", icon: WrenchIcon },
  {
    label: "Knowledge base",
    segment: "knowledge-base",
    icon: BookOpenIcon,
  },
  { label: "Connections", segment: "connections", icon: CableIcon },
];

export function getDashboardNavHref(
  workspaceIndex: number,
  segment: string,
): string {
  return `/w/${workspaceIndex}/${segment}`;
}
