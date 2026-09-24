"use client";

import {
  BookOpenIcon,
  MessageCircleIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { useT } from "next-i18next/client";

import { ResourceListCapabilityLine } from "@/components/dashboard/resource-list-capability-line";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AgentListItemWithCapabilities } from "@/lib/agents/types";
import { getAgentAvatarUrl } from "@/lib/agents/utils/get-agent-avatar-url";
import { cn } from "@/lib/utils";

type AgentListCardProps = {
  agent: AgentListItemWithCapabilities;
  chatHref: string;
  detailHref: string;
};

function AgentListCardCapabilities({
  agent,
}: {
  agent: AgentListItemWithCapabilities;
}) {
  const groups = [
    { key: "tools", icon: WrenchIcon, names: agent.tools },
    { key: "skills", icon: SparklesIcon, names: agent.skills },
    {
      key: "knowledge-bases",
      icon: BookOpenIcon,
      names: agent.knowledgeBases,
    },
  ].filter((group) => group.names.length > 0);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      {groups.map((group) => (
        <ResourceListCapabilityLine
          key={group.key}
          icon={group.icon}
          names={group.names}
        />
      ))}
    </div>
  );
}

export function AgentListCard({
  agent,
  chatHref,
  detailHref,
}: AgentListCardProps) {
  const { t } = useT("dashboard");
  const avatarUrl = getAgentAvatarUrl(agent.name);
  const hasDescription = Boolean(agent.description);
  const hasCapabilities =
    agent.tools.length > 0 ||
    agent.skills.length > 0 ||
    agent.knowledgeBases.length > 0;

  return (
    <Card className="relative h-full cursor-pointer transition duration-200 hover:bg-muted/20 hover:shadow-sm hover:ring-foreground/20">
      <Link
        href={detailHref}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`${t("agentsList.view")} ${agent.name}`}
      />

      <CardHeader className="min-w-0 pb-0">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover"
          />

          <CardTitle className="min-w-0 flex-1 line-clamp-2">
            {agent.name}
          </CardTitle>
        </div>
      </CardHeader>

      {hasDescription || hasCapabilities ? (
        <CardContent className="space-y-3 pt-0">
          <AgentListCardCapabilities agent={agent} />

          {hasDescription ? (
            <p
              className={cn(
                "line-clamp-2 text-muted-foreground",
                hasCapabilities &&
                  "border-t border-border/50 pt-3 -mx-(--card-spacing) px-(--card-spacing)",
              )}
            >
              {agent.description}
            </p>
          ) : null}
        </CardContent>
      ) : null}

      <CardFooter className="pointer-events-none relative z-20 mt-auto gap-2">
        <Button
          variant="default"
          size="sm"
          className="pointer-events-auto"
          nativeButton={false}
          render={<Link href={chatHref} />}
        >
          <MessageCircleIcon data-icon="inline-start" />
          {t("agentsList.chat")}
        </Button>
      </CardFooter>
    </Card>
  );
}
