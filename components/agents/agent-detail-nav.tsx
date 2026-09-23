"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpenIcon,
  ScrollTextIcon,
  SettingsIcon,
  SparklesIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "next-i18next/client";

import type { AgentKnowledgeBaseItem } from "@/lib/knowledge-base/types";
import type { AgentSkillItem } from "@/lib/skills/types";
import type { AgentToolItem } from "@/lib/tools/types";
import { cn } from "@/lib/utils";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentDetailNavProps = {
  agentBaseHref: string;
  workspaceId: string;
  agentId: string;
};

type NavItem = {
  key: string;
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Matches when the pathname starts with the item href. */
  prefix?: boolean;
  count?: number;
};

async function fetchAgentSkills(
  workspaceId: string,
  agentId: string,
): Promise<AgentSkillItem[]> {
  const res = await workspaceFetch(workspaceId, `/api/agents/${agentId}/skills`);
  const data = (await res.json()) as AgentSkillItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load skills.");
  }

  return data;
}

async function fetchAgentTools(
  workspaceId: string,
  agentId: string,
): Promise<AgentToolItem[]> {
  const res = await workspaceFetch(workspaceId, `/api/agents/${agentId}/tools`);
  const data = (await res.json()) as AgentToolItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load tools.");
  }

  return data;
}

async function fetchAgentKnowledgeBases(
  workspaceId: string,
  agentId: string,
): Promise<AgentKnowledgeBaseItem[]> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/agents/${agentId}/knowledge-bases`,
  );
  const data = (await res.json()) as AgentKnowledgeBaseItem[] & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.message ?? data.error ?? "Could not load knowledge bases.",
    );
  }

  return data;
}

function NavCountBadge({
  count,
  active,
}: {
  count: number;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        active
          ? "bg-primary/10 text-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {count}
    </span>
  );
}

export function AgentDetailNav({
  agentBaseHref,
  workspaceId,
  agentId,
}: AgentDetailNavProps) {
  const pathname = usePathname();
  const { t } = useT("dashboard");

  const { data: agentSkills = [] } = useQuery({
    queryKey: ["agent-skills", workspaceId, agentId],
    queryFn: () => fetchAgentSkills(workspaceId, agentId),
  });
  const { data: agentTools = [] } = useQuery({
    queryKey: ["agent-tools", workspaceId, agentId],
    queryFn: () => fetchAgentTools(workspaceId, agentId),
  });
  const { data: knowledgeBases = [] } = useQuery({
    queryKey: ["agent-knowledge-bases", workspaceId, agentId],
    queryFn: () => fetchAgentKnowledgeBases(workspaceId, agentId),
  });

  const documentCount = knowledgeBases.reduce(
    (total, knowledgeBase) => total + knowledgeBase.documentCount,
    0,
  );

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
      icon: ScrollTextIcon,
      prefix: true,
    },
    {
      key: "skills",
      labelKey: "agentDetail.nav.skills",
      href: `${agentBaseHref}/skills`,
      icon: SparklesIcon,
      prefix: true,
      count: agentSkills.length,
    },
    {
      key: "tools",
      labelKey: "agentDetail.nav.tools",
      href: `${agentBaseHref}/tools`,
      icon: WrenchIcon,
      prefix: true,
      count: agentTools.length,
    },
    {
      key: "knowledge",
      labelKey: "agentDetail.nav.knowledge",
      href: `${agentBaseHref}/knowledge`,
      icon: BookOpenIcon,
      prefix: true,
      count: documentCount,
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
            {item.count !== undefined ? (
              <NavCountBadge count={item.count} active={active} />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
