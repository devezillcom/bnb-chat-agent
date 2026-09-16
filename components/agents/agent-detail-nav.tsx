"use client";

import {
  BookOpenIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "next-i18next/client";

import { cn } from "@/lib/utils";

type AgentDetailNavProps = {
  agentBaseHref: string;
};

type NavItem = {
  key: string;
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Matches when the pathname starts with the item href. */
  prefix?: boolean;
};

export function AgentDetailNav({ agentBaseHref }: AgentDetailNavProps) {
  const pathname = usePathname();
  const { t } = useT("dashboard");

  const items: NavItem[] = [
    {
      key: "general",
      labelKey: "agentDetail.nav.general",
      href: agentBaseHref,
      icon: SettingsIcon,
    },
    {
      key: "instructions",
      labelKey: "agentDetail.nav.instructions",
      href: `${agentBaseHref}/instructions`,
      icon: SparklesIcon,
      prefix: true,
    },
    {
      key: "tools",
      labelKey: "agentDetail.nav.tools",
      href: `${agentBaseHref}/tools`,
      icon: WrenchIcon,
      prefix: true,
    },
    {
      key: "knowledge",
      labelKey: "agentDetail.nav.knowledge",
      href: `${agentBaseHref}/knowledge`,
      icon: BookOpenIcon,
      prefix: true,
    },
    {
      key: "environments",
      labelKey: "agentDetail.nav.environments",
      href: `${agentBaseHref}/environments`,
      icon: SlidersHorizontalIcon,
      prefix: true,
    },
  ];

  const normalizedPath = pathname.replace(/\/$/, "");

  function isActive(item: NavItem) {
    const normalizedHref = item.href.replace(/\/$/, "");

    if (item.prefix) {
      return normalizedPath.startsWith(normalizedHref);
    }

    return normalizedPath === normalizedHref;
  }

  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-border">
      {items.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;

        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors",
              "after:absolute after:inset-x-2 after:-bottom-px after:h-0.5 after:rounded-full after:transition-colors",
              active
                ? "text-foreground after:bg-primary"
                : "text-muted-foreground hover:text-foreground after:bg-transparent",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
