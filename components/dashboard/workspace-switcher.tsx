"use client";

import { useState } from "react";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Workspace } from "@/lib/dashboard/placeholder-data";
import { PLACEHOLDER_WORKSPACES } from "@/lib/dashboard/placeholder-data";
import { cn } from "@/lib/utils";

type WorkspaceSwitcherProps = {
  workspaces?: Workspace[];
};

export function WorkspaceSwitcher({
  workspaces = PLACEHOLDER_WORKSPACES,
}: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-sm font-semibold">
                {activeWorkspace.name.charAt(0)}
              </span>
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeWorkspace.name}</span>
              <span className="truncate text-xs capitalize text-muted-foreground">
                {activeWorkspace.role}
              </span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setActiveWorkspace(workspace)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background text-xs font-medium">
                    {workspace.name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span>{workspace.name}</span>
                    <span className="text-xs capitalize text-muted-foreground">
                      {workspace.role}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "ml-auto size-2 rounded-full bg-primary",
                      activeWorkspace.id !== workspace.id && "invisible",
                    )}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <PlusIcon className="size-4" />
                </div>
                <span className="text-muted-foreground">Create workspace</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function WorkspaceSwitcherCompact({
  workspaces = PLACEHOLDER_WORKSPACES,
}: WorkspaceSwitcherProps) {
  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-9 gap-2 px-2.5 font-normal md:hidden"
          />
        }
      >
        <div className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
          {activeWorkspace.name.charAt(0)}
        </div>
        <span className="max-w-[120px] truncate">{activeWorkspace.name}</span>
        <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Workspaces
          </DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace)}
            >
              {workspace.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
