"use client";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <DashboardSidebar />
      <SidebarInset className="bg-background">
        <div className="flex h-svh flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
            <SidebarTrigger />
            <span className="text-sm font-medium">BNB Chat Agent</span>
          </div>
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
