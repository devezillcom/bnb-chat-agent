"use client";

import { usePathname } from "next/navigation";
import { useT } from "next-i18next/client";

import { AccountMenu } from "@/components/dashboard/account-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getDashboardHeaderTitleKey } from "@/lib/dashboard/get-dashboard-header-title-key";

type DashboardHeaderProps = {
  workspaceIndex: number;
};

export function DashboardHeader({ workspaceIndex }: DashboardHeaderProps) {
  const pathname = usePathname();
  const { t } = useT("dashboard");
  const titleKey = getDashboardHeaderTitleKey(pathname);

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <span className="truncate text-sm font-medium">{t(titleKey)}</span>
      </div>
      <AccountMenu workspaceIndex={workspaceIndex} />
    </header>
  );
}
