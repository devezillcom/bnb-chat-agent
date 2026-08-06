"use client";

import {
  CalendarClockIcon,
  MessageSquarePlusIcon,
  SearchIcon,
} from "lucide-react";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { SettingsMenu } from "@/components/dashboard/settings-menu";
import { ThemeModeToggle } from "@/components/dashboard/theme-mode-toggle";
import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  PLACEHOLDER_CHATS,
  PLACEHOLDER_TEAM_PROJECTS,
} from "@/lib/dashboard/placeholder-data";

export function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <WorkspaceSwitcher />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="New chat">
              <MessageSquarePlusIcon />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Search">
                  <SearchIcon />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Scheduled tasks">
                  <CalendarClockIcon />
                  <span>Scheduled tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Team</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PLACEHOLDER_TEAM_PROJECTS.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton tooltip={project.name}>
                    <span className="flex size-5 items-center justify-center rounded-full bg-sidebar-accent text-[10px] font-medium">
                      {project.name.charAt(0)}
                    </span>
                    <span>{project.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="min-h-0 flex-1">
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent className="min-h-0">
            <ScrollArea className="h-[min(320px,calc(100vh-28rem))]">
              <SidebarMenu>
                {PLACEHOLDER_CHATS.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton tooltip={chat.title}>
                      <span
                        className={`flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${chat.iconColor}`}
                      >
                        {chat.icon}
                      </span>
                      <span className="truncate">{chat.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center justify-center gap-1">
          <SettingsMenu />
          <ThemeModeToggle />
          <LogoutButton />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
