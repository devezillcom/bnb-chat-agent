"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "next-i18next/client";

import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_SETTINGS_NAV_ITEM,
  getDashboardNavHref,
  isAnyNavItemActive,
  isDashboardNavActive,
  type DashboardNavGroup,
  type DashboardNavItem,
} from "@/lib/dashboard/nav-items";
import type { WorkspaceListItem } from "@/lib/workspaces/types";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  workspace: WorkspaceListItem;
  workspaces: WorkspaceListItem[];
  workspaceIndex: number;
};

type SidebarNavGroupProps = {
  group: DashboardNavGroup;
  workspaceIndex: number;
  pathname: string;
  t: (key: string) => string;
};

function SidebarNavItems({
  items,
  workspaceIndex,
  pathname,
  t,
}: {
  items: DashboardNavItem[];
  workspaceIndex: number;
  pathname: string;
  t: (key: string) => string;
}) {
  return (
    <SidebarMenu>
      {items.map(({ labelKey, segment, icon: Icon }) => {
        const label = t(labelKey);
        const href = getDashboardNavHref(workspaceIndex, segment);
        const isActive = isDashboardNavActive(pathname, href, segment);

        return (
          <SidebarMenuItem key={segment}>
            <SidebarMenuButton
              tooltip={label}
              isActive={isActive}
              render={<Link href={href} />}
            >
              <Icon />
              <span>{label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function SidebarNavGroup({
  group,
  workspaceIndex,
  pathname,
  t,
}: SidebarNavGroupProps) {
  const hasActiveItem = isAnyNavItemActive(
    pathname,
    workspaceIndex,
    group.items,
  );
  const [open, setOpen] = useState(group.defaultOpen ?? true);

  useEffect(() => {
    if (group.collapsible && hasActiveItem) {
      setOpen(true);
    }
  }, [group.collapsible, hasActiveItem]);

  if (!group.collapsible) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{t(group.labelKey)}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarNavItems
            items={group.items}
            workspaceIndex={workspaceIndex}
            pathname={pathname}
            t={t}
          />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2"
        aria-expanded={open}
      >
        <SidebarGroupLabel className="flex-1 px-0">
          {t(group.labelKey)}
        </SidebarGroupLabel>
        {open ? (
          <ChevronDownIcon className="size-3.5 shrink-0" />
        ) : (
          <ChevronRightIcon className="size-3.5 shrink-0" />
        )}
      </button>
      {open ? (
        <SidebarGroupContent>
          <SidebarNavItems
            items={group.items}
            workspaceIndex={workspaceIndex}
            pathname={pathname}
            t={t}
          />
        </SidebarGroupContent>
      ) : null}
    </SidebarGroup>
  );
}

export function DashboardSidebar({
  workspace,
  workspaces,
  workspaceIndex,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { t } = useT("dashboard");
  const settingsLabel = t(DASHBOARD_SETTINGS_NAV_ITEM.labelKey);
  const settingsHref = getDashboardNavHref(
    workspaceIndex,
    DASHBOARD_SETTINGS_NAV_ITEM.segment,
  );
  const isSettingsActive = isDashboardNavActive(
    pathname,
    settingsHref,
    DASHBOARD_SETTINGS_NAV_ITEM.segment,
  );
  const SettingsIcon = DASHBOARD_SETTINGS_NAV_ITEM.icon;

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <WorkspaceSwitcher
          activeWorkspace={workspace}
          workspaces={workspaces}
          workspaceIndex={workspaceIndex}
        />
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        {DASHBOARD_NAV_GROUPS.map((group) => (
          <SidebarNavGroup
            key={group.labelKey}
            group={group}
            workspaceIndex={workspaceIndex}
            pathname={pathname}
            t={t}
          />
        ))}

        <SidebarGroup className={cn("mt-auto")}>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={settingsLabel}
                  isActive={isSettingsActive}
                  render={<Link href={settingsHref} />}
                >
                  <SettingsIcon />
                  <span>{settingsLabel}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
